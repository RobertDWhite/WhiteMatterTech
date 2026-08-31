---
title: "One Encrypted Room Per Signal: Matrix as a Notification Hub on Kubernetes"
date: "2026-08-29"
categories:
  - "kubernetes"
  - "security"
  - "homelab"
  - "tutorials"
tags:
  - "matrix"
  - "synapse"
  - "encryption"
  - "privacy"
  - "kubernetes"
  - "hookshot"
  - "maubot"
  - "webhooks"
  - "sops"
  - "self-hosted"
aliases:
  - /posts/encrypted-matrix-notification-hub/encrypted-matrix-notification-hub
  - /2026/encrypted-matrix-notification-hub
cover:
  image: "cover.png"
  alt: "A central encrypted Matrix room receiving sealed notifications from a dark network of machine nodes"
---

--------------------------------------------------------

# Introduction

Three years ago I wrote about [running a Matrix server with Docker Compose](/posts/encrypted-matrix-server/), where the interesting part was the federation-over-Cloudflare-tunnel arrangement and the observation that a Matrix homeserver makes a serviceable notification hub. That deployment has since moved into my RKE2 cluster, and the notification role has grown from a convenience into the primary reason the homeserver exists.

Nearly every machine-generated message in my infrastructure now arrives in an end-to-end encrypted Matrix room. Feed digests from FreshRSS, Prometheus alerts, GitOps deployment results, Falco runtime detections, Authentik authentication events, media-library activity, uptime state changes, weather alerts, and notifications from the UniFi and Synology appliances all terminate in rooms whose contents the homeserver itself cannot read. Two AI agents also use encrypted Matrix rooms, each reserved for direct conversation with the agent.

The notification stream has become a running account of the infrastructure around me: its failures, its changes, the identities that pass through it, the moments when the house is occupied, and the subjects that hold my attention. Machine-written messages can still disclose a private life. The absence of a human author does not make the resulting record any less sensitive. I built this system around that premise, and this post follows the route from producer, through Kubernetes and the homeserver, to the encrypted Matrix room, following the conversion of a webhook payload into a Matrix event.

--------------------------------------------------------

# Why Machine Notifications Deserve End-to-End Encryption

Encryption is usually defended through human conversation. A machine-generated notification looks less intimate, yet a year's accumulation can reveal far more.

Consider what a year of my notification stream describes to a reader unfamiliar with the network. It names every host, service, and monitor by the labels I assigned. It records which services fail, how often, and for how long, producing a serviceable map of the infrastructure's weak points. It records each authentication event that Authentik considers notable, including failed logins, policy exceptions, and suspicious requests, together with the account involved. It records every camera and door event that the UniFi Protect stack considers significant, a record of when the house is occupied. It records what my media stack acquires and when, a record of what I watch and read. It records what my feed pipeline finds interesting, a record of what has captured my attention and, by implication, why.

Any one message may be harmless. The accumulated stream is a detailed intelligence record about a residence and the person living in it, assembled at no cost by the notification service and delivered continuously.

The conventional destinations for that stream are Slack, Discord, Telegram, a hosted push service, or email. Each receives plaintext and retains it. Each is also a third party whose retention policy, breach history, and legal exposure are outside your control. A webhook to a chat service does more than transmit the description. It deposits a permanent, searchable copy with an organization that has no stake in protecting it. TLS already addresses interception in transit. The remaining failure is prosaic and total. A complete operational map of your infrastructure persists in someone else's database because the integration was convenient.

Self-hosting removes the third party. The homeserver operator can still read every room. That may be tolerable when the operator is you and the deployment is small. It becomes a different proposition once a backup lands on a NAS, replication sends it off-site, or restoration puts it on a machine beyond your control. Anyone with homeserver access has the room contents as well.

End-to-end encryption changes the exposure. Synapse stores ciphertext, while the decryption keys remain on the participating devices. My homeserver database, its Postgres backups, its Longhorn volumes, and their snapshots contain no readable notification content. A compromise still yields room metadata, including membership, timing, and event-graph shape. It does not yield message bodies. Matrix provides that protection as a property of the room, independent of any particular client.

