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

Nearly every machine-generated message in my infrastructure now arrives in an end-to-end encrypted Matrix room. Feed digests from FreshRSS, Prometheus alerts, GitOps deployment results, Falco runtime detections, Authentik authentication events, media-library activity, uptime state changes, weather alerts, and notifications from the UniFi and Synology appliances all terminate in rooms whose contents the homeserver itself cannot read. Two AI agents live in those same encrypted rooms and answer questions there.

The argument for doing this is narrower than the general proposition that encryption is beneficial. A notification stream is an operational description of the infrastructure, changing as the infrastructure changes; it merits the confidentiality of a private conversation. The rest of this post follows that description from its producers through Kubernetes and the homeserver to the encrypted room, with particular attention to the transition from webhook payload to Matrix event, where the encryption boundary is most often misunderstood.

--------------------------------------------------------

# Why Machine Notifications Deserve End-to-End Encryption

The familiar case for encrypted messaging is human conversation. The case for machine-generated notifications is less intuitive and, in some respects, stronger.

Consider what a year of my notification stream describes to a reader unfamiliar with the network. It names every host, service, and monitor by the labels I assigned. It records which services fail, how often, and for how long, producing a serviceable map of the infrastructure's weak points. It records each authentication event that Authentik considers notable — failed logins, policy exceptions, suspicious requests — together with the account involved. It records every camera and door event that the UniFi Protect stack considers significant, a record of when the house is occupied. It records what my media stack acquires and when, a record of what I watch and read. It records what my feed pipeline finds interesting, a record of what has captured my attention and, by implication, why.

No individual message in that stream is especially sensitive. The aggregate is a detailed intelligence record about a residence and the person living in it, assembled at no cost by the notification service and delivered continuously.

The conventional destinations for that stream are Slack, Discord, Telegram, a hosted push service, or email. Each receives the messages in plaintext and retains them, and each is a third party whose retention policy, breach history, and legal exposure are outside your control. A webhook to a chat service does more than transmit the description; it deposits a permanent, searchable copy of it with an organization that has no stake in protecting it. TLS already addresses interception in transit. The serious failure is that a complete operational map of your infrastructure sits in someone else's database indefinitely, for the ordinary reason that the integration was convenient.

Self-hosting the destination reduces the difficulty without resolving it. The third party disappears, but the homeserver operator can still read every room. That is acceptable when the operator is you and the deployment is small. It ceases to be acceptable when the database is backed up to a NAS, replicated off-site, or restored on a machine you no longer control; anyone who obtains access to the homeserver obtains access to the room contents as well.

End-to-end encryption addresses the residual exposure. In an encrypted Matrix room, Synapse stores ciphertext; the decryption keys reside on the devices that participate in the room. My homeserver database, its Postgres backups, its Longhorn volumes, and their snapshots contain no readable notification content. Compromising the server yields room metadata — membership, timing, and event-graph shape — but not the message bodies. That is a materially smaller disclosure, and Matrix provides the protection as a property of the room, independent of any particular client.

There is a second reason, absent from the deployment three years ago. Notification channels have become bidirectional. Two AI agents in my cluster are members of these rooms, and I talk to them there. A channel carrying both a description of the infrastructure and instructions about it is a control plane. Control planes get encrypted.

--------------------------------------------------------

# The Stack

Everything lives in one `matrix` namespace, deployed by a single ArgoCD Application that points at one Kustomize directory:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: matrix-stack
  namespace: argocd
spec:
  project: apps
  source:
    repoURL: git@github.com:RobertDWhite/whitehouse-rke2.git
    targetRevision: main
    path: apps/social/matrix-stack
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

The directory holds nine components. The arrangement is intentionally plain: one namespace, one Git path, and one ArgoCD object to reconcile the whole thing:

| Component | Role |
| --- | --- |
| **Synapse** | The homeserver. One replica, `Recreate` strategy, Postgres-backed. |
| **Postgres** | Synapse's database, with a `postgres-exporter` sidecar for Prometheus. |
| **Redis** | Hookshot's cache, with a `redis_exporter` sidecar. |
| **Element** | The primary web client. |
| **Cinny** and **FluffyChat** | Alternative web clients on the same homeserver. |
| **Hookshot** | The appservice that turns HTTP webhooks into encrypted room messages. |
| **Maubot** | The plugin bot framework — polling integrations, including those without webhook support. |
| **Postfix** | An SMTP relay that allows Synapse to send invitation and password-reset mail. |
| **well-known** | An nginx pod serving the two delegation documents. |

