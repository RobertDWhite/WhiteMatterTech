---
title: "Turning an RSS Reader Into an Intelligence Pipeline"
date: "2026-08-16"
categories:
  - "ai"
  - "data"
  - "kubernetes"
  - "tutorials"
tags:
  - "ai"
  - "rss"
  - "freshrss"
  - "llm"
  - "ollama"
  - "kubernetes"
  - "influxdb"
  - "grafana"
  - "self-hosted"
aliases:
  - /posts/rss-intelligence-pipeline/rss-intelligence-pipeline
  - /2026/rss-intelligence-pipeline
cover:
  image: "cover.png"
---

--------------------------------------------------
# Introduction

An RSS reader is very good at collecting material and almost useless at telling me what deserves the next ten minutes of my day. On a busy morning, a hundred stories can arrive, four may alter a customer conversation or an account plan, and the rest bury them under wire copy, recycled commentary, and headlines whose relationship to the underlying event is thin.

Keyword alerts do not repair that problem. They report a word's presence, then happily ring for a passing reference, a syndicated rewrite, an executive departure, a funding round, and a lawsuit with no discernment among them. The human cost is familiar. An alert stream that repeats itself becomes background noise, and the article that did matter gets read after the meeting for which it would have been useful.

I use a language model after the feed reader, where it has a constrained job. My [self-hosted Ollama deployment](/posts/heterogeneous-ollama/) extracts a structured event from an article and helps collapse repetitive reporting into one account of what occurred. The scoring policy remains ordinary code. At work I use an enterprise agent, while this cluster deployment is the development environment in which I test the sequence, the prompts, and new pieces such as a Google News MCP server.

The same arrangement suits Customer Success, MSP and MSSP work, vendors, and competitive intelligence. Public information arrives quickly, unevenly, and without regard for anybody's calendar. A useful system must decide what merits interruption, preserve the lesser material for later, and leave a clear account of why it made either choice.

My [Politics Dashboard](/posts/politics-dashboard/) began from the same irritation. Its inputs are political reporting and X feeds, not customer accounts, but the work is identical: reduce a renewing stream to a handful of developments that a person can examine with enough context to form a judgment.

The version described here is a Kubernetes CronJob running against FreshRSS. Every thirty minutes it reads unread items, fetches full text when the feed entry is too thin, groups near-duplicates, extracts an event, scores it against configured profiles, and sends the result either to an alert or a watchlist. It also records story and profile history, which supports novelty checks, coverage gaps, and trends. Human feedback and InfluxDB metrics are available behind configuration flags. The job forbids overlap and has a 45-minute active deadline. A slow run therefore fails before it becomes a queue of stale work.

I have omitted customer-specific signals and profile details. The example configuration uses placeholder profiles. My own configuration names the organisations and subjects I follow.

I built the first version during paternity leave, in the irregular quiet between feeds and a newborn's sleep. It informed the production workflow I now use in Customer Success, although that workflow is not this deployment. This is the smaller system where I can take ideas apart without taking a customer process down with them.

--------------------------------------------------------
# The Pipeline

The `freshrss-bi-pipeline` job runs on an arm64 node with a one-gigabyte memory limit. The example configuration sets `unread_only: true`. Feedback and InfluxDB output are disabled there, while the accompanying Grafana dashboard remains available for deployments that turn on metrics.

FreshRSS supplies the intake through its Google Reader-compatible API. `ClientLogin` creates a session with the account's API password, then `stream/contents/reading-list` returns items from the reading list. FreshRSS separates that API password from the web-login password. I prefer that separation because a worker credential should not also administer the reader.

The pipeline starts with the unread item, then obtains article text when a summary does not give the extractor enough to work with. It assigns near-duplicates to a story cluster, tracks whether each new item adds information, asks an OpenAI-compatible endpoint for a typed event and impact record, and passes that record to deterministic scoring code for every configured profile. Confidence gates, cooldowns, and profile thresholds determine the alert path. Lower-scoring and suppressed material stays on a watchlist. The worker writes structured JSON and a Markdown digest, retains enough history to calculate novelty and gaps, and can emit InfluxDB metrics when that output is enabled.