The deployment acquired a second purpose over those three years. I now talk to two agents through their own encrypted Matrix rooms. The same system records the condition of the infrastructure and gives me a private place to issue instructions about it. I treat that conjunction as a control plane and encrypt it accordingly.

--------------------------------------------------------

# The Stack

Everything lives in one `matrix` namespace and is deployed by a single ArgoCD Application that points at one Kustomize directory:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: matrix-stack
  namespace: argocd
spec:
  project: default
  source:
    repoURL: git@github.com:RobertDWhite/whitehouse-rke2.git
    targetRevision: main
    path: matrix-stack
  destination:
    server: https://kubernetes.default.svc
    namespace: matrix
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

The directory holds nine components. The arrangement is intentionally plain, with one namespace, one Git path, and one ArgoCD object reconciling the whole thing.

| Component | Role |
| --- | --- |
| **Synapse** | The homeserver. One replica, `Recreate` strategy, Postgres-backed. |
| **Postgres** | Synapse's database, with a separate `postgres-exporter` deployment for Prometheus. |
| **Redis** | Hookshot's cache, with a separate `redis-exporter` deployment for Prometheus. |
| **Element** | The primary web client. |
| **Cinny** and **FluffyChat** | Alternative web clients on the same homeserver. |
| **Hookshot** | The appservice that turns HTTP webhooks into encrypted room messages. |
| **Maubot** | The plugin bot framework, including polling integrations without webhook support. |
| **Postfix** | An SMTP relay that allows Synapse to send invitation and password-reset mail. |
| **well-known** | An nginx pod serving the two delegation documents. |

This is the part I return to when a notification behaves strangely. I can inspect one ArgoCD Application, one Kustomize tree, and one namespace policy. Nothing material is hidden behind a second control surface.

The manifest records image tags in `kustomization.yaml`. Postgres and Redis are pinned by digest. Several utility and bridge images still use mutable tags, which leaves a supply-chain surface. The principal application entries are:

```yaml
images:
  - name: matrixdotorg/synapse
    newTag: "v1.153.0"
  - name: vectorim/element-web
    newTag: "v1.12.20"
  - name: dock.mau.dev/maubot/maubot
    newTag: "v0.6.0"
  - name: postgres
    newTag: "15"
    digest: "sha256:1b92e7a80c021647bf70f5d3eb66066a998e4f5cf43c07bb9dc9f729782cf88e"
  - name: redis
    newTag: "8"
    digest: "sha256:4d25e2fe601f7ffaeb4437cb6ced3518bc36edf34ebe98863c80836943d94529"
```

Every secret in the namespace is a SOPS-encrypted file decrypted at sync time by ksops, including the federation signing key, the single credential that establishes this server's identity to the rest of the federation:

```yaml
apiVersion: viaduct.ai/v1
kind: ksops
metadata:
  name: matrix-secrets
  annotations:
    config.kubernetes.io/function: |
      exec:
        path: ksops
files:
  - synapse/synapse-secret.sops.yaml
  - secrets/signing-key.sops.yaml
  - postgres/postgres-secret.sops.yaml
  - hookshot/hookshot-secret.sops.yaml
  - maubot/maubot-secret.sops.yaml
  - maubot/maubot-configmap.sops.yaml
  - projects/postfix/postfix-smtp-secret.sops.yaml
```

--------------------------------------------------------

# Homeserver Configuration

Homeserver configuration establishes the server's identity at the outset. `server_name` enters every user identifier. Changing it later means abandoning the identifiers and rooms created beneath it.

## Naming and Delegation

My `server_name` is `white.fm`. Synapse runs at `matrix.white.fm`. User identifiers read `@robert:white.fm`, while the homeserver can move later without breaking a single identifier.

```yaml
server_name: "white.fm"
public_baseurl: "https://matrix.white.fm/"
web_client_location: "https://element.white.fm/"
report_stats: false
```

Delegation is what makes that split work. Two documents served from the apex domain tell federating servers and clients where the homeserver is:

`/.well-known/matrix/server`:

```json
{ "m.server": "matrix.white.fm:443" }
```

`/.well-known/matrix/client`:

```json
{ "m.homeserver": { "base_url": "https://matrix.white.fm" } }
```

