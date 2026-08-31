---
title: "Hermes: Encrypted Conversation, Deliberate Authority"
date: "2026-08-31"
cover:
  image: "cover.png"
  alt: "An abstract encrypted agent, linked through controlled gateways to local infrastructure services."
categories:
  - "ai"
  - "kubernetes"
  - "security"
  - "homelab"
tags:
  - "ai"
  - "agents"
  - "hermes"
  - "matrix"
  - "mcp"
  - "ollama"
  - "kubernetes"
  - "encryption"
  - "self-hosted"
aliases:
  - /posts/hermes-encrypted-agent-authority/hermes-encrypted-agent-authority
  - /2026/hermes-encrypted-agent-authority
---

--------------------------------------------------------

# Introduction

Hermes is the agent I use when a conversation has to reach the infrastructure. I address `@hermes:white.fm` in an end-to-end encrypted Matrix room. Hermes reasons through the local model route in my cluster, then invokes a finite set of tools against services with their own operational boundaries.

Three previous pieces describe the components in isolation: [the local Ollama router](/posts/heterogeneous-ollama/), [the encrypted Matrix notification hub](/posts/encrypted-matrix-notification-hub/), and [the MCP server fleet](/posts/mcp-server-fleet/). Hermes is where those systems meet. Matrix provides the private conversation, Ollama provides the default inference path, and Model Context Protocol (MCP) servers supply the functions through which an answer may become an action.

Encryption protects the conversation from the homeserver and its backups. It does not authorize an action. A model can formulate a request, yet the MCP server, its credential, and the upstream API still determine whether anything happens.

| Layer | Role in a Hermes turn | The layer supplies |
| --- | --- | --- |
| Matrix | Delivers the encrypted, mention-gated message and returns the reply | Conversation transport and device identity |
| Ollama router | Processes the prompt and available tool descriptions | Local inference with hardware failover |
| MCP server | Exposes a specified function and performs the requested call | A narrow operation against one service |
| The target service | Validates the operation and changes its own state | The real authority and its audit trail |

--------------------------------------------------------

# The Conversation Begins in Matrix

The Hermes deployment configures `https://matrix.white.fm` as its homeserver, `@hermes:white.fm` as its Matrix identity, a specific encrypted home room, and `MATRIX_REQUIRE_MENTION=true`. That room is for direct correspondence with Hermes. Alerts, feed digests, and appliance events stay in their separate notification rooms. The homeserver retains ciphertext. Hermes receives plaintext only after its Matrix device has joined the room and obtained the requisite session material.

That distinction is central. End-to-end encryption has an endpoint, and Hermes is one of mine. Compromising the Hermes pod would expose the direct correspondence in its home room, together with the capabilities available to the agent. The Longhorn-backed persistent volume is consequently more than a convenience: it preserves the Matrix device state, the agent configuration, and the credentials that permit the gateway to return after a restart as the same device.

Hermes wakes only when directly addressed. The home room stays clear of the operational notification stream. The person permitted to speak there can still send a message intended to influence the agent, which leaves the capability boundary as the relevant control.

The full Matrix deployment, including the device-key and backup implications, is described in [One Encrypted Room Per Signal](/posts/encrypted-matrix-notification-hub/). Hermes is a client of that system. It is not an exception to its threat model.

--------------------------------------------------------

# Inference Remains Inside the Cluster by Default

Hermes uses a custom OpenAI-compatible provider at `ollama-router.ai-stack.svc.cluster.local:11434/v1`. The active configuration selects `llama3.1:8b`, and the router's ingress policy admits the `hermes` namespace. During an ordinary Matrix exchange, the prompt moves from Hermes to the router and then to the selected Ollama backend. No public model endpoint is required for that path.

The router is the arrangement described in [One Ollama Endpoint, Two Very Different Backends](/posts/heterogeneous-ollama/). Its primary backend runs on the RTX 5090 host. The arm64 backend is reserved as failover. Hermes retains an inference path during an intentional power-down of the primary machine, although the selected backend changes the response characteristics. The hostname remains fixed while the hardware comes and goes.

Local inference is the default path. The ordinary reasoning loop has a local endpoint, a declared consumer policy, and a failure mode I can inspect. The deployment also retains credentials for other integrations, and an MCP server may make its own upstream request when its purpose requires one.

--------------------------------------------------------

# MCP Is Where a Reply Becomes an Action

Language-model output has no effect upon the cluster until some program accepts it as an instruction. In Hermes, that program is usually an MCP server. The agent's persistent configuration currently registers eight of them: `congress`, `freshrss`, `nodebyte`, `pages`, `kubernetes`, `media`, `googlenews`, and `gsc`.

Seven registrations are remote HTTPS endpoints beneath `*.internal.white.fm`, each terminating at an internal MCP service. The Kubernetes entry is different: Hermes starts it locally as an `npx` process over standard input and output. Hermes discovers the offered tools at startup, makes their descriptions available to the model during a turn, and invokes a selected operation only when the reasoning path calls for one.

