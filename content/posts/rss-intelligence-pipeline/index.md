---
title: "Turning an RSS Reader Into an Intelligence Pipeline"
date: "2026-08-09"
draft: true
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

I read a lot of feeds. The problem with feeds is relevance rather than volume. A hundred articles arrive, four of them matter to something I am tracking, and the other ninety-six make the four harder to find.

Keyword alerts are the usual fix, and they are poor at this job. They fire on every mention of a term regardless of whether anything happened, repeat for every syndicated copy of the same story, and cannot distinguish a funding announcement from a lawsuit.

To handle that volume, I layer AI over the feed reader. My [self-hosted Ollama deployment](/posts/heterogeneous-ollama/) in the cluster summarizes individual articles and helps distinguish signal from noise. When multiple articles concern the same account, it produces an account-level summary. It can also summarize regional developments and trends. The reporting groups can follow managers, directors, or other organizational tiers, with output detail matched to the desired level of complexity. At work, I use an enterprise-grade agent for this workflow instead.

This approach has clear implications for Customer Success, but it also fits any role that needs near-real-time business intelligence on one or more companies or customer accounts. Examples include managed service provider (MSP), managed security service provider (MSSP), vendor, and competitive-intelligence workflows.

The same framework was the basis for my [Politics Dashboard](/posts/politics-dashboard/), which applies it to political news and X feeds.

What I built runs as a Kubernetes CronJob against my FreshRSS instance. It pulls unread items, optionally fetches article text, clusters near-duplicates, extracts structured events with a language model, scores each event against a set of profiles, and routes the results to alerts or a watchlist. The deployed job runs every 30 minutes, forbids overlapping runs, and has a 45-minute active deadline.

This post describes the architecture generically. The profiles in my configuration are specific to what I track, and the examples here use the placeholder profiles that ship in the example configuration.

My current role is in Customer Success for a large cyber and data-security SaaS company, and I built and tested this workflow on my cluster during paternity leave, between bouts of sleep. The project has direct implications for how I identify and prioritize customer-relevant developments. The production workflow I use at work is not this deployment. This is the development version that informed it, and it remains my test environment for new features, including a self-built Google News MCP server.

--------------------------------------------------------
# The Pipeline

The design has twelve stages. Feedback and InfluxDB output are optional:

1. Pull unread items from the FreshRSS Google Reader-compatible API.
2. Optionally fetch full article text, because feed summaries provide weak extraction input.
3. Cluster near-duplicate stories and track novelty within each story cluster.
4. Extract a structured event and impact schema with an OpenAI-compatible model endpoint.
5. Score each event against each configured customer profile.
6. Route results to alerts or a watchlist using confidence gates and cooldown suppression.
7. Apply per-profile dynamic thresholds.
8. Monitor for profiles that receive no signal.
9. When enabled, ingest human feedback labels to adjust source, profile, and event-type weights.
10. Write structured JSON and a Markdown digest.
11. Persist story and profile history for novelty, coverage-gap, and trend calculations.
12. When enabled, write metrics to InfluxDB for Grafana.

The `freshrss-bi-pipeline` job runs on an arm64 node and has a one-gigabyte memory limit. The example configuration enables `unread_only: true`, disables feedback, and disables InfluxDB output. The Grafana dashboard exists for deployments that enable that output.

The FreshRSS protocol has two relevant requests: `ClientLogin` creates a session with the account's API password, and `stream/contents/reading-list` reads items from the reading list. FreshRSS uses a separate API password rather than the web-login password.

The model endpoint can be any OpenAI-compatible service. When the pipeline uses an in-cluster Ollama endpoint at `/v1`, article text remains inside the cluster during inference. Full-text enrichment still makes outbound requests to source websites before inference.

--------------------------------------------------------
# Why Deduplication Comes First

A single wire story can appear in many outlets within an hour. Without clustering, the pipeline can produce multiple alerts for one event, which quickly destroys trust in the alert channel.

Clustering near-duplicates and tracking novelty within each cluster addresses both problems. The first item establishes the initial event record. Later items update the cluster's coverage without automatically creating another event. Novelty distinguishes a new development from another article repeating the same facts.

Cooldown suppression works alongside clustering. The configured cooldown prevents a recently alerted event from interrupting again, while the watchlist retains lower-scoring or suppressed material for review.

Deduplication is the first stage worth building. Extraction quality matters, but duplicate alerts can make people mute the channel.

--------------------------------------------------------
# Extraction, Scoring, and Why They Are Separate

The model's job is narrow: read the article and emit a structured event with a type, the entities involved, and an impact assessment. It is not asked to decide whether the article matters to a particular profile.

Scoring is deterministic Python over that structure. Signal matches, context terms, novelty, source quality, urgency, and profile-specific risk factors contribute to the score. Scores are clamped to a 0–100 range, and each profile can define its own minimum alert score.

Separating extraction from scoring makes the system easier to test and tune. A model asked whether an article is important to a profile can produce an unstable, difficult-to-audit result. Structured extraction gives the scoring code consistent fields. When an alert fires incorrectly, the score breakdown identifies the contributing weight.

--------------------------------------------------------
# Feedback Without Training

Every alert can be labeled. When feedback is enabled, labels can adjust weights for the source, profile, and event type. A feed that consistently produces noise can be down-weighted, and an event type that consistently matters can receive more weight.

This is arithmetic over a state file rather than model training. The adjustments remain inspectable, revertible, and bounded by configuration. The pipeline does not need a training job or a model registry for this feedback loop.

Coverage-gap monitoring handles the related case. A profile that receives no signal for a configured period may indicate a broken feed, an over-specific filter, or a genuinely quiet period. The explicit coverage check keeps those possibilities visible instead of treating silence as success.

--------------------------------------------------------
# Security Notes

**Every article is untrusted input.** Article text enters a model prompt and can carry prompt-injection instructions. The pipeline does not treat a model response as an instruction, a command, or a tool call. A malicious article can change extracted fields and influence an alert or watchlist entry.

The current namespace policy permits all egress. The worker needs paths to FreshRSS, optional article enrichment, the model endpoint, and any configured webhook or InfluxDB output. A dedicated policy can narrow that access where the required destinations are known.

**Keep inference local when the content is sensitive.** Pointing the pipeline at a hosted model API sends article text to that provider. The prompt can include profile data as well, which may reveal what you are monitoring. An in-cluster model endpoint avoids that external model transfer.

**The configuration is more sensitive than the output.** Profile definitions describe what you are watching and why. That information can reveal more than an individual alert. The current deployment stores the configuration in a SOPS-encrypted ConfigMap manifest, and the pod receives the decrypted file at runtime. Do not commit an equivalent cleartext ConfigMap; use encrypted-at-rest handling and appropriate namespace access controls.

**Respect the sources.** Full-text enrichment fetches articles directly. Use the configured skip list for paywalled or unsuitable domains, send an identifying user agent, limit the number of characters retrieved, throttle requests, and do not redistribute fetched text.

--------------------------------------------------------
# Wrapping Up

Extraction and scoring were less difficult than keeping the alert stream useful. Deduplication, cooldown suppression, and coverage-gap checks determine whether the system remains usable.

The architecture works beyond feeds: cluster first, extract a typed record with a model, rank it with deterministic code, and keep feedback in a bounded state file rather than treating model retraining as the default answer.

Questions or corrections? Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