A two-line nginx pod serves those documents from a ConfigMap, while Gateway API routes attach the path prefix to the apex hostname:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: white-fm-root
  namespace: matrix
spec:
  parentRefs:
    - name: main
      namespace: envoy-gateway-system
      sectionName: https-root-white-fm
  hostnames:
    - white.fm
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /.well-known/matrix
      backendRefs:
        - name: matrix-well-known
          port: 80
```

The client document must be valid JSON with a `Content-Type` of `application/json`. Clients parse it strictly. A stray comment or trailing comma produces a login failure whose error message never mentions the well-known document. The delegation must also be reachable from the public internet even if the homeserver is private, because remote servers resolve it before attempting federation.

## Secrets Outside the ConfigMap

I keep Synapse's configuration file in a ConfigMap, while the database credentials belong in a Secret. An init container renders the final file with `envsubst` into an `emptyDir`, pulling the values from the SOPS-decrypted Secret:

```yaml
initContainers:
  - name: render-config
    image: bitnami/kubectl
    command: ["sh", "-c", "envsubst < /config/homeserver.yaml > /rendered/homeserver.yaml"]
    env:
      - name: POSTGRES_HOST
        value: matrix-postgresql
      - name: POSTGRES_PASSWORD
        valueFrom:
          secretKeyRef:
            name: matrix-postgresql-secret
            key: POSTGRES_PASSWORD
    volumeMounts:
      - { name: config-raw,      mountPath: /config }
      - { name: config-rendered, mountPath: /rendered }
```

The committed ConfigMap holds `${POSTGRES_PASSWORD}`, and the init container substitutes the value at runtime. The rendered file is ephemeral. It never reaches the repository, an image layer, or a persistent volume.

Synapse reads `registration_shared_secret`, `macaroon_secret_key`, `form_secret`, and the OIDC client secret from files in `synapse-secrets`. The pod mounts the signing key separately at `/data/white.fm.signing.key`.

## Hardening the Defaults

Synapse ships defaults suited to a public homeserver on a large federation. Four changes narrow that exposure for a private one:

```yaml
presence:
  require_auth_for_profile_requests: true
  limit_profile_requests_to_users_who_share_rooms: true
  include_profile_data_on_invite: false
  allow_public_rooms_over_federation: true

enable_registration: true
registrations_require_3pid:
  - email
```

The first three prevent an unauthenticated remote server from enumerating profiles. I leave the fourth open to keep the public channel discoverable over federation. Everything operational stays in encrypted rooms outside the public directory. The listing exposes the channel. It does not expose the infrastructure behind those rooms.

Registration stays enabled but requires a verified email address, and my own account authenticates through OIDC in place of a password:

```yaml
oidc_providers:
  - idp_id: microsoft
    idp_name: Microsoft
    issuer: "https://login.microsoftonline.com/<tenant>/v2.0"
    client_id: "<client-id>"
    client_secret: "/secrets/oidc_client_secret"
    scopes: ["openid", "profile"]
    user_mapping_provider:
      config:
        localpart_template: "{{ user.preferred_username.split('@')[0] }}"
        display_name_template: "{{ user.name }}"
```

I keep the distinction clear in my own deployment. OIDC authenticates the *account*. Room-encryption keys remain on the participating devices and live independently of the identity provider. An IdP outage locks me out of the account for its duration. Losing every logged-in device is worse. Without client-side key backup, the history of my encrypted rooms goes with them. I configure key backup before I need it.

## Publishing

Only four hostnames reach the public internet through the Cloudflare tunnel and the Envoy Gateway `https-white-fm` listener: `matrix.white.fm` (the homeserver), `element.white.fm` (the client), `webhooks.white.fm` (webhook ingest), and `hookshot.white.fm` (the widget API). Everything else, including the Maubot administrative interface and the alternative clients, is reachable only on `*.internal.white.fm`, resolved by internal DNS. The homeserver route has an extended timeout because federation requests to slow remote servers exceed the gateway default:

```yaml
hostnames:
  - matrix.white.fm
rules:
  - backendRefs:
      - name: synapse
        port: 8008
    timeouts:
      request: "90s"
