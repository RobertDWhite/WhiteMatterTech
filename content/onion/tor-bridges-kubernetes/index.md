---
title: "Spare Bandwidth Against Censorship: Running a Tor Bridge and a Snowflake Proxy on Kubernetes"
date: "2026-08-09"
draft: false
type: "onion"
ShowReadingTime: false
ShowPostNavLinks: false
ShowWordCount: false
cover:
  image: "cover.png"
---

--------------------------------------------------
# Introduction

Most workloads in my cluster serve a personal operational purpose. These two workloads serve a public one.

A Tor bridge and a Snowflake proxy carry traffic for people whose governments or network providers have restricted access to information, publication, or association. This is an immediate condition in several regions. The Tor Project maintains circumvention guidance for China, Russia, Turkmenistan, and Belarus, where direct access to Tor may be restricted. A bridge provides an alternative entry point whose address is absent from the public relay directory.

Bridges depend upon substantial volunteer participation. A small, centrally operated population would present a readily enumerable target for blocking; resilience derives from a large and geographically diverse population of independently operated bridges.

Many homelab operators have capacity that can be contributed without impairing their primary workloads. This post provides a technical blueprint for doing that deliberately.

--------------------------------------------------------
# What These Two Things Are

**An obfs4 bridge** is a Tor relay omitted from the public directory and wrapped in a pluggable transport that renders the traffic more difficult to fingerprint. Blocking every published relay does not automatically identify an unpublished bridge. Users obtain bridge addresses through distribution mechanisms such as the Tor Project's BridgeDB, email, or trusted personal exchange.

**A Snowflake proxy** serves a different, lighter role. It brokers short-lived WebRTC connections between a censored user and the Tor network. The transport is intended to resemble a video call, which can impose collateral disruption upon broad blocking efforts; its effectiveness nevertheless depends upon the censor's local techniques. A Snowflake proxy requires outbound connectivity, needs no inbound port forwarding, and retains no long-lived relay identity.

Snowflake is an accessible starting point for many operators. Its deployment requirements are modest, and the volunteer proxy capacity it supplies contributes to a circumvention mechanism already available in Tor Browser.

--------------------------------------------------------
# Why This Lives in a Private Repository

My cluster manifests are public. These are not. The Argo CD Application in the public repository points at a private one:

```yaml
spec:
  source:
    # Manifests live in a separate private repo; ArgoCD authenticates with a
    # read-only deploy key.
    repoURL: git@github.com:RobertDWhite/<private-repository>.git
    targetRevision: main
    path: .
  destination:
    namespace: <private-namespace>
```

The reason is operational. Running a bridge is lawful where I live, and the Tor Project actively recruits operators. A bridge retains greater utility while its address remains difficult for a censor to enumerate.

Publishing a bridge's IP address, port, or obfs4 certificate supplies an adversary with actionable enumeration data. Public disclosure can accelerate blocking, even though it does not guarantee an immediate loss of utility. A publicly searchable Git history would provide a durable and low-effort source for that information.

This post therefore contains no bridge addresses, fingerprints, ports, or certificates, including my own. The implementation pattern is reproducible, while the active instance remains undisclosed. Operators should place bridge-specific configuration in a private repository from the first commit: Git history persists, and an initial public disclosure cannot be fully withdrawn.

The namespace uses a non-descriptive name. This choice removes a trivially searchable identifier; it does not constitute a substantive security boundary.

--------------------------------------------------------
# The Blueprint

The architecture uses familiar Kubernetes primitives, which keeps the operational model intelligible.

**Snowflake proxy.** A Deployment runs the `snowflake-proxy` image. The workload requires outbound network access, no persistent volume, no inbound listener, no long-lived identity, and no secret material. Scale the replica count according to the bandwidth available for contribution. In this deployment, eight replicas each cap simultaneous client connections and report periodic statistics.

**obfs4 bridge.** This component requires more care because the bridge has a stable identity and persistent state.

- A StatefulSet preserves the relay's identity keys across replacement. Losing that state would invalidate the existing bridge line and require users to obtain updated connection information.
- A PersistentVolumeClaim for `/var/lib/tor`.
- A `ServerTransportListenAddr` for obfs4 and an `ORPort`, both reachable from the internet. This installation obtains that reachability through a dedicated VPN sidecar and a provider-assigned forwarded port; other deployments may use a router port forward or another publicly routable ingress arrangement.
- `BridgeRelay 1` and `PublishServerDescriptor bridge`, which classify the relay as a bridge and permit its descriptor to be distributed through the bridge ecosystem.
- A `ContactInfo` address, through which the Tor Project can reach the operator about service problems.

**Network boundary.** The bridge shares a pod network namespace with a dedicated VPN sidecar; its inbound and outbound Tor traffic therefore traverses that tunnel. The Snowflake proxies require direct outbound reachability to their broker, relay, and STUN endpoints. The private Kustomization presently contains no NetworkPolicy resource. Namespace separation remains useful for administration, but it does not furnish an enforced ingress or egress boundary in the active manifests.

**VPN and forwarded-port boundary.** The endpoint presented to bridge clients and Tor relay peers is the VPN provider's public address, reached through the provider's forwarded-port allocation. The residential address supporting the cluster is absent from that connection path. This arrangement can prevent routine observation of the bridge endpoint from immediately identifying the home connection or premises. The forwarded port is an inbound network-address-translation assignment at the provider; it conveys connections into the pod across the existing tunnel and has no independent anonymity property.

The arrangement establishes address separation, with consequential limits. A VPN provider can associate an allocated address and forwarding assignment with a subscriber account according to its retention and disclosure practices. Traffic-correlation capabilities, operator contact information, configuration artifacts, host-level telemetry, and voluntary public disclosures can each furnish independent routes to attribution. Tor's anonymity properties derive from its protocol and distributed relay architecture; the VPN sidecar does not confer personal anonymity upon the operator.

--------------------------------------------------------
# Practical and Legal Notes

**Bridge and proxy roles.** A bridge and a Snowflake proxy move encrypted traffic into the Tor network. An exit relay carries traffic from the Tor network to the public internet; its IP address can appear in destination-site logs and may attract abuse complaints or law-enforcement contact. Residential operators should assess those materially different responsibilities before operating any relay type.

**Check your ISP terms and jurisdiction.** The Tor Project encourages bridge operation, but applicable law and residential terms of service vary. Determine the conditions that apply before deployment.

**Plan for measurable bandwidth use.** A Snowflake proxy consumes the capacity made available to it. A bridge can be bounded with `RelayBandwidthRate` and `RelayBandwidthBurst`; setting those limits protects the uplink while preserving a deliberate contribution.

**Set an accurate ContactInfo.** It is how you find out your bridge is misconfigured or has been enumerated.

**Use deliberate service separation.** Bridges can attract scanning and probing. Keep the resulting exposure separate from services whose availability or confidentiality matters.

--------------------------------------------------------
# Why Bother

Censorship circumvention depends upon distributed infrastructure. A small concentration of bridges in one data center would become a readily identifiable blocking target; the relevant security property depends upon a broad, diverse, and independently operated population.

The Tor Project maintains the relevant software and coordination mechanisms, while much of the operating capacity comes from volunteers who donate a measured portion of their uplink.

A Snowflake proxy is one Deployment with bounded capacity requirements. For a person subject to national filtering, volunteer proxy availability can determine whether independent reporting, communication platforms, and other public resources remain reachable.

Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a pull request](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
