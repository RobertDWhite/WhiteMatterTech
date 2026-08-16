---
title: "No Proxy, No Fetch Tool: Capability-Scoped Internet Access for In-Cluster Agents"
date: "2026-08-10"
categories:
  - "ai"
  - "security"
  - "kubernetes"
  - "networking"
tags:
  - "ai"
  - "mcp"
  - "security"
  - "kubernetes"
  - "network-policy"
  - "agents"
  - "egress"
aliases:
  - /posts/capability-scoped-agent-egress/capability-scoped-agent-egress
  - /2026/capability-scoped-agent-egress
cover:
  image: "cover.png"
  alt: "A glowing agent inside a Kubernetes-style boundary connected through five narrow capability channels to a news globe, while red network routes are blocked outside the boundary"
  caption: "Capability-scoped access: five narrow channels instead of a general-purpose fetch tool."
  relative: true
---

--------------------------------------------------
# Introduction

Consider an agent running in a cluster or on a server that needs to read the news. The customary response is to provide an HTTP client and permit it to fetch URLs, perhaps through an egress proxy intended to impose a measure of network hygiene.

The agent in question is an in-cluster assistant with material access to its environment. It can receive a projected ServiceAccount token, whose effective authority derives from Kubernetes RBAC; it can control home automation; and it can reach several important internal services. Giving a system with that degree of reach a general-purpose `fetch(url)` tool creates a direct security problem: every page it reads becomes a potential source of adversarial instruction, and every host on the internet becomes a potential destination for whatever information the agent can assemble.

I address that concern by treating internet access as a capability problem rather than merely a network-routing problem.

--------------------------------------------------------
# Why an Egress Proxy Is the Wrong Control

A proxy answers one useful question: "which hosts may this workload reach?" I do operate a VPN egress proxy for scrapers and third-party APIs. For an agent with consequential internal access, however, that answer is insufficient.

A host-only allowlist still exposes the full surface of every permitted host. Allowing `news.google.com` through such a proxy can permit any path, query string, and method on that domain unless an additional layer constrains those operations. The agent can read news, but it can also use the same domain as a general-purpose channel.

A proxy does not control operations; it controls only the destination. The relevant security question for an agent is larger than "may it communicate with Google News?" It is, "may it do anything other than list headlines?" A conventional network-layer control cannot express that distinction. A tool definition can describe an operational boundary, but the server must enforce the boundary in its own implementation.

--------------------------------------------------------
# Capabilities Instead of Destinations

I use a different boundary. The agent receives no general-purpose HTTP or fetch tool; it receives MCP tools instead. Each MCP server is a separate deployment that exposes one narrow capability and is designed to communicate with one upstream service only.

For news, that server is `googlenews-mcp`. Its README expresses the governing constraint with useful economy: the agent communicates only with this server, and the server communicates only with `news.google.com`. The server exposes five tools and no additional operations:

- `top_headlines`
- `topic_headlines`
- `search_news`
- `geo_headlines`
- `decode_urls`

There is deliberately no fetch-arbitrary-URL tool. That absence is not an omission awaiting a future convenience feature; it is the design. The server exposes only those five function signatures, each with a constrained parameter surface.

That design supplies three useful constraints. First, the server cannot construct a request to an arbitrary host through its ordinary tool surface: none of its tools accepts a destination host, its requests begin with a fixed Google News base URL, and `decode_urls` accepts only Google News article links. Second, this is not equivalent to preventing all exfiltration. `search_news` sends the agent-supplied query to Google News, thereby making Google an approved recipient for that query. Third, the server exposes no tool for retrieving publisher content; it returns headlines and decoded publisher URLs instead. The blast radius of a prompt injection is consequently limited, on this path, to Google News requests, the data returned by this server, and any incidental redirect behavior. It is not limited across the entire agent: the same content can still influence what the agent asks other tools to do, including tools that act upon the cluster or home automation.

--------------------------------------------------------
# The Layers Underneath