```

The namespace declares default-deny ingress and egress, but an `allow-all-egress` policy currently reopens egress for every pod. Ingress allowances cover the cluster ingress path, Prometheus scraping on the three metrics ports, and the specific namespaces that post webhooks in-cluster.

--------------------------------------------------------

# Encrypted Webhooks

The tidy abstraction ends at the webhook boundary. A webhook is an HTTP POST request containing JSON and no authentication by default. An encrypted Matrix room expects Megolm-encrypted events. The webhook protocol cannot produce one. A process between them must act as a Matrix client, hold device keys, and participate in the room's key-sharing. It receives the payload, composes the event, and performs the encryption.

My original solution paired the `matrix-encrypted-webhooks` container with Maubot for polling integrations. That is the arrangement described in the 2023 post. It worked, but every new webhook meant editing a config file on a volume and restarting the pod.

That role now belongs to [Hookshot](https://github.com/matrix-org/matrix-hookshot), which registers with Synapse as an *appservice*. An appservice is a first-class server-side integration with its own namespace of users and a shared registration token, and Hookshot maintains its own Olm/Megolm crypto store, which allows it to encrypt into rooms as a real device:

```yaml
bridge:
  domain: white.fm
  url: http://synapse:8008
  mediaUrl: https://matrix.white.fm
  port: 9993
  bindAddress: 0.0.0.0

passFile: /secrets/passkey.pem

generic:
  enabled: true
  urlPrefix: https://webhooks.white.fm/webhook/
  allowJsTransformationFunctions: true
  waitForComplete: false

cache:
  redisUri: redis://matrix-redis:6379

encryption:
  storagePath: /data/encryption

permissions:
  - actor: white.fm
    services:
      - service: "*"
        level: admin
```

Three details decide whether this configuration survives a restart, a redeployment, and the next delivery.

`encryption.storagePath` must be a persistent volume. It holds the appservice's device identity and Megolm session state. Losing it interrupts delivery and produces a new device that other members have not verified. Messages sent by the original device become permanently undecryptable to anyone who joins afterward. No other PVC in this stack loses cryptographic continuity when it disappears.

`cache.redisUri` moves Hookshot's transient state out of the pod, which is what makes a restart cheap.

The `permissions` block is the one I got wrong. Current Hookshot webhook commands use the `generic` service permission. The legacy `webhooks` value caused provisioning failures in my deployment with no useful error or log line. The wildcard `"*"` covers generic webhooks, feeds, and the GitHub service.

## Creating a Webhook Without the Legacy Provisioning API

Hookshot 7.0 removed its legacy HTTP provisioning API. Webhook creation now goes through Matrix, either through the room widget or by asking the bot in the room. Both paths are interactive, and neither is scriptable. That is a poor fit when the webhook belongs to a CronJob deployed from a manifest.

A webhook is a `uk.half-shot.matrix-hookshot.generic.hook` state event in the room. Hookshot notices the new state event, mints a hook ID, and records the mapping in its own room account data. Both steps use ordinary client-server API operations, which makes the flow scriptable:

```python
# 1. Mint a one-shot server admin using registration_shared_secret
nonce = req("GET", "/_synapse/admin/v1/register")["nonce"]
mac_input = nonce.encode() + b"\0" + user.encode() + b"\0" + pw.encode() + b"\0admin"
mac = hmac.new(SHARED_SECRET, mac_input, hashlib.sha1).hexdigest()
admin = req("POST", "/_synapse/admin/v1/register",
            body={"nonce": nonce, "username": user, "password": pw,
                  "admin": True, "mac": mac})

# 2. Impersonate a user already in the room
as_token = req("POST", f"/_synapse/admin/v1/users/{AS_USER}/login",
               token=admin["access_token"], body={})["access_token"]

# 3. Write the state event; Hookshot picks it up and assigns a hook ID
req("PUT", f"/_matrix/client/v3/rooms/{room}/state/{HOOK_EVENT}/{name}",
    token=as_token, body={"name": name})

