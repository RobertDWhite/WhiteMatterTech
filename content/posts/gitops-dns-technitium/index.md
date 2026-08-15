---
title: "GitOps DNS: Managing Four Technitium Replicas From One Encrypted Secret"
date: "2026-08-13"
draft: true
categories:
  - "networking"
  - "kubernetes"
  - "homelab"
  - "security"
  - "tutorials"
tags:
  - "dns"
  - "technitium"
  - "kubernetes"
  - "gitops"
  - "sops"
  - "authentik"
  - "pihole"
  - "self-hosted"
cover:
  image: "cover.png"
  alt: "One encrypted configuration source distributing DNS data to four synchronized server replicas"
  caption: "One encrypted Secret feeds all four Technitium replicas."
  relative: true
aliases:
  - /posts/gitops-dns-technitium/gitops-dns-technitium
  - /2026/gitops-dns-technitium
---

--------------------------------------------------
# Introduction

Four years ago, I wrote about ["split-brain DNS"](https://whitematter.tech/posts/https-for-homelab-internal-resources/). Two Pi-hole instances resolved internal hostnames locally, while Cloudflare handled the same names externally. The implementation has since changed completely, but the idea is the same.

The Pi-holes are gone. DNS now runs on four Technitium replicas in Kubernetes. They serve authoritative zones for my `internal.*` names, forward everything else to encrypted upstreams, and load every record from a single SOPS-encrypted Secret in Git. Adding a hostname takes three commands: `sops`, `git commit`, and `git push`. About a minute later, every replica serves it.

--------------------------------------------------------
# How Records Flow

The configuration comes down to one encrypted file and a sidecar in each pod.

```
35-zones-secret.sops.yaml   ─┐
 (sops-encrypted; edit       │
  with `sops` interactively) │
                             ├─► ksops decrypts → Secret technitium-zones
                             │                              │
                             │                              ▼
                             │              /zones in every Technitium pod
                             │                              │
                             │              sidecar `zone-importer` watches mtime
                             │                              │
                             └────────► Technitium HTTP API on localhost:5380
                                                            │
                                                            ▼
                                                  Authoritative zones
```

The encrypted Secret is the source of truth for my DNS. Argo CD applies it, the kubelet projects it into each pod as files under `/zones`, and a sidecar in each pod watches those files for changes and pushes them into Technitium over its local HTTP API.

To add a record, edit the Secret with `sops` (or an editor with SOPS support, such as VS Code), commit it, and push it:

```sh
sops platform/networking/technitium/35-zones-secret.sops.yaml
git commit -am "technitium: add thing.internal.white.fm"
git push
```

Then confirm against both LoadBalancer addresses:

```sh
dig @10.99.5.50 thing.internal.white.fm
dig @10.99.5.51 thing.internal.white.fm
```

--------------------------------------------------------
# Why a Sidecar Rather Than a Controller

I considered external-dns with a Technitium provider and a custom controller that reconciled records from CRDs. I chose a per-pod sidecar reading a projected Secret instead.

Technitium keeps zone state in its own store rather than a configuration file, so there is nothing declarative to mount. Something must make API calls. A cluster-wide process would need to know about every replica; a per-pod process only needs to know about `localhost`.

This also lets new replicas converge on their own. When a pod starts, its sidecar reads `/zones` and imports everything. No cluster-wide controller has to discover it first.

Failures stay local to a pod. Each importer retries against its own Technitium instance, so one unavailable pod does not block the other three.

--------------------------------------------------------
# Two Layers of Authentication

Technitium 15.1 has built-in OIDC, so the admin UI can authenticate against Authentik. The OAuth2 provider uses the slug `technitium-sso` and includes both hostnames as redirect URIs. Its issuer, client ID, and client secret are SOPS-encrypted and applied through the Technitium API. Authentik's `authentik Admins` group maps to Technitium's `Administrators` group.

I keep the local admin password as a fallback because Authentik can fail too. If Authentik depends on DNS while DNS depends on Authentik for administrative access, recovery gets awkward quickly. Ask me how I know. To get back in, decrypt the password with `sops -d` and port-forward directly to the UI:

```sh
kubectl -n technitium port-forward technitium-0 5380:5380
```

--------------------------------------------------------
# Failures I Hit

**Token expiry dropped all new records.** The importer authenticated once and reused the token. After it expired, API calls failed and the sidecar kept running while logging zero imported records. Nothing looked down, but new records stopped appearing. The fix was to log in again on every cycle. If the zone-importer logs show `0 ok`, restart the StatefulSet.

**The primary can deadlock on its own image pull.** One replica owns zone creation. If its node loses external DNS resolution, it cannot pull the container image. The zone never comes up, and every replica answers `REFUSED`. The circular dependency is easy to miss during setup: the DNS server needs working DNS before it can start.

**Resolver egress has its own dependency chain.** Recursive queries go through dnscrypt-proxy over Oblivious DoH, using a proxy in another namespace for egress. When that proxy was OOMKilled, cached queries still worked, while cache misses returned `SERVFAIL`. Technitium itself looked healthy. If only some lookups fail, check the egress path too.

--------------------------------------------------------
# Security Notes

**Encrypt the zone file.** Internal hostnames provide a useful map of the infrastructure. Because this repository is public, `35-zones-secret.sops.yaml` is encrypted with age.

**Do not use a public resolver as a node fallback.** Putting `1.1.1.1` in a node's `systemd-resolved` configuration may look like a useful safety net, but it can send internal lookups outside the network. Use another LAN resolver instead. An old Pi-hole, for example, would work well here.


--------------------------------------------------------
# One Last Dependency

In 2022, my split-brain DNS ran on two Raspberry Pis. It now runs on four Technitium replicas managed through GitOps, with an encrypted Secret and a sidecar in each pod.

Plan for the circular dependency before deploying this: the DNS server also needs DNS to start.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
> Thanks for reading!
>
> Robert