The capability boundary performs the substantive security work. Two lower layers provide additional, although incomplete, reinforcement.

**NetworkPolicy on the MCP server.** The explicit pod-to-pod ingress rule for `googlenews-mcp` permits the Envoy Gateway namespace to reach port 8080. It currently defines no egress policy and therefore does not enforce "news.google.com and nothing else" at the network layer. The application begins its requests at `https://news.google.com`, but its `httpx` client follows redirects; that behavior is not a strict destination allowlist. A genuine egress boundary would require egress policy, DNS access, and a CNI or egress gateway capable of enforcing the selected upstream restriction. Standard [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) operates at the IP and port level, not by URL path or HTTP method.

**NetworkPolicy on the shared inference endpoint.** One policy makes the intended router consumers explicit:

```yaml
spec:
  podSelector:
    matchLabels:
      app: ollama-router
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: hermes
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: politics
        # ... one entry per consuming namespace
      ports:
        - {protocol: TCP, port: 11434}
```

Because these entries use only `namespaceSelector`, they permit every pod in each named namespace to reach port 11434, not one particular workload. In addition, [NetworkPolicies are additive](https://kubernetes.io/docs/concepts/services-networking/network-policies/): another policy that selects the router can grant additional access. This excerpt shows the consumer rule; it is not, by itself, proof that these are the only permitted sources. Adding a new consumer namespace to this rule requires a Git change, and a new namespace is not included by this rule by default.

--------------------------------------------------------
# The Cost

This pattern requires more work than a proxy, and that work is incurred per capability rather than once for the cluster.

In my fleet, every new information source entails a new repository, a new container image, a new set of manifests, and a new tool surface that requires deliberate design. Allowing the agent to read a second news source means building a second server; no configuration change grants that new capability by implication. That friction is intentional, because it turns an otherwise casual expansion of agent authority into an explicit engineering and review decision.

The tool surface requires the same attention as any other security control. Each tool becomes part of the server's available capability set until it is removed or placed behind an additional authorization boundary. `decode_urls` converts a Google News redirect link into a publisher URL. That operation is useful, but it is also the closest function in this service to a generic network capability. The server returns the decoded URL rather than publisher content. Because the current HTTP client follows redirects, this is not a guarantee that no request can ever reach a publisher. Where that distinction is material, disable cross-host redirects and enforce egress separately. It remains the first tool I would scrutinize during an adversarial review.

--------------------------------------------------------
# Security Notes

**This bounds one tool path, not the model or the entire agent.** Nothing here prevents a model from producing poor or maliciously influenced output. The objective is to limit the effects that output can cause through this particular capability.

**The tool surface is a security boundary; review it accordingly.** A pull request that adds a tool is a potential privilege-escalation request. Treat a proposal to add an optional `url` parameter with the same scrutiny accorded to a new firewall rule.

**Credentials still concentrate.** MCP servers often hold credentials for their upstreams. This news server needs no Google API key, but it still holds the bearer token that gates incoming MCP access and has network access to its upstream. The capability model limits what the agent can request; it does not limit what an attacker who compromises the server itself can do.

**Cluster access remains the larger risk.** An in-cluster agent can hold a ServiceAccount token for Kubernetes, although the authority derived from that token is governed by RBAC. The controls above address one internet-facing tool path; they do nothing about the agent's permissions inside the cluster. Grant verbs and resources explicitly, avoid `cluster-admin`, and assume that any content the agent reads may attempt to influence its subsequent actions.

--------------------------------------------------------
# Wrapping Up

An egress proxy asks where a workload may connect. For an agent, the more consequential question is what it may do. The answer should be a finite list of function signatures that can be scoped, inspected, and understood in one place.

The implementation is deliberately unglamorous: a small HTTP service for each capability, a bearer token, a NetworkPolicy, and the discipline to refuse the generic escape hatch whenever it would be convenient. That discipline is the point. The resulting system may require more repositories and more manifests, but it leaves the agent's external authority finite, legible, and subject to review.

Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