# 4. Read the assigned ID back from the bot's room account data,
#    then deactivate and erase the temporary admin in a finally block
```

The full script runs inside the Synapse pod, where `127.0.0.1:8008` is the admin listener and the shared secret is already mounted. It introduces no new long-lived credential. It writes the state event directly, which keeps the room history clean and avoids any need to decrypt content. The bot-command path would require the script to read an encrypted room. A state event is unencrypted by design. In a `finally` block, the script deactivates and erases the temporary admin even when one of the remaining operations fails.

The result is one line on stdout:

```sh
./mkwebhook.sh '!FAYyekTFiXsNeJJlFc:white.fm' fleet
# https://webhooks.white.fm/webhook/<hook-id>
```

## Transformation Functions

When Hookshot renders a raw media-service or Alertmanager payload directly into a room, the result is a wall of JSON. Its `allowJsTransformationFunctions` setting accepts a JavaScript function stored in the room's state event. The function converts each payload into formatted text before Hookshot composes and encrypts the message:

```js
result = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);

  const sev  = data.severity.toLowerCase();
  const icon = sev === "alert" ? "🚨" : sev === "warning" ? "⚠️" : "🔔";

  return {
    version: "v2",
    empty:   false,
    plain:   `${icon} Authentik · ${data.severity}\n${data.body}`,
    html:    `<b>${icon} Authentik</b><br>${esc(data.body).replace(/\n/g, "<br>")}`,
    msgtype: "m.notice",
  };
})();
```

Every transform I run escapes its output. The client renders the `html` field, and the payload may report on attacker-controlled input such as a monitor name, an article title, or a username in a failed-login event. Unescaped input creates a direct injection path into the room. Escape it at the boundary.

Two properties of transforms are easy to misread. They execute in the Hookshot process before encryption, which means Hookshot sees every payload in cleartext because it performs the encryption. The transform also lives in room state. Anyone who can write state in that room can change the code Hookshot executes on incoming payloads. Treat that permission as code deployment.

The repository files document my transforms, yet they do not control the deployed versions. Hookshot reads the code stored in room state. Editing a repository file has no effect until the corresponding state event is updated. I have lost more than one debugging session to that distinction.

--------------------------------------------------------

# Where My Messages Enter the Rooms

I have three paths into the rooms, each with its own trust boundary.

**In-cluster producers** post over plain HTTP to `matrix-hookshot.matrix.svc.cluster.local:9000`, permitted by an explicit NetworkPolicy per source namespace. **External and appliance producers** post over HTTPS to `webhooks.white.fm/webhook/<id>` through the Cloudflare tunnel. **Bots** hold their own access tokens and speak the client-server API directly.

| Producer | Path | Room content |
| --- | --- | --- |
| FreshRSS + BI pipeline | In-cluster → Hookshot | Feed entries, scored account alerts, daily digest |
| Alertmanager | Public webhook | Prometheus alerts, `critical` and `warning` |
| Falco (via falcosidekick) | Public webhook | Runtime security detections at `error` and above |
| Authentik | Public webhook | Login failures, policy exceptions, suspicious requests |
| Media managers | Public webhook | Grabs, imports, deletions, health |
| Uptime Kuma | In-cluster → Hookshot | Monitor state changes |
| UniFi Network / Protect | Appliance → public webhook | Device and camera events |
| Synology DSM | Appliance → public webhook | Storage, backup, and device events |
| Weather alerts | External → public webhook | Watches, warnings, advisories |
| GitHub / GitOps | Maubot plugin | Repository and deployment activity |
| Hermes, Jarvis | Client-server API | Conversation |

The RSS path is the most developed because it handles the greatest volume. My [FreshRSS intelligence pipeline](/posts/rss-intelligence-pipeline/) runs as a CronJob every thirty minutes, clusters near-duplicate stories, extracts a structured event with a local model, scores it against profiles, and posts the survivors. Its transform handles three payload shapes on one hook (the scored alert digest, a plain-text digest from a separate CronJob, and individual feed entries) and falls back to a formatted JSON dump for anything unrecognized. That fallback has repeatedly been how I discovered that a producer had changed its payload shape.

The declarative boundary ends at the appliances. UniFi, Synology, and the weather source are outside Kubernetes. Their webhook configuration lives in each device's own interface and outside git. One manual step remains. The URL is a bearer credential in an appliance's settings page. Recovery means regenerating it, and a reset appliance needs the webhook entered by hand.

Maubot handles the remaining niche. Hookshot is push-driven and appservice-backed. Maubot runs plugin bots that poll, including the GitHub and RSS integrations, and each bot is a Matrix client with its own device. Anything that can push goes to Hookshot. Maubot polls the services that cannot.

--------------------------------------------------------

# Noise Is the Actual Operational Difficulty

Encryption was the easy part. Keeping the rooms readable was not.

An unfiltered notification hub becomes a room nobody reads. That produces a false sense of coverage, which is worse than no channel at all. I use three controls to keep the rooms readable. All three arrived after the rooms had become unusable.

The transform is the final and most precise filter: it can discard a message entirely by returning `empty: true`. Uptime Kuma fires on every state transition, which means that recoveries and retries generate traffic alongside failures. I want the room to report the failure itself:

```js
const MUTED = new Set(["Weather API", "LazyLibrarian", "Media MCP", "Media indexer"]);
if (hb.status === 1 || hb.status === 2 || MUTED.has(mon.name)) {
  return { version: "v2", empty: true };
}
```

I drop recoveries and pending retries and mute a short list of chronic flappers by name. Current state remains on the Kuma dashboard. The room records state transitions.

Alertmanager needed the same treatment at the routing layer, before the transform stage:

```yaml
route:
  group_by: [alertname, namespace, pod]
  group_wait: 1m
  group_interval: 30m
  repeat_interval: 12h