This is the part of the arrangement I care about. When I need to follow a notification from producer to room, I can inspect one ArgoCD Application, one Kustomize tree, and one namespace policy; there is no second control surface hiding somewhere else.

All image tags are pinned in `kustomization.yaml`, with digest pins on Postgres and Redis where a moving tag would otherwise become a supply-chain surface:

```yaml
images:
  - name: matrixdotorg/synapse
    newTag: "v1.159.0"
  - name: vectorim/element-web
    newTag: "v1.12.26"
  - name: dock.mau.dev/maubot/maubot
    newTag: "v0.6.0"
  - name: postgres
    newTag: "15"
    digest: "sha256:1b92e7a80c021647bf70f5d3eb66066a998e4f5cf43c07bb9dc9f729782cf88e"
  - name: redis
    newTag: "8"
    digest: "sha256:4d25e2fe601f7ffaeb4437cb6ced3518bc36edf34ebe98863c80836943d94529"
```

Every secret in the namespace is a SOPS-encrypted file decrypted at sync time by ksops, including the federation signing key — the single credential that establishes this server's identity to the rest of the federation:

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

The homeserver configuration is the part worth getting right the first time, because `server_name` cannot be changed afterward without abandoning every user identifier and room the server has created.

## Naming and Delegation

My `server_name` is `white.fm` while Synapse actually runs at `matrix.white.fm`. That split is deliberate: user identifiers read `@robert:white.fm`, and the homeserver can move later without breaking a single identifier.

```yaml
server_name: "white.fm"
public_baseurl: "https://matrix.white.fm/"
web_client_location: "https://element.white.fm/"
report_stats: false
```

Delegation is what makes that split work. Two documents served from the apex domain tell federating servers and clients where the homeserver actually lives:

`/.well-known/matrix/server`:

```json
{ "m.server": "matrix.white.fm:443" }
```

`/.well-known/matrix/client`:

```json
{ "m.homeserver": { "base_url": "https://matrix.white.fm" } }
```

Those are served by a two-line nginx pod mounting a ConfigMap, with Gateway API routes attaching the path prefix to the apex hostname:

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

Two details matter here. The client document must be valid JSON with a `Content-Type` of `application/json`; clients parse it strictly, and a stray comment or trailing comma produces a login failure whose error message will not mention the well-known document at all. The delegation must also be reachable from the public internet even if the homeserver itself is private, because remote servers resolve delegation before they attempt federation.

## Secrets Outside the ConfigMap

Synapse's configuration file is held in a ConfigMap, while the database credentials belong in a Secret. An init container renders the final file with `envsubst` into an `emptyDir`, pulling the values from the SOPS-decrypted Secret:

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

The committed ConfigMap holds `${POSTGRES_PASSWORD}` and the init container substitutes the value at runtime. The rendered file is ephemeral; it never reaches the repository, an image layer, or a persistent volume.

The remaining server secrets — `registration_shared_secret`, `macaroon_secret_key`, `form_secret`, and the OIDC client secret — are mounted as files from `synapse-secrets`; the signing key is mounted separately at `/data/white.fm.signing.key`.

## Hardening the Defaults

Synapse's defaults are tuned for a public homeserver on a large federation. Four changes narrow that considerably for a private one:

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

The first three prevent an unauthenticated remote server from enumerating profiles. The fourth is intentionally left open; the public channel therefore remains discoverable over federation. This is a deliberate trade-off; everything that matters is in encrypted rooms outside the public directory.

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

This is the distinction I would have wanted written in larger type: OIDC authenticates the *account*; it neither creates nor carries the room-encryption keys, which remain on the participating devices and live independently of the identity provider. An IdP outage locks me out of the account for its duration. The loss of every logged-in device is more final: without client-side key backup, it takes the history of my encrypted rooms with it. I configure key backup before I need it, because after the devices are gone there is nothing left to configure.

## Publishing

Only four hostnames reach the public internet through the Cloudflare tunnel and the Envoy Gateway `https-white-fm` listener: `matrix.white.fm` (the homeserver), `element.white.fm` (the client), `webhooks.white.fm` (webhook ingest), and `hookshot.white.fm` (the widget API). Everything else — including the Maubot administrative interface and the alternative clients — is reachable only on `*.internal.white.fm`, resolved by internal DNS. The homeserver route carries an extended timeout because federation requests to slow remote servers exceed the gateway default:

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

