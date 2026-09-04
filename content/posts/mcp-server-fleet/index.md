---
title: "Ten MCP Servers for Ten Self-Hosted Apps: One Pattern"
date: "2026-08-15"
categories:
  - "ai"
  - "kubernetes"
  - "homelab"
  - "tutorials"
tags:
  - "ai"
  - "mcp"
  - "claude-code"
  - "kubernetes"
  - "fastmcp"
  - "envoy-gateway"
  - "self-hosted"
aliases:
  - /posts/mcp-server-fleet/mcp-server-fleet
  - /2026/mcp-server-fleet
cover:
  image: "cover.png"
  alt: "A central MCP gateway connecting an AI client to self-hosted application services"
---

# A Reusable Access Layer

I first built [pages](https://whitematter.tech/posts/pages-mcp/), a static-site host with an MCP upload tool. It was useful enough that I kept repeating the design. The cluster now has ten MCP servers: `congress-mcp`, `freshrss-mcp`, `googlenews-mcp`, `gsc-mcp`, `jetlog-mcp`, `media-mcp`, `monica-mcp`, `nodebyte-mcp`, `pages`, and the Kubernetes server.

Each server fronts one self-hosted application. The similarity is intentional. They share the manifest layout, bearer-token boundary, hostname convention, and deployment path. Adding the tenth took about forty minutes, most of it spent writing the tool descriptions that decide whether a client can use the server sensibly.

An API-backed application can take this shape without becoming public infrastructure. The client receives a narrow interface. The application stays behind the cluster boundary.

--------------------------------------------------------
# The Common Shape

Every server begins with the same directory:

```
00-namespace.yaml
11-secret.sops.yaml          # MCP_TOKEN and upstream credentials
20-deployment.yaml
30-service.yaml
53-httproute-internal.yaml   # <app>-mcp.internal.white.fm
60-networkpolicy.yaml
ksops.yaml
kustomization.yaml
```

Some services need an `ExternalSecret` or an additional registry credential manifest. The bones stay the same. I copy the directory, replace the application values, issue a fresh bearer token, and review the deployment, service, route, and network policy as a unit.

The hostname is always `https://<app>-mcp.internal.white.fm/mcp`, resolved by internal DNS. The pod receives `MCP_TOKEN` and its upstream credentials through a Kubernetes Secret generated from SOPS or an external secret. Kubelet probes can still reach `/healthz`. Each service has its own image, referenced through the internal registry and pinned in `kustomization.yaml`, with digests and Renovate annotations where the deployment uses them. A default-deny NetworkPolicy then admits only the Envoy Gateway namespace to port 8080.

--------------------------------------------------------
# The Interface Carries the Design

These are small FastMCP HTTP services using Streamable HTTP and a bearer header. A compatible client registers one with a command like this:

```sh
claude mcp add --transport http jetlog \
  https://jetlog-mcp.internal.white.fm/mcp \
  --header "Authorization: Bearer <MCP_TOKEN>"
```

The difficult part is the tool boundary. Function names, type annotations, parameter descriptions, server instructions, and docstrings all become part of the interface a model sees. A tool called `add_flight` with a one-line description invites malformed calls. One that names the date format, airport-code format, and duplicate check gives the client a workable path through the task.

That boundary should resemble the request a person makes. `jetlog-mcp` could expose each flight-log REST endpoint. Instead it offers `parse_boarding_pass`, `check_duplicate`, `enrich_flights`, `get_statistics`, and `get_analytics`, because the usual request is "log this flight from my confirmation email." The underlying API sees a POST to `/api/flights`. The MCP server absorbs that translation.

--------------------------------------------------------
# Three Servers Worth Describing

**`media-mcp` joins a stack of applications.** It fronts the download-management and library services in my media stack, plus Plex and Tautulli. One endpoint can look up a film, add it to the appropriate workflow, trigger a search, request a Plex library scan, confirm that the item arrived, and inspect playback. The client does not need to coordinate a handful of unrelated APIs for one ordinary request.

**`monica-mcp` smooths over the deployed Monica interface.** Its Kubernetes deployment provides the Monica base URL, an account email, and a DAV token to the MCP container. The image handles the DAV layer and exposes higher-level operations. The client need not learn the upstream protocol to use the data.

**`gsc-mcp` keeps browser automation out of API work.** Search Console and IndexNow already expose APIs for submission and analytics. A browser is slower, more brittle, and forces credentials into a client session. The Google credential belongs in the service that needs it.

--------------------------------------------------------
# Security Notes

This fleet assumes a single-tenant cluster on a private tailnet. Internal hostnames, gateway-only NetworkPolicy ingress, and bearer tokens establish the present trust boundary. Credential-bearing services still deserve suspicion.

**Every server holds credentials.** `media-mcp` has several upstream API keys and tokens. `gsc-mcp` has a Google credential. A compromised server can expose the authority assigned to it. Each server in this fleet receives its own token. I treat every one as a production secret, even when the service feels like a convenience wrapper.

**Tokens are static and unrotated.** There is no rotation mechanism or client-specific scope. Ten servers mean ten long-lived secrets. I accept that on a private network. It is a poor default for a shared or public service.

**Tool scope needs active restraint.** `googlenews-mcp` has no arbitrary-URL fetch tool. Such a tool can turn a narrow capability into a general egress route. I wrote more about that constraint in [No Proxy, No Fetch Tool](https://whitematter.tech/posts/capability-scoped-agent-egress/).

`media-mcp` explicitly disables FastMCP's DNS-rebinding protection. A private-network assumption does not substitute for `Host` and `Origin` validation at an HTTP MCP endpoint. I would review that setting before putting this service anywhere beyond the trusted network.

--------------------------------------------------------
# The Practical Result

The cluster has ten services, ten image builds, and one manifest pattern. The repetition is deliberately dull. That is the point. A new integration inherits a familiar way to authenticate, route, deploy, and review its access surface.


## Related Posts

- [Agentic Static-Site Hosting: Giving Claude a Place to Publish on Kubernetes](/posts/pages-mcp/) — one of the ten, documented end to end.
- [No Proxy, No Fetch Tool: Capability-Scoped Internet Access for In-Cluster Agents](/posts/capability-scoped-agent-egress/) — the egress rules these servers are deployed behind.
- [Hermes: Encrypted Conversation, Deliberate Authority](/posts/hermes-encrypted-agent-authority/) — the agent that consumes this tool surface.
- [One Ollama Endpoint, Two Very Different Backends](/posts/heterogeneous-ollama/) — the inference endpoint an agent reaches for alongside these tools.


Questions or corrections? Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