```

`group_interval` was originally five minutes, which meant a single flapping pod could generate a notification every five minutes indefinitely. Thirty minutes lets the alert stream settle and batches several flap cycles into one message. `repeat_interval` moved from four hours to twelve for the same reason. Once I am already watching an incident, another notification every four hours adds volume without changing a decision. Both receivers set `send_resolved: false`. The useful signal is *this started firing*. The corresponding *it stopped* doubles the volume without changing my response.

The third control is an inhibit rule added after an eleven-hour episode in which a crash-looping Alertmanager alerted me about the crash-looping Alertmanager through the very pod that was crash-looping:

```yaml
inhibit_rules:
  - source_matchers: [alertname="PodCrashLooping", namespace="observability"]
    target_matchers: [alertname="PodCrashLooping", namespace="observability"]
    equal: [pod]
```

--------------------------------------------------------

# Agents in Encrypted Matrix Rooms

Two AI agents use the same Matrix encryption as the human users. Hermes has a dedicated home room for direct correspondence. OpenClaw may enter one allowed group room.

Hermes, my personal agent gateway, runs as `@hermes:white.fm`:

```yaml
- name: MATRIX_HOMESERVER
  value: https://matrix.white.fm
- name: MATRIX_USER_ID
  value: "@hermes:white.fm"
- name: MATRIX_ENCRYPTION
  value: "true"
- name: MATRIX_HOME_ROOM
  value: "!AJjNfrvHsszhSMMsjY:white.fm"
- name: MATRIX_REQUIRE_MENTION
  value: "true"
