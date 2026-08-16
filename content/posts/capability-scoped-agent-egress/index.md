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

Say an agent running in your cluster or on a server needs to read the news. The obvious answer is to give it an HTTP client and let it fetch URLs, perhaps through an egress proxy for hygiene.

The agent in question is an in-cluster assistant with meaningful access. It could query my Kubernetes cluster through a projected ServiceAccount token, control home automation, and reach several important internal services. Giving a system with such reach a general-purpose `fetch(url)` tool creates a simple problem: every page it reads becomes a potential instruction source, and every host on the internet becomes a potential destination for whatever it knows.

Instead of the obvious answer, I handle this concern by treating internet access as a capability problem rather than a network-routing problem.

--------------------------------------------------------
# Why an Egress Proxy Is the Wrong Control

A proxy answers one useful question: "which hosts may this workload reach?" I do run a VPN egress proxy for scrapers and third-party APIs. For an agent, though, that is not enough.

A host-only allowlist still exposes the full surface of every allowed host. Allowing `news.google.com` through such a proxy permits any path, any query string, and any method on that domain. The agent can read news, and it can also use the domain as a general-purpose channel.

But a proxy does not control operations; rather, it controls only the destination. The security question with an agent is not "may it talk to Google News?" It is "may it do anything other than list headlines?" A plain network-layer control cannot express that. A tool definition can describe the operation boundary, but the server has to enforce it.

--------------------------------------------------------
# Capabilities Instead of Destinations

I use a different boundary. The agent is not given a general-purpose HTTP or fetch tool. It has MCP tools instead. Each MCP server is a separate deployment that exposes one narrow capability and is designed to talk to one upstream only.

For news, that is `googlenews-mcp`. Its README describes the design constraint in one sentence: the agent talks only to this server, and this server talks only to `news.google.com`. The server exposes five tools and no more:

- `top_headlines`
- `topic_headlines`
- `search_news`
- `geo_headlines`
- `decode_urls`

There is deliberately no fetch-arbitrary-URL tool. That absence is the design. This server exposes only those five function signatures.

That gives me three useful constraints on this server. It cannot be used to connect to an arbitrary host, because none of its tools accepts a destination and the server constructs its upstream requests from a fixed Google News base URL. That is not the same as saying it cannot exfiltrate: `search_news` sends the agent-supplied query to Google News, which makes Google an allowed recipient. The server does not expose a tool for retrieving publisher content; it returns headlines and decoded URLs instead. The blast radius of a prompt injection is therefore limited on this path to Google News requests, the data this server returns, and any incidental redirect behavior. It is not limited overall: the same content can still influence what the agent asks other tools to do, including tools that act on the cluster or my home automation.

--------------------------------------------------------
# The Layers Underneath

The capability boundary does the real work. Two lower layers reinforce it.

**NetworkPolicy on the MCP server.** The explicit pod-to-pod ingress rule for `googlenews-mcp` allows the Envoy Gateway namespace to reach port 8080. It does not currently define an egress policy; therefore, it does not enforce "news.google.com and nothing else" at the network layer. The application starts its requests at `https://news.google.com`, but its `httpx` client follows redirects; that is not a strict destination allowlist. A real egress boundary would need an egress policy, DNS access, and a CNI or egress gateway that can enforce the chosen upstream restriction. Standard [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) works at the IP/port level, not by URL path or HTTP method.

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

Because these entries use only `namespaceSelector`, they allow every pod in each named namespace on port 11434, not one particular workload. Also, [NetworkPolicies are additive](https://kubernetes.io/docs/concepts/services-networking/network-policies/): another policy selecting the router can grant additional access. This excerpt shows the consumer rule; it is not, by itself, proof that these are the only allowed sources. Adding a new consumer namespace to this rule requires a git change, and a new namespace is not included by this rule by default.

--------------------------------------------------------
# The Cost

This pattern is more work than a proxy, and the work is per-capability rather than one-time.

In my fleet, every new source of information is a new repository, a new container image, a new set of manifests, and a new tool surface to design. Wanting the agent to read a second news source means building a second server. There is no configuration change that grants a new capability. That friction is intentional.

The tool surface also needs the same design attention as any other security control. Each tool you expose becomes part of the server's available capability set until you remove it or add an authorization boundary. `decode_urls` in the news server converts a Google redirect link into a publisher URL. That is useful, but it is also the closest thing in the fleet to a generic capability. The server returns the decoded URL rather than publisher content. Because the current HTTP client follows redirects, that is not a guarantee that no request can ever reach a publisher. If that distinction matters, disable cross-host redirects and enforce egress separately. It is still the tool I would scrutinize first if I were attacking this.

--------------------------------------------------------
# Security Notes

**This bounds one tool path—not the model or the whole agent.** Nothing here prevents a model from producing bad output. The goal is to limit what negative effects that output can cause through this particular capability.

**Tool surface is the security boundary. Review it like one.** A pull request that adds a tool is a potential privilege escalation request. Treat "add an optional `url` parameter" with the same suspicion you would treat a new firewall rule.

**Credentials still concentrate.** MCP servers often hold credentials for their upstreams. This news server does not need a Google API key, but it still holds the client bearer token and has network access to its upstream. The capability model limits what the agent can ask for; it does not limit what an attacker who compromises the server itself can do.

**Cluster access is the biggest risk.** My agent could hold a ServiceAccount token for Kubernetes. The controls above address one internet-facing tool path; they do nothing about the agent's permissions inside the cluster. That is governed by RBAC, and it deserves the same narrow treatment. Grant verbs and resources explicitly, avoid `cluster-admin`, and assume any content the agent reads may attempt to influence what it does next.

--------------------------------------------------------
# Wrapping Up

An egress proxy asks where a workload may connect. For an agent, the more useful question is what it may do. The answer should be a finite list of function signatures you can scope and read in one place.

The implementation is unglamorous: a small HTTP service per capability, a bearer token, a NetworkPolicy, and the discipline to refuse the generic escape hatch every time it would be convenient.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