The [MCP fleet post](/posts/mcp-server-fleet/) describes the repeated server pattern. Each server has one application boundary, one internal route, one bearer token, and its own upstream credentials. A request to publish a page reaches the Pages service. A request concerning a media-library item reaches the media service. Feed and congressional requests stop at their respective read boundaries. None of these registrations exposes a general HTTP client through which Hermes can discover arbitrary destinations.

That separation leaves the locus of authority intelligible. Hermes may choose a tool, but the server checks its bearer token, interprets the permitted function, and communicates with the upstream application using the credentials assigned to that server. A tool that does not exist cannot be selected. A tool that accepts no arbitrary destination cannot become a general egress mechanism merely because the model has been persuaded to try.

I use the same principle for external information access, described in [No Proxy, No Fetch Tool](/posts/capability-scoped-agent-egress/). A tool surface is an authorization surface. The server implementation, its parameter validation, and its egress behavior remain the controls that determine the practical result.

--------------------------------------------------------

# What Direct Action Means Here

From the Matrix room, I can ask Hermes to inspect something, retrieve the relevant state through an MCP server, make a permitted change, and report the result back into the same encrypted conversation. It feels direct because there is no intervening browser session, copied command, or second interface in which I must repeat the work. The call remains mediated, which makes it reviewable.

The Kubernetes entry requires particular care. The Hermes pod uses the default ServiceAccount, which currently has API-discovery and self-review permissions only. The deployment manifests define no dedicated ServiceAccount, Role, RoleBinding, ClusterRole, or ClusterRoleBinding for Hermes. The repository therefore establishes no general ability to list, patch, delete, or apply Kubernetes resources through that identity. The local Kubernetes MCP process is present. A mutating operation still requires a separately supplied credential and a deliberately scoped RBAC grant.

Most of the useful actions I want from Hermes are domain operations against services in the cluster, such as changing a page through its publishing service or affecting a media workflow through its own API. Those actions already exist as narrowly defined MCP functions with service-specific credentials and an audit trail in the application that performed the work. Kubernetes administration has a wider blast radius. It needs separate provisioning and explicit review.

--------------------------------------------------------

# The Persistent Volume Is Part of the Identity

Hermes runs as a single-replica Deployment with a `Recreate` strategy and a 10Gi Longhorn persistent volume mounted at `/opt/data`. ArgoCD reconciles the deployment from the `hermes` directory in the cluster repository. The agent's Matrix device material and live configuration survive in the persistent volume.

That division has an operational consequence. Git describes the container, its environment, the encrypted Matrix settings, and the local Ollama endpoint. The volume preserves the state that lets Hermes behave as the already-authorized Matrix device and retain its MCP registrations. Both halves warrant backup and review. Rebuilding the pod from a manifest without restoring the volume would create a new Matrix device and discard the configuration that gives the agent its practical shape.

I avoid treating that persisted state as an opaque convenience. A change to the list of MCP servers changes the agent's available authority. A change to the membership of its Matrix home room changes who can address it. A change to its credentials changes what it can affect. Each belongs in the same category of operational decision as an RBAC change, even when the implementation lives in a configuration file outside the Kubernetes manifest.

--------------------------------------------------------

# Security Notes

**Encrypted transport does not confer trustworthy intent.** Matrix prevents the homeserver from reading the room content, yet Hermes must decrypt it before it can reason about it. A document or pasted material deliberately handed to Hermes can still contain instruction-like text. The capability boundary limits the effect of a bad instruction. It does not make the instruction benign.

**MCP servers are credential holders.** A bearer token protects the incoming MCP endpoint, and the server holds whatever upstream credential its application requires. Compromising Hermes can expose its MCP client credentials. Compromising an MCP server can expose the authority delegated to that server. Distinct tokens and narrowly scoped upstream accounts limit either event.

**The Hermes namespace has no declared NetworkPolicy in the current Kustomize directory.** The MCP services enforce their own ingress boundaries, and the Ollama router admits the `hermes` namespace explicitly, but those facts do not constrain Hermes's outbound traffic at the namespace boundary. A dedicated egress policy for the agent remains a necessary subsequent refinement.

**The model is an untrusted planner.** I do not treat a fluent explanation as evidence that a tool call is appropriate, and I do not grant it broad administrative credentials in anticipation of future convenience. The server-side function definitions, bearer checks, application permissions, and Kubernetes RBAC are the mechanisms that constrain an action.

--------------------------------------------------------

# Wrapping Up

Hermes gives me an encrypted conversation with a practical connection to the services I operate. Matrix supplies the private room. The Ollama router supplies the local reasoning path. MCP makes a finite set of applications callable. Together, those pieces let the agent answer from within the environment and act through the interfaces I chose to expose.

The architecture remains useful because it refuses a single undifferentiated credential. The message transport, inference route, tool selection, bearer token, upstream application account, and Kubernetes identity are distinct concerns. When Hermes performs useful work, the responsible authority is visible at the boundary where the action occurs.

Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