```

OpenClaw runs as `@jarvis:white.fm` with the same encryption settings and a tighter join policy, using `autoJoin: "allowlist"`, `groupPolicy: "allowlist"`, and `requireMention: true` for the one group room it may enter.

I learned three consequences of that decision in operation.

**A bot in an encrypted room holds that room's keys.** The bot is a cryptographic device, much like a human user's phone or browser, and its device identity deserves the same protection. Compromising the agent's pod yields plaintext from every room it has joined. Both agents keep their state on a backed-up PVC for that reason. Both also need restrictive egress. The namespace's current `allow-all-egress` policy restores unrestricted egress to every pod.

**Mention-gating controls when an agent wakes.** Hermes's home room is reserved for direct conversation, while OpenClaw's `requireMention: true` keeps the agent from replying to every message in its allowed group room. The setting controls cost and keeps machine-generated events from becoming instructions without a person in the loop.

**The filesystem mounts define the agent's practical reach.** I mount the Synology media, books, and downloads exports read-write in Hermes for its file tooling. I leave `/volume1/Personal` out. Anyone who can send Hermes a message through Matrix, Telegram, or iMessage can reach anything I mount into it. Encryption protects the channel. A filesystem handed to something that answers strangers remains exposed.

The [Hermes design](/posts/hermes-encrypted-agent-authority/) deserves its own treatment. Its dedicated encrypted room is part of the control plane.

--------------------------------------------------------

# Security Notes

**Hookshot is the encryption boundary in this stack.** TLS protects a webhook request to the gateway. Inside the cluster, some producers use plain HTTP, and the request itself is not end-to-end encrypted. Hookshot receives cleartext, runs the transform, and encrypts as it composes the room event. Message content is unreadable at rest in the homeserver database and to anyone who compromises Synapse. Hookshot can read it. Anyone intercepting the request before it reaches Hookshot can read it too. In-cluster producers using plain HTTP depend entirely on NetworkPolicy for that leg, which is why each source namespace has an explicit policy instead of a blanket allowance.

**A webhook URL is a bearer credential.** Anyone holding `https://webhooks.white.fm/webhook/<id>` can post to that room forever with no additional authentication. These URLs belong in secret management with the same seriousness as an API key. A manifest comment, public repository, or screenshot is an unacceptable place for one. Mine reach the public internet through the Cloudflare tunnel. The URL is the entire access control. Rotation means creating a new hook and updating each producer, which is why I keep the number of producers per hook small.

**`registration_shared_secret` is an admin-equivalent credential.** It can mint server administrators without any existing account. The webhook script relies on that capability. It should exist only inside the pod, and tooling using it should create a temporary admin, do the work, and erase the account in a `finally` block. Do not keep a standing admin token.

**Transformation functions are code stored in room state.** Anyone with permission to write state events in a room can change the JavaScript that Hookshot executes on every incoming payload for that hook. Room power levels determine who can alter executable code in this design. Set them accordingly, and audit the state events in rooms where transforms are enabled.

**Payloads are untrusted input.** A monitor name, an article title, a container name, and a username in a failed-login event can all be attacker-influenced. Escape every field on the way into the `html` output. My transforms do this uniformly. It is the single most common omission I see in webhook transforms published elsewhere.

**Key loss is data loss, and the failure is silent.** Hookshot's `encryption.storagePath` and the agents' data volumes hold device identities and Megolm sessions. Restore a pod without its volume and it becomes a new, unverified device. Old messages do not become readable again. The interface offers little more than an unverified-device warning that is easy to dismiss. Back up those volumes and configure client-side key backup for human accounts before you need it.

**Federation exposes more than room content.** End-to-end encryption protects message bodies. Membership, timing, room structure, and the existence of a room remain visible. `allow_public_rooms_over_federation: true` remains enabled for one discoverable public channel, which allows any federating server to enumerate the public room directory. Everything operational lives in encrypted, non-published rooms. That separation is the control.

**Assume the appliance webhooks are the weak link.** UniFi, Synology, and similar devices hold the webhook URL in a settings page, transmit over whatever TLS stack their firmware ships, and offer no rotation story. They are the least controlled producers in the stack. They also report on presence in the house. Give them their own hooks and rooms. A leaked URL from a device reset then has a bounded blast radius.

--------------------------------------------------------

# Wrapping Up

The appservice crypto store and the state-event provisioning path around a removed API were interesting to build. Noise proved harder than encryption, which is why the larger question is where those messages belong in the first place.

Every self-hosted stack generates a notification stream. The default destination is a third-party chat service, usually chosen because the integration takes four minutes. That choice hands a continuously updated description of your infrastructure, your habits, and your presence in the house to an organization with no stake in protecting it. One homeserver, one appservice, and an afternoon produce an arrangement in which the server operator, including me, cannot read the rooms.

For me, that last property settles the question. The cryptographic design removes trust in the server operator from the server's operation. A declaration of good intent cannot do that.

I keep a public channel for this blog at [#whitematter:white.fm](https://matrix.to/#/%23whitematter:white.fm). It federates, which allows any Matrix account to join and ask about this post or any other subject.

Raise questions or corrections in a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), submit a [GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or send email to [robert@whitematter.tech](mailto:robert@whitematter.tech). You may also [join the WhiteMatterTech Matrix channel](https://matrix.to/#/%23whitematter:white.fm) to discuss the post there.

Robert
