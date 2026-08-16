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

I consume far more feeds than I can reasonably examine with sustained attention, which means that the substantive difficulty lies not in volume alone but in the profoundly uneven distribution of relevance within that volume. On an active day, a hundred articles may arrive in rapid succession; perhaps four contain a development warranting action, while the remaining ninety-six obscure those few consequential pieces beneath a familiar and relentless accumulation of headlines, summaries, reposts, and derivative commentary.

Keyword alerts are the customary answer, yet they perform poorly when the objective is considered judgment rather than uncomplicated retrieval. They fire whenever a term appears, regardless of whether anything material has occurred; they reproduce the same wire story across each syndicated version; and they possess no interpretive basis for distinguishing a routine mention from a funding announcement, a lawsuit, an executive departure, or an operational failure that merits immediate attention.

To render that volume manageable, I use AI as an analytical and interpretive layer over the feed reader. My [self-hosted Ollama deployment](/posts/heterogeneous-ollama/) in the cluster summarizes individual articles, separates useful signal from surrounding repetition, and produces an account-level summary when several articles concern the same organization or commercial relationship. It can assemble a concise account of regional developments and longer-running trends; reporting groups can follow managers, directors, or other organizational tiers, with the degree of detail calibrated to the complexity of the intended audience and the question under consideration. At work, I use an enterprise-grade agent instead, but the underlying structure, analytical sequence, and workflow remain the same.

The approach has immediate implications for Customer Success, where an early and well-framed signal can materially improve preparation, prioritization, and the quality of a subsequent customer conversation. Its applicability extends equally to any role that requires near-real-time business intelligence concerning one or more companies or customer accounts. Managed service provider (MSP), managed security service provider (MSSP), vendor, and competitive-intelligence functions all confront the same fundamental problem: an abundance of public information, arriving with considerable velocity and insufficient structure to support sound professional judgment.

The same framework formed the basis for my [Politics Dashboard](/posts/politics-dashboard/), where the source material consists of political news and X feeds rather than account-focused reporting. The underlying requirement remains unchanged: transform a continuously renewing and frequently repetitive stream into a limited set of developments that a person can assess with care, context, and sufficient time for judgment.

The version described here runs as a Kubernetes CronJob against my FreshRSS instance. Every thirty minutes, it retrieves unread items, optionally obtains the complete article text, clusters near-duplicates, extracts a structured event with a language model, evaluates that event against a set of profiles, and directs the result either to an alert or to a watchlist for subsequent consideration. The job prohibits overlapping runs and has a 45-minute active deadline; together, those constraints prevent a slow cycle from quietly becoming an accumulating backlog that compromises the timeliness of later results.

This post describes the architecture in general terms, without disclosing customer-specific information or the particular signals that inform my professional priorities. The profiles in my own configuration reflect the organizations and subjects I follow, while the examples use the placeholder profiles that accompany the example configuration.

My current role is in Customer Success for a large cyber and data-security SaaS company, and I built and tested this workflow on my cluster during paternity leave, in the quiet and intermittent intervals between bouts of sleep. The project has direct implications for how I identify, contextualize, and prioritize customer-relevant developments, although the production workflow I use at work is not this deployment. This is the development version that informed that production implementation, and it remains the environment in which I evaluate new capabilities, including a self-built Google News MCP server.

--------------------------------------------------------
# The Pipeline

The pipeline comprises twelve discrete stages, although the feedback loop and InfluxDB output remain optional elements of the broader design:

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

The `freshrss-bi-pipeline` job runs on an arm64 node with a one-gigabyte memory limit. The example configuration enables `unread_only: true` while leaving feedback and InfluxDB output disabled; the accompanying Grafana dashboard is available to deployments that elect to enable InfluxDB and retain the resulting operational metrics.

The FreshRSS interaction rests upon two requests that merit understanding before any attempt to diagnose the worker: `ClientLogin` creates a session with the account's API password, and `stream/contents/reading-list` retrieves items from the reading list. FreshRSS deliberately uses a separate API password rather than the web-login password, thereby preserving a distinction between the service credential and the credential used to administer the reader itself.

The model endpoint can be any OpenAI-compatible service. When the pipeline uses an in-cluster Ollama endpoint at `/v1`, article text remains within the cluster during inference, even though the full-text enrichment stage still makes outbound requests to the relevant source websites before that inference commences.

--------------------------------------------------------
# Why Deduplication Comes First

A single wire story can appear in a dozen outlets within an hour, each version carrying a slightly different headline and an almost identical set of facts, quotations, and attributions. Without clustering, the pipeline can convert that one event into a succession of alerts, and an alert channel that repeats itself with mechanical regularity soon loses the trust that made it valuable in the first place.

