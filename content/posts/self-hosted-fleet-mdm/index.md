---
title: "Self-Hosting Fleet MDM on Kubernetes, and the Six Patches It Took"
date: "2026-08-09"
draft: true
categories:
  - "kubernetes"
  - "security"
  - "homelab"
  - "tutorials"
tags:
  - "fleet"
  - "mdm"
  - "kubernetes"
  - "mysql"
  - "valkey"
  - "kustomize"
  - "helm"
  - "osquery"
  - "self-hosted"
aliases:
  - /posts/self-hosted-fleet-mdm/self-hosted-fleet-mdm
  - /2026/self-hosted-fleet-mdm
---

--------------------------------------------------
# Introduction

[Fleet](https://fleetdm.com/) is an open-source device management platform built on osquery. It does MDM for Apple devices, software inventory, install policies, and fleet-wide querying, and it is genuinely good. It is also built and documented on the assumption that you are running it as a managed service or on plain infrastructure, not that you are dropping its Helm chart into an existing GitOps cluster.

Getting it running on RKE2 under ArgoCD took a MySQL StatefulSet, a Valkey StatefulSet, and six Kustomize patches against the upstream chart. This post is mostly about the six patches, because that is where the work was.

--------------------------------------------------------
# The Base

Fleet needs MySQL and Redis. I run both in-namespace rather than using managed services: a MySQL StatefulSet with a PodDisruptionBudget, and Valkey as the Redis implementation. A nightly `mysqldump` CronJob handles logical backups on top of volume snapshots, because a corrupted schema restores from a dump and not from a block-level snapshot.

Two HTTPRoutes expose it, one internal and one public, since agents on devices that leave the house need to reach the server from anywhere.

--------------------------------------------------------
# The Six Patches

The upstream chart assumes a deployment model that GitOps does not share. Each patch corrects one of those assumptions.

**Environment for the server and for migrations, separately.** Fleet's schema migrations run as a distinct workload from the server, and both need database and cache configuration. Two patches rather than one, because the migration job does not inherit the server's environment.

**Stripping Helm hooks, twice.** The chart marks its migration Job and its ServiceAccount as Helm hooks. ArgoCD renders the chart rather than running Helm's lifecycle, which means hook-annotated resources either never apply or apply at the wrong point in the sync. Two patches remove the hook annotations and let the resources be ordinary manifests that ArgoCD sequences itself. If you are running any Helm chart through ArgoCD, this is the category of problem you will hit first.

**Pinning a self-hosted image, twice.** Both the server and the migration job point at my internal registry rather than pulling from upstream at sync time. Same reasoning as everywhere else in the cluster: the version that is running should be a value in git.

**Avoiding an unready node.** One node in my cluster is a desktop that is frequently powered off. The chart's default scheduling will happily place Fleet there. A patch adds the scheduling constraint to keep it away.

--------------------------------------------------------
# SMTP Lives in the Database

The design here is awkward, and the workaround generalizes to any setting an application keeps only in its own database.

Fleet stores its SMTP settings in an `app_config_json` blob in MySQL. There are no `FLEET_SMTP_*` flags, no config-file equivalent, and no environment variables. The settings are reachable through the UI and, in principle, through the API.

That is a problem under GitOps in a specific way: a setting that only exists in a database is a setting that is not in git, which means it is not reproducible, and it means anyone with UI access can change it silently.

The fix is a Job that writes the SMTP configuration directly into MySQL and re-runs on every sync. Configuration lives in git, ArgoCD re-asserts it continuously, and a UI edit is reverted on the next sync. That last property is the same self-healing behavior ArgoCD gives you for manifests, extended to a setting that lives in application state.

The Job talks to MySQL rather than to Fleet's API because the API route requires an authenticated session, which means bootstrapping a credential to configure a credential. Writing to the database sidesteps the ordering problem entirely.

I want to be clear that reaching into an application's database is not a pattern to reach for casually. It couples you to an internal schema that upstream can change without warning. It is justified here because the alternative is configuration that exists nowhere but production.

--------------------------------------------------------
# Security Notes

**Compromise of the Fleet server is compromise of every enrolled machine.** It holds an inventory of every managed device, can push configuration profiles, and can install software. Treat it accordingly: the public route exists only because agents need it, and everything administrative stays internal.

**The database write pattern is a privilege concentration.** The SMTP Job holds MySQL credentials with write access to application configuration. Scope that credential as tightly as the schema allows and remember it exists.

**Backups contain device inventory.** The nightly `mysqldump` output is a complete list of your hardware, its software, and its posture. Store it with the same care as the database itself.

**Public exposure needs a real justification per route.** Two HTTPRoutes means two decisions. Enrolled devices roaming outside the network need the agent endpoint; nothing else needs to be public.

--------------------------------------------------------
# Wrapping Up

The Helm-hook problem generalizes well beyond Fleet. Any chart that relies on Helm's lifecycle to order migrations will misbehave under ArgoCD, and the fix is always the same: strip the hook annotations and let the GitOps controller sequence the resources.

Writing configuration directly into an application's database generalizes badly, and I would think twice before repeating it. It was the right call for a setting with no other declarative surface, and it is the wrong call as a habit.


## Related Posts

- [Ten MCP Servers for Ten Self-Hosted Apps: One Pattern](/posts/mcp-server-fleet/) — the MCP server written against this deployment.
- [GitOps DNS: Managing Four Technitium Replicas From One Encrypted Secret](/posts/gitops-dns-technitium/) — the same Kustomize, SOPS, and ArgoCD conventions on a smaller app.
- [How To Do An In-Place Upgrade To Windows Server 2022](/posts/how-to-do-an-in-place-upgrade-to-windows-server-2022/) — the manual version of the patching this replaces.
- [A Roadmap to a Rewarding Career in Cybersecurity: A Guide for Beginners](/posts/cybersecurity-career/) — why endpoint visibility is worth the six patches.


> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