The namespace runs default-deny for ingress and egress, with explicit allowances for the gateway, Prometheus scraping on the three metrics ports, and the specific namespaces that post webhooks in-cluster.

--------------------------------------------------------

# Encrypted Webhooks

This is where a naive design fails, and the failure is subtle enough to be worth describing.

A webhook is an unauthenticated-by-default HTTP POST carrying JSON. A Matrix room with end-to-end encryption enabled accepts only Megolm-encrypted events. Nothing in the webhook protocol knows how to produce one. The gap between "a media service posted JSON" and "an encrypted event appears in the room" has to be closed by a process that is itself a Matrix client, holds device keys, and participates in the room's key-sharing.

My original solution was the `matrix-encrypted-webhooks` container, paired with Maubot for the polling integrations — that is the arrangement described in the 2023 post. It worked, but it was a single-purpose service with no provisioning story: every new webhook meant editing a config file on a volume and restarting the pod.

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

Three parts of that block are load-bearing:

`encryption.storagePath` must be a persistent volume. It holds the appservice's device identity and Megolm session state. Losing it interrupts delivery and produces a new device that other members have not verified; messages sent by the original device become permanently undecryptable to anyone who joins afterward. This is the one PVC in the stack whose contents cannot be regenerated without losing cryptographic continuity.

`cache.redisUri` moves Hookshot's transient state out of the pod, which is what makes a restart cheap.

The `permissions` block is the one I got wrong. Current Hookshot webhook commands use the `generic` service permission; the legacy value `service: "webhooks"` caused provisioning failures in my deployment, with no useful error or log line. The wildcard `"*"` is the correct value and covers generic webhooks, feeds, and the GitHub service.

## Creating a Webhook Without the Legacy Provisioning API

Hookshot 7.0 removed its legacy HTTP provisioning API. Webhook creation now goes through Matrix itself, either through the room widget or by asking the bot in the room. Both paths are interactive, and neither is scriptable — a poor fit when the webhook belongs to a CronJob deployed from a manifest.

The state underneath is simple enough, though. A webhook is a `uk.half-shot.matrix-hookshot.generic.hook` state event in the room; Hookshot notices the new state event, mints a hook ID, and records the mapping in its own room account data. Both are ordinary client-server API operations, which makes the whole flow scriptable:

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

The full script runs inside the Synapse pod, where `127.0.0.1:8008` is the admin listener and the shared secret is already mounted; it therefore introduces no new long-lived credential. It writes the state event directly; this keeps the room history clean and, more importantly, avoids any need to decrypt content. The bot-command path would require the script to read an encrypted room, while a state event is unencrypted by design. The temporary admin is deactivated and erased in a `finally` block in every case, including failure of the remaining operations.

The result is one line on stdout:

```sh
./mkwebhook.sh '!FAYyekTFiXsNeJJlFc:white.fm' fleet
# https://webhooks.white.fm/webhook/<hook-id>
```

## Transformation Functions

A raw media-service or Alertmanager payload rendered into a room is a wall of JSON. Hookshot's `allowJsTransformationFunctions` permits a JavaScript function, stored in the room's state event, to convert each payload into formatted text before the message is composed and encrypted:

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

Every transform I run escapes its output. This is a security control. The `html` field is rendered by the client, and the payload arrives from a service that may itself be reporting on attacker-controlled input — a monitor name, an article title, or a username in a failed-login event. Unescaped input creates a direct injection path into the room. Escape it at the boundary.

Two properties of transforms are easy to misread. First, they execute in the Hookshot process, which is to say *before* encryption: Hookshot sees every payload in cleartext, by necessity, because it is the component doing the encrypting. Second, the transform is stored in room state, which means anyone who can write state in that room can change the code Hookshot executes on incoming payloads. Treat write access to those rooms as equivalent to code deployment, because it is.

The repository files document my transforms, yet they do not control the deployed versions. Hookshot reads the code stored in room state; editing a repository file has no effect until the corresponding state event is updated. That distinction has cost me a debugging session more than once.

--------------------------------------------------------

# What Actually Sends Me Messages

Producers fall into three classes, distinguished by how they reach the room.

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

The RSS path is the most developed, because it carries the most volume. My [FreshRSS intelligence pipeline](/posts/rss-intelligence-pipeline/) runs as a CronJob every thirty minutes, clusters near-duplicate stories, extracts a structured event with a local model, scores it against profiles, and posts the survivors. Its transform handles three payload shapes on one hook — the scored alert digest, a plain-text digest from a separate CronJob, and individual feed entries — and falls back to a formatted JSON dump for anything unrecognized. That fallback has repeatedly been how I discovered that a producer had changed its payload shape.