The model endpoint can be any OpenAI-compatible service. Pointing it at an in-cluster Ollama endpoint under `/v1` keeps article text inside the cluster during inference. The full-text stage still contacts the source site first, which is a separate network decision with its own consequences.

--------------------------------------------------------
# Why Deduplication Comes First

One wire story can reach a dozen outlets in an hour. Each version may change the headline, the ordering, or a quote, while leaving the reported event intact. Without clustering, the worker converts one development into a run of alerts. Nobody keeps paying attention to that channel for long.

The first article creates the event record. Later coverage enlarges the cluster without automatically creating another alert. Novelty is the harder judgement here. A later article may add a material fact, or it may offer only colour around facts the pipeline already recorded. The distinction belongs before extraction quality or scoring finesse, because neither will salvage an alert channel that has trained its readers to mute it.

Cooldowns deal with a different problem. They prevent a recently alerted event from breaking into the day again, while the watchlist keeps the material available for a quieter review. Clustering stops the same event from multiplying. Cooldowns regulate its tempo.

--------------------------------------------------------
# Extraction and Scoring Have Different Jobs

The model reads an article and returns a structured event: type, entities, and an impact assessment. It does not decide whether that event matters to a particular account. That question belongs to a policy I can inspect, test, and alter when an alert proves wrong.

Python scores the extracted fields with signal matches, contextual terms, novelty, source quality, urgency, and profile-specific risk factors. The result is clamped to 0 through 100. Each profile supplies its own alert threshold because the interruption cost differs from one account to the next.

A general model judgement about relevance may sound persuasive and still shift with phrasing or context. A structured record gives the scoring code stable inputs. When an alert appears at the wrong time, I can follow the score breakdown to the weight or condition responsible for it, change that rule, and see the effect on the next run.

--------------------------------------------------------
# Feedback Without Training

Every alert can take a label. With feedback enabled, those labels adjust source, profile, and event-type weights in a state file. A feed that keeps producing clutter loses weight. An event type that proves useful gains weight in later scoring.

The feedback loop records numerical adjustments in a state file. They are visible, reversible, and bounded by configuration. I do not need a model registry to remember that one source has wasted my time for a month.

Coverage-gap monitoring watches the other failure mode: silence. A profile without any material for a configured interval may reflect a broken feed, an over-tight filter, or a quiet period. The explicit check keeps those cases in view.

--------------------------------------------------------
# Security Notes

**Every article is untrusted input.** Article text enters a prompt and can contain instructions dressed up as reporting, commentary, or quoted source material. The pipeline never treats model output as a command or tool call. A hostile article can still distort an extracted field and affect the wording of an alert or watchlist entry.

The current namespace policy permits all egress. The worker needs FreshRSS, optional article enrichment, the model endpoint, and any configured webhook or InfluxDB output. When those destinations are stable, a narrower policy would make the allowed paths easier to review.

**Keep inference local when the content is sensitive.** A hosted model API receives article text and may also receive profile data that reveals what I am watching. An in-cluster endpoint avoids that transfer. Article enrichment still needs its own carefully limited outbound access.

**The configuration holds sensitive information.** Profile definitions reveal what I am tracking and why. The current deployment stores them in a SOPS-encrypted ConfigMap manifest and mounts the decrypted file into the pod at runtime. A cleartext ConfigMap has no place in the repository.

**Respect the sources.** Full-text enrichment fetches articles directly. I use the skip list for paywalled and unsuitable domains, an identifying user agent, a character limit, and throttling. Fetched text stays out of redistribution.

--------------------------------------------------------
# Wrapping Up

Extraction and scoring were straightforward. Keeping an alert stream worth reading took more care. Deduplication, cooldowns, and coverage checks decide whether the system earns a place beside the work instead of adding another source of interruption.

The pattern travels beyond RSS. Group the repeated material first, extract a typed record, rank it with deterministic code, and keep feedback in a bounded state file. The model helps with interpretation. The rules that interrupt someone remain visible to the people who must live with them.

Questions or corrections? Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