Clustering near-duplicates, then tracking novelty within each cluster, addresses both the repetition and the more subtle question of whether anything has actually changed beneath the superficial variation in headlines and presentation. The first item establishes the initial event record; later items extend the cluster's coverage without automatically creating another event. Novelty distinguishes a consequential development from another article that merely restates facts already recorded, perhaps with additional color but without additional substance.

Cooldown suppression operates alongside clustering rather than replacing it. The configured cooldown prevents a recently alerted event from interrupting the reader again, while the watchlist preserves lower-scoring or suppressed material for subsequent review at a lower level of urgency and with a more appropriate degree of deliberation.

For that reason, deduplication is the first stage worth building. Extraction quality remains important, but a system that repeatedly alerts on the same event will encourage people to mute the channel before its more discerning and more valuable judgments can establish their credibility.

--------------------------------------------------------
# Extraction, Scoring, and Why They Are Separate

The model's job is deliberately narrow and circumscribed: it reads an article and emits a structured event containing a type, the entities involved, and an impact assessment. It is not asked to make the more ambiguous and consequential determination of whether that article matters to a particular profile, because that determination belongs to a policy that can be inspected, explained, and revised.

Scoring is deterministic Python operating over that structure. Signal matches, contextual terms, novelty, source quality, urgency, and profile-specific risk factors all contribute to the final score; the result is clamped to a 0–100 range, and each profile can establish its own minimum alert threshold according to the operational cost of an interruption.

Keeping extraction separate from scoring makes the system easier to test, tune, and defend when an interested reader asks why an alert appeared. A model asked whether an article is important to a profile can produce a result that is plausible yet unstable, contingent, and difficult to audit; structured extraction gives the scoring code consistent fields, and an incorrect alert can be traced through the score breakdown to the particular weight or condition that contributed to the result.

--------------------------------------------------------
# Feedback Without Training

Every alert can be labeled, which gives the system a modest but useful means of incorporating human review without converting that review into an opaque training process. When feedback is enabled, those labels can adjust weights for the source, profile, and event type: a feed that consistently produces noise can be down-weighted, while an event type that repeatedly proves material can carry greater influence in subsequent scoring.

This is arithmetic over a state file rather than model training, a distinction that keeps the feedback loop deliberately circumscribed, intelligible, and administratively tractable. The adjustments remain inspectable, reversible, and bounded by configuration; the pipeline therefore needs neither a training job nor a model registry merely to retain what human review has identified as useful.

Coverage-gap monitoring addresses the related circumstance in which no signal arrives at all. A profile that remains quiet for a configured period may reflect a broken feed, an excessively specific filter, or a genuinely uneventful interval; the explicit coverage check keeps those possibilities visible rather than allowing silence to pass unexamined and unqualified as success.

--------------------------------------------------------
# Security Notes

**Every article is untrusted input.** Article text enters a model prompt and can carry prompt-injection instructions disguised as ordinary prose, plausible commentary, or ostensibly authoritative source material. The pipeline does not treat a model response as an instruction, a command, or a tool call, although a malicious article can still distort extracted fields and influence the content of an alert or watchlist entry.

The current namespace policy permits all egress. The worker needs routes to FreshRSS, optional article enrichment, the model endpoint, and any configured webhook or InfluxDB output; where the requisite destinations are known and stable, a dedicated policy can narrow that access considerably and render the permissible network relationships more intelligible.

**Keep inference local when the content is sensitive.** Pointing the pipeline at a hosted model API sends article text to that provider, and the prompt can include profile data that reveals what you are monitoring and why the subject is of interest. An in-cluster model endpoint avoids that external transfer, even though the article-enrichment stage still requires its own carefully considered outbound access.

**The configuration is more sensitive than the output.** Profile definitions describe what you are watching and why, which can reveal considerably more than any individual alert or summary. The current deployment stores the configuration in a SOPS-encrypted ConfigMap manifest, and the pod receives the decrypted file at runtime. An equivalent cleartext ConfigMap does not belong in the repository; use encrypted-at-rest handling and appropriate namespace access controls in its place.

**Respect the sources.** Full-text enrichment fetches articles directly, which brings obligations that are easy to overlook when the remainder of the pipeline is local and apparently self-contained. Use the configured skip list for paywalled or unsuitable domains, send an identifying user agent, limit the number of characters retrieved, throttle requests, and do not redistribute fetched text.

--------------------------------------------------------
# Wrapping Up

Extraction and scoring proved less difficult than preserving the utility of the alert stream over time. Deduplication, cooldown suppression, and coverage-gap checks determine whether the system remains an instrument that a person can trust during an unusually busy week rather than another source of noise competing for attention and fragmenting already limited concentration.

The architecture extends beyond feeds: cluster first, extract a typed record with a model, rank it with deterministic code, and retain feedback in a bounded state file rather than treating model retraining as the presumptive answer. That combination gives the model a useful but deliberately limited role, while the rules that decide what deserves attention remain visible, intelligible, and subject to revision by the people who depend upon them.

Questions or corrections? Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