The appliance producers deserve a note on where their configuration lives. UniFi, Synology, and the weather source are not Kubernetes workloads; their webhook configuration lives in each device's own interface and outside git. That is an honest gap in an otherwise declarative stack: the URL is a bearer credential held in an appliance's settings page, recoverable only by regenerating it. If an appliance is reset, the webhook must be re-entered by hand.

Maubot occupies the remaining niche. Where Hookshot is push-driven and appservice-backed, Maubot runs plugin bots that poll — the GitHub and RSS plugins in particular — and each bot is a real Matrix client with its own device, encrypting into rooms the same way any client does. The two are complementary: anything that can push, pushes to Hookshot; anything that must be polled, Maubot polls.

--------------------------------------------------------

# Noise Is the Actual Operational Difficulty

Encryption was the easy part. Keeping the rooms readable was not.

An unfiltered notification hub that delivers everything becomes a notification hub nobody reads, and a channel nobody reads is worse than no channel, because it produces a false sense of coverage. Three controls do the filtering, and all three were added after the rooms became unusable.

The transform is the final and most precise filter: it can discard a message entirely by returning `empty: true`. Uptime Kuma fires on every state transition, which means that recoveries and retries generate traffic alongside failures. I want the room to report the failure itself:

```js
const MUTED = new Set(["Weather API", "LazyLibrarian", "Media MCP", "Media indexer"]);
if (hb.status === 1 || hb.status === 2 || MUTED.has(mon.name)) {
  return { version: "v2", empty: true };
}
```

Recoveries and pending retries are dropped, and a short list of chronic flappers is muted by name. Current state is always on the Kuma dashboard; the room carries state transitions.

Alertmanager needed the same treatment at the routing layer, before the transform stage:

```yaml
route:
  group_by: [alertname, namespace, pod]
  group_wait: 1m
  group_interval: 30m
  repeat_interval: 12h
```

`group_interval` was originally five minutes, which meant a single flapping pod could generate a notification every five minutes indefinitely. Thirty minutes lets the alert stream settle and batches several flap cycles into one message. `repeat_interval` moved from four hours to twelve for the same reason: for an incident already under observation, re-notification every four hours adds volume without adding a decision. Both receivers set `send_resolved: false`; the useful signal is *this started firing*, while the corresponding *it stopped* doubles the volume without changing an operational response.

The third control is an inhibit rule that I recommend to anyone running Alertmanager, added after an eleven-hour episode in which a crash-looping Alertmanager alerted me about the crash-looping Alertmanager through the very pod that was crash-looping:

```yaml
inhibit_rules:
  - source_matchers: [alertname="PodCrashLooping", namespace="observability"]
    target_matchers: [alertname="PodCrashLooping", namespace="observability"]
    equal: [pod]
```

--------------------------------------------------------

# Agents in the Encrypted Rooms

Two AI agents are members of these rooms, and both participate in the same end-to-end encryption as the human users.

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

OpenClaw runs as `@jarvis:white.fm` with the same encryption settings and a tighter join policy — `autoJoin: "allowlist"`, `groupPolicy: "allowlist"`, and `requireMention: true` on the one group room it is permitted to enter.

Three consequences of that decision have mattered enough in practice to state plainly.

**A bot in an encrypted room holds that room's keys.** That is the correct behavior; the bot's device identity consequently deserves the same protection as a user's. Compromising the agent's pod yields the plaintext of every room of which it is a member. Both agents keep their state on a backed-up PVC for exactly that reason, and both are part of why the namespace runs default-deny egress.

**Mention-gating is a cost control and a safety property.** `MATRIX_REQUIRE_MENTION` means the agent does not respond to the notification stream flowing past it. An agent that reacts to every Falco detection and every media import is both expensive and, more importantly, an arrangement that acts on machine-generated input without a human in the loop.

**What the agent can reach is a deliberate decision, made at mount time.** Hermes has the Synology media, books, and downloads exports mounted read-write so its file tooling is useful. `/volume1/Personal` is deliberately not mounted, and the manifest says why: the agent is reachable from Matrix, Telegram, and iMessage, which means anything mounted into it is reachable by anyone who can send it a message. The encryption protects the channel; a filesystem handed to something that answers strangers remains exposed.

