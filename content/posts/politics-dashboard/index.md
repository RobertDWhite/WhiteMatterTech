---
title: "Politics Dashboard: A Self-Hosted, AI-Summarized News & X Feed Reader"
date: "2026-05-06"
categories:
  - "homelab"
  - "ai"
  - "kubernetes"
  - "oss"
  - "tutorials"
tags:
  - "ai"
  - "politics"
  - "rss"
  - "ollama"
  - "llm"
  - "fastapi"
  - "react"
  - "freshrss"
  - "nitter"
  - "self-hosted"
  - "ghcr"
cover:
  image: "cover.png"
  alt: "Politics Dashboard screenshot"
  caption: ""
  relative: true
---

# Politics Dashboard: A Self-Hosted, AI-Summarized News & X Feed Reader

I built and open-sourced a self-hosted news dashboard that aggregates political news from RSS or FreshRSS, summarizes individual articles with a configurable large language model (LLM), generates a 24-hour thematic digest, and presents X posts with per-account summaries through a self-hosted Nitter instance. The repository is [github.com/RobertDWhite/politics-dashboard](https://github.com/RobertDWhite/politics-dashboard); it is MIT-licensed, and multi-architecture images are available at `ghcr.io/robertdwhite/politics-{api,ui}`. The production image is the same image GitHub Actions builds from `main`.

This post documents the architecture, the configuration model, my own deployment, and the engineering issues encountered while generalizing the project for OSS release.

---

## Origin

I had a FreshRSS instance with several hundred feeds, organized under *News* and *U.S. Government*. Reading it had deteriorated into opening sixty tabs each morning, skimming a sentence from each, and closing fifty-five. The signal-to-noise ratio was poor.

I had Ollama running locally with `llama3.1:8b` for unrelated work. I started piping articles through it for two-sentence summaries. Quality was acceptable: enough to triage headlines, not enough to replace reading.

The first version ran in my cluster behind Authentik as two services and a few hundred lines of code, with two categories and several dozen X handles. It became the first tab I opened each morning, which warranted further investment.

## Architecture

Two services, no shared persistent state, and no database.

**API.** FastAPI plus httpx. Polls feeds, summarizes articles, generates digests. The state is held in process memory (Python dicts plus an `asyncio.Queue`). Resident memory: ~150 MiB.

**UI.** Vite, React, TypeScript. Static SPA served by an unprivileged nginx container. nginx reverse-proxies `/api/*` to the API. Resident memory: ~30 MiB.

State is intentionally ephemeral. Restarting the API pod triggers a new poll of every source. The dashboard is a view over external feeds rather than a system of record; that decision keeps the operational footprint sufficiently small that it requires no persistent volume claims or backup configuration.

Four loops run inside the API:

| Loop | Cadence | Role |
| ---- | ------- | ---- |
| Feed refresher | 15 min | Polls FreshRSS or direct RSS, merges into article store, enqueues new IDs for summarization |
| Per-article summarizer | continuous | Pulls one article off the queue, calls the LLM, stores 2–3 sentence summary keyed by article ID |
| 24-hour digest generator | 1 hour | Sends the last 24h of articles to the LLM with a structured-markdown prompt, stores the result |
| X handle summarizer | 3 hours | Fetches Nitter RSS for each handle, summarizes recent posts per account |

The digest prompt requests markdown output with `## Category` headers, bolded lead phrases, and a *Bottom Line* closer. The front-end has a regex-based markdown renderer (~80 lines) that handles headers, bullet lists, ordered lists, and inline `**bold**`. No third-party markdown dependency.

## Configuration model

A single `config.yaml` drives the application. Secrets and per-deploy overrides live in environment variables. The schema separates four concerns: title, LLM provider, feeds, and Twitter.

**LLM.** Two providers: `openai_compatible` (covers Ollama, OpenAI, vLLM, LM Studio, Together, Groq — anything with a `/chat/completions` endpoint) and `anthropic` (Messages API). One coroutine signature: `chat(system, user, max_tokens) -> str`. API keys come from environment variables named in the YAML.

**Feeds.** Two sources: `rss` (direct fetch of feed URLs) or `freshrss` (Greader API to an existing FreshRSS instance). Categories are user-defined: an arbitrary slug, a UI label, and either a list of URLs or a FreshRSS category name. The API has no opinions about reasonable category names.

**Twitter.** This component is optional and requires a self-hosted Nitter instance; public instances frequently impose availability and rate-limit constraints unsuitable for a recurring workload. Handle lists can be declared in YAML or retrieved from environment variables through `handles_env_prefix`, the arrangement I use because it keeps the lists in a SOPS-encrypted Kubernetes Secret.

**UI.** The API exposes a `/config` endpoint at startup. The front-end builds its category tabs, page title, and X-panel sections from that response. The same UI image works for any beat — political, scientific, hobby — without rebuilding.

## Production deployment

My deployment in summary:

```yaml
title: "Politics & Government"

llm:
  provider: openai_compatible
  base_url: http://ollama-router.ai-stack.svc.cluster.local:11434/v1
  model: llama3.1:8b

feeds:
  source: freshrss
  freshrss:
    url: http://freshrss.freshrss.svc.cluster.local/api/greader.php
    username: robert
    password_env: FRESHRSS_API_PASSWORD
  categories:
    news:             { label: News,        freshrss_label: News }
    government:       { label: Federal Gov, freshrss_label: "U.S. Government" }
    state_government: { label: State Gov,   freshrss_label: "Ohio State Government" }

twitter:
  enabled: true
  nitter_url: http://nitter.nitter.svc.cluster.local:8080
  handles_env_prefix: X
  categories:
    politics:         { label: Politics,    handles: [] }
    government:       { label: Federal Gov, handles: [] }
    state_government: { label: State Gov,   handles: [] }
```

Three categories, ~50 X handles split across them. ArgoCD watches the manifests and auto-syncs. Images come from GitHub Actions on every push to `main`, multi-arch (`linux/amd64`, `linux/arm64`), tagged `:main`, `:sha-<short>`, and on tag pushes, semver.

The end-to-end change cycle for a new X handle is approximately thirty seconds: `sops --set` updates the secret, `git push` initiates the ArgoCD reconciliation, and `kubectl rollout restart deployment/politics-api -n politics` ensures that a fresh pod receives the new environment variable.

Adding a new category requires edits to the ConfigMap and Secret, both committed to the same repository; the resulting change requires one commit and one rollout.

## Engineering issues encountered

A brief post-mortem follows, covering five issues that required non-trivial investigation. The intent is to reduce the diagnostic burden for the next operator who encounters them.

**1. Reasoning-model `<think>` tags appearing in summaries.** When I substituted qwen3 and deepseek-r1 variants, their output included `<think>...</think>` material before the user-facing summary. The mitigation is a `re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)` after each LLM response and before storage or display. Applications that permit arbitrary model selection should anticipate this output format and handle it deliberately.

**2. nginx `rewrite ... break` halts subsequent `set` directives.** First attempt at a runtime-configurable upstream:

```nginx
location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    set $api_upstream ${API_UPSTREAM};
    proxy_pass $api_upstream;
}
```

Result: `proxy_pass: invalid URL prefix in ""` at request time, with a warning that `api_upstream` was uninitialized. Root cause: `set` belongs to `ngx_http_rewrite_module`, and `rewrite ... break` halts further processing of that module. Fix: place `set` before `rewrite`. Documented in the nginx manual, but it's easy to miss (at least I did).

**3. nginx `proxy_pass` with a variable does not strip the location prefix.** With a literal upstream (`proxy_pass http://api:8000/;`), nginx replaces the matched location prefix with the trailing slash from `proxy_pass`. With a variable upstream (`proxy_pass $api_upstream;`), nginx forwards the request URI verbatim. Result: `/api/config` was being forwarded as `/api/config` to a FastAPI app that serves at `/config`. All requests returned 404. Fix: an explicit `rewrite` before the `proxy_pass`. Both this and issue #2 are documented; both still cost me an hour.

![Remember: a few hours of trial and error can save you 30 minutes of reading the docs](trial-and-error.jpg)

**4. Vite environment variables are baked at build time.** The Nitter iframe URL is a front-end concern—the browser, rather than the API, makes that request—and must therefore be reachable by end users. The API can use a separate internal URL for RSS retrieval. My first attempt placed the iframe URL in the runtime ConfigMap; `VITE_*` variables are inlined into the JavaScript bundle at build time rather than read at runtime. The interim arrangement is a build argument on the UI Dockerfile, with the OSS workflow building images without it; published OSS images consequently render blank iframes unless they are rebuilt. The planned V2.1 change moves the iframe URL into the runtime `/config` payload, allowing the published GHCR image to operate with any user-supplied Nitter instance.

**5. The first OSS UI image broke the production deployment.** `politics-ui:2.0.0` shipped with `proxy_pass http://api:8000` hard-coded—correct for `docker compose up`, where the service is named `api`, but incorrect for my Kubernetes deployment, where it is named `politics-api`. The cluster remained on "Loading…" until V2.0.3 was released an hour later, after issues #2 and #3 were corrected. The lesson is operational rather than novel: test the Kubernetes path end to end before tagging an OSS release. Releases from V2.0.4 onward are intended to receive a full test-cluster pass before tagging.

## Out of scope

Four explicit non-goals.

**No persistent database.** Historical search, multi-month trend charts, and an audit of the page at a given moment constitute a different application. Adding PostgreSQL would change the operational character materially; the intended use case, a current daily front page, does not justify that additional state.

**No social-media ingestion beyond Nitter.** Mastodon, Bluesky, Threads each have their own auth, rate-limit, and content-shape conversations. Possible future providers.

**No editorial layer.** The summarization prompts request factual, neutral, specific output. Digest section names are picked by the model from the day's news content. Whatever editorial slant the dashboard exhibits comes from the user's feed list and handle list, both of which are configurable.

## Closing observation

Most of the open-source work resided outside the application logic. It lay at the boundary between *what I had built for myself* and *what could plausibly run for another operator without my particular FreshRSS, Ollama, Nitter, and feed list*. Making that boundary explicit constitutes much of the open-source effort.

The code is a compact tool that I run daily. For any deployment, the chosen categories may reveal more about the configuration than the selected model or feed sources, because they describe the material to which the operator has chosen to attend.

---

> Source: [github.com/RobertDWhite/politics-dashboard](https://github.com/RobertDWhite/politics-dashboard). Images: `ghcr.io/robertdwhite/politics-api`, `ghcr.io/robertdwhite/politics-ui` (multi-arch). License: MIT.
>
Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a pull request](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
