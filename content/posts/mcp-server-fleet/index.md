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

I recently wrote about [pages](https://whitematter.tech/posts/pages-mcp/), a static-site host with an MCP upload tool. That server was the first in a fleet that has since grown to ten.

I now run ten MCP servers in the cluster. Each presents one self-hosted application: `congress-mcp`, `freshrss-mcp`, `googlenews-mcp`, `gsc-mcp`, `jetlog-mcp`, `media-mcp`, `monica-mcp`, `nodebyte-mcp`, `pages`, and the Kubernetes server. They share a core manifest pattern, a bearer-token boundary, a hostname convention, and a deployment path. Adding the tenth took approximately forty minutes; most of that time went into writing tool descriptions.

This post describes the pattern across the fleet. If you self-host an application with an API, the pattern offers a repeatable way to make that application available to a large-language-model (LLM) client while keeping the application itself off the public internet.

--------------------------------------------------------
# The Common Shape

Every server follows the same core directory pattern:

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

Some servers add an `ExternalSecret` or another registry and credential manifest, although the core shape remains stable. Adding a server usually involves copying the directory, replacing the application-specific values, and creating a new bearer token. The deployment, service, route, and policy decisions remain explicit in the copied files.

Four conventions govern the fleet:

- **Hostname.** `https://<app>-mcp.internal.white.fm/mcp`, resolved through internal DNS. These routes are not intended for the public internet.
- **Authentication.** A static bearer token in `MCP_TOKEN`, supplied to the pod through a Kubernetes Secret generated from SOPS or an external secret. `/healthz` remains open for kubelet probes.
- **Images.** Each server has its own container image. The deployment uses an internal registry reference, and `kustomization.yaml` pins the image tag, with digest pins where used. Several deployments carry Renovate update annotations.
- **Ingress.** A default-deny NetworkPolicy is paired with a policy that permits only the Envoy Gateway namespace to reach the service on port 8080.

--------------------------------------------------------
# The Interface Carries the Design

The servers are thin HTTP services built with `FastMCP`. They use Streamable HTTP with a bearer header. An MCP client that supports this transport and header-based authentication can register a server with a single command:

```sh
claude mcp add --transport http jetlog \
  https://jetlog-mcp.internal.white.fm/mcp \
  --header "Authorization: Bearer <MCP_TOKEN>"
```

The substantive engineering resides in two places: the tool boundaries and the metadata that describes them.

Tool metadata forms part of the interface presented to the model. In these servers, function names, type annotations, parameter descriptions, server instructions, and docstrings all influence how a client invokes a tool. A tool named `add_flight` with a one-line description leaves too much room for malformed input. A description that specifies the date format, airport-code format, and duplicate-check step gives the client a usable sequence of calls.

The tools must correspond to the way a person requests work. `jetlog-mcp` provides the clearest example. A thin wrapper could expose the flight-log REST endpoints one-to-one. The server instead exposes `parse_boarding_pass`, `check_duplicate`, `enrich_flights`, `get_statistics`, and `get_analytics`, because the usual request is "log this flight from my confirmation email." The underlying API would represent that request as "POST to /api/flights."

--------------------------------------------------------
# Three Servers Worth Describing

**`media-mcp` joins a stack of applications.** The server currently fronts Radarr, Sonarr, Prowlarr, Readarr, Bazarr, LazyLibrarian, Plex, and Tautulli. One MCP endpoint can look up a movie, add it to Radarr, trigger a search, request a Plex library scan, confirm that the item arrived, and inspect current playback. Separate wrappers would expose each API independently, leaving more cross-service sequencing to the client. This server keeps that workflow within one operational boundary.

**`monica-mcp` is a compatibility layer for the deployed Monica interface.** The Kubernetes deployment supplies the Monica base URL, an account email, and a DAV token to the MCP container. The image handles the DAV details and exposes higher-level operations to the client. The useful boundary is the translation layer: the client need not understand the upstream protocol.

**`gsc-mcp` replaces browser automation for API-backed work.** Search Console and IndexNow expose APIs for submission and analytics tasks. Browser automation is slower, more fragile, and requires credentials within a client session. Keeping the Google credential in the server confines credential handling to the service that requires it.

--------------------------------------------------------
# Security Notes

The fleet assumes a single-tenant cluster reachable through a private tailnet. The routes use internal hostnames, NetworkPolicy limits traffic to the gateway path, and each server checks a bearer token before serving MCP requests. These controls describe the current trust boundary; they do not eliminate the risks associated with credential-bearing services.

**Every server is a credential holder.** `media-mcp` holds multiple upstream API keys and tokens. `gsc-mcp` holds a Google credential. A compromise of one server can expose the upstream capabilities and credentials assigned to that server. Use a distinct token per server, as this fleet does, and treat every token as a production credential; convenience strings are an unsafe mental model.

**Tokens are static and unrotated.** This design has no rotation mechanism or per-client scoping. Ten servers mean ten long-lived secrets. That is an accepted trade for a private network; it is unsuitable as a default for a shared or public service.

**Scope tools deliberately.** `googlenews-mcp` has no arbitrary-URL fetch tool. A generic fetch escape hatch can turn a narrow capability into a general egress primitive. Add one only when the use case, allowed destinations, and response handling are explicit. I wrote about this in a [separate post on capability-scoped egress](https://whitematter.tech/posts/capability-scoped-agent-egress/).

The `media-mcp` implementation explicitly disables FastMCP's DNS-rebinding protection. A private-network assumption does not replace `Host` and `Origin` validation at an HTTP MCP endpoint. Review that setting before exposing the service beyond the trusted network.

--------------------------------------------------------
# The Practical Result

The fleet consists of ten services, ten image builds, and one reusable manifest pattern. The repeated work is intentionally uninteresting. The valuable asset is the directory structure and the four conventions; an individual implementation is less consequential.

If you self-host applications and use an LLM client daily, build the uniform access layer first. It gives each subsequent integration the same model for authentication, routing, deployment, and review.

Questions or corrections? Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