I will cover the agent design properly in a separate post; the point here is only that an encrypted notification channel carrying an agent must be designed as a control plane.

--------------------------------------------------------

# Security Notes

**Encryption starts at Hookshot.** This is the qualification that matters most. When a media service posts a webhook, that request is protected by TLS to the gateway, or uses plain HTTP inside the cluster; the request itself carries no end-to-end encryption. Hookshot receives cleartext, runs the transform on cleartext, and encrypts as it composes the room event. The guarantee is real but specific: message content is unreadable at rest in the homeserver database and unreadable to anyone who compromises Synapse. Hookshot can read it, as can anyone who intercepts the request before it reaches Hookshot. In-cluster producers posting over plain HTTP depend entirely on NetworkPolicy for that leg, which is why each source namespace has an explicit policy instead of a blanket allowance.

**A webhook URL is a bearer credential.** Anyone holding `https://webhooks.white.fm/webhook/<id>` can post to that room, forever, with no additional authentication. These URLs belong in secret management with the same seriousness as an API key. A manifest comment, public repository, or screenshot is an unacceptable place for one. Mine reach the public internet through the Cloudflare tunnel, which makes the URL the entire access control. Rotation means creating a new hook and updating each producer, a good argument for keeping the number of producers per hook small.

**`registration_shared_secret` is an admin-equivalent credential.** It can mint server administrators without any existing account; the webhook script relies on that capability. It should exist only inside the pod, and any tooling that uses it should create a temporary admin, do the work, and erase the account in a `finally` block. Do not build tooling that keeps a standing admin token.

**Transformation functions are code stored in room state.** Anyone with permission to write state events in a room can change the JavaScript that Hookshot executes on every incoming payload for that hook. Room power levels determine who can alter executable code in this design. Set them accordingly, and audit the state events in rooms where transforms are enabled.

**Payloads are untrusted input.** A monitor name, an article title, a container name, and a username in a failed-login event can all be attacker-influenced. Escape every field on the way into the `html` output. My transforms do this uniformly; it is the single most common omission I see in webhook transforms published elsewhere.

**Key loss is data loss, and the failure is silent.** Hookshot's `encryption.storagePath` and the agents' data volumes hold device identities and Megolm sessions. Restore a pod without its volume and it becomes a new, unverified device; the old messages do not become readable again, and nothing in the interface announces what happened beyond an unverified-device warning that is easy to dismiss. Back up those volumes, and configure client-side key backup for human accounts before you need it.

**Federation exposes more than room content.** End-to-end encryption protects message bodies. It does not protect membership, timing, room structure, or the fact that a room exists. `allow_public_rooms_over_federation: true` in my configuration is a deliberate choice for one discoverable public channel; it means any federating server can enumerate the public room directory. Everything operational lives in encrypted, non-published rooms, and that separation is the actual control.

**Assume the appliance webhooks are the weak link.** UniFi, Synology, and similar devices hold the webhook URL in a settings page, transmit over whatever TLS stack their firmware ships, and offer no rotation story. They are the least controlled producers in the stack, and they are the ones reporting on presence in the house. Give them their own hooks and their own rooms so a leaked URL from a device reset has a bounded blast radius.

--------------------------------------------------------

# Wrapping Up

The technically interesting parts of this build were the appservice crypto store, the state-event provisioning path around a removed API, and the discovery that the central difficulty is noise; encryption is the easy part. The part worth arguing about is the premise.

Every self-hosted stack generates a notification stream, and the default destination for that stream is a third-party chat service, chosen because the integration takes four minutes. That choice hands a continuously updated description of your infrastructure, your habits, and your presence in the house to an organization with no stake in protecting it. The alternative costs one homeserver, one appservice, and an afternoon, and it produces an arrangement in which the operator of the server — me — cannot read the rooms either.

That last property is the one I would emphasize. The cryptographic design removes the question of whether to trust me from the server's operation; it gives the arrangement a stronger foundation than a declaration of trust ever could.

I keep a public channel for this blog at [#whitematter:white.fm](https://matrix.to/#/%23whitematter:white.fm). It federates, which allows any Matrix account to join and ask about this post or any other subject.

Questions or corrections may be raised in a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), submitted as a [GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or sent by email to [robert@whitematter.tech](mailto:robert@whitematter.tech). You may also [join the WhiteMatterTech Matrix channel](https://matrix.to/#/%23whitematter:white.fm) to discuss the post there.

Robert
