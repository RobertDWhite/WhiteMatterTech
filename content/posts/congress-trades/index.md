---
title: "Parsing Every Congressional Stock Disclosure: Eighteen CronJobs and a Lot of Bad PDFs"
date: "2026-08-09"
categories:
  - "data"
  - "kubernetes"
  - "ai"
  - "tutorials"
tags:
  - "ai"
  - "kubernetes"
  - "postgres"
  - "ocr"
  - "data-engineering"
  - "finance"
  - "authentik"
  - "self-hosted"
cover:
  image: "cover.png"
  alt: "The congress-trades dashboard showing trade-count and volume KPIs, a weekly buy/sell chart, and a hot-tickers list"
  caption: "Totals, weekly disclosed buy/sell activity, and the 7-day ticker list from the public view."
  relative: true
aliases:
  - /posts/congress-trades/congress-trades
  - /2026/congress-trades
---

--------------------------------------------------
# Introduction

Members of the US Congress are required to disclose their stock trades. The disclosures are public. They are also, as a dataset, close to unusable: the House publishes a ZIP of filings whose underlying documents are frequently scanned images, the Senate publishes through a separate system with its own quirks, tickers are inconsistent or absent, and neither chamber publishes anything you could call an API.

Several commercial services solve this and sell the result. I wanted to see how much of it I could do myself, in-cluster, from the primary sources.

The answer is `congress-trades`, running at `congress.white.fm`. It parses both chambers directly, enriches trades with party and district, reconstructs approximate net worth from annual financial disclosure reports, tags sectors, backtests follow-the-politician strategies, and serves the result behind public SSO. This post covers the architecture and the parts that turned out to be hard.

--------------------------------------------------------
# Read This First

> **This project is a research and data-engineering exercise. It is not an investment strategy, and nothing here is investment advice.**
>
> I built it to see whether public disclosures could be parsed reliably from the primary sources. I did not build it to trade on, I do not trade on it, and it should not be used to make financial decisions.
>
> I am not a licensed financial advisor. Nothing in this post or in the application is a recommendation to buy or sell any security. If you want advice about your money, talk to someone qualified to give it.
>
> The backtests in particular deserve suspicion rather than confidence. Members disclose trades up to 45 days after execution, which means any strategy built on this data is acting on information that is already weeks stale by the time it exists. On top of that lag, the backtests carry the usual defects of any backtest built by one person against a small sample: no transaction costs, no slippage, survivorship effects, and a sample size far too small for the results to mean anything. They are in the application because the parsing problem was interesting and the numbers fall out of the data almost for free. They are not evidence that following anyone's trades works.
>
> The underlying data is also approximate by construction. It is OCR-derived in places, tickers are inferred where filings omit them, and net worth is reconstructed from bracketed ranges rather than reported values. Treat every number as an estimate with an error bar.

--------------------------------------------------------
# The Shape

One Postgres instance, one API deployment, one UI deployment, and eighteen CronJobs. The CronJobs are the application; the API mostly reads what they wrote.

They fall into three tiers by cadence.

**Ingest, every fifteen to twenty minutes.** The House job pulls the disclosure ZIP with a conditional GET, which means it returns 304 and does nothing on most runs. The Senate job walks the filing list incrementally and stops when it reaches a filing it has already seen, with a two-second throttle between requests. A third job cross-checks both twice daily as a safety net.

**Enrichment, hourly to daily.** Live quotes every ten minutes, an SEC 8-K firehose every thirty, legislative context every six hours, StockTwits sentiment every six hours, price history and follower returns each morning, AI-written summaries at 06:30.

**Slow-moving, weekly.** Party, state, and district come from the `congress-legislators` dataset on Sundays. Net worth recalculates Monday mornings, because annual reports update roughly once a year and rechecking is cheap.

Splitting on cadence rather than on subject matter is what keeps this affordable. The expensive, polite scrapers run rarely. The cheap conditional-GET poller runs constantly and usually does nothing.

--------------------------------------------------------
# Parsing Is the Whole Problem

Everything interesting is in the ingest tier, and it is all recovering structure from documents that were never meant to be machine-read.

House filings arrive as PDFs. Some are digitally generated and yield clean text with `pdftotext`. Others are scans, sometimes of a printout of a form filled in by hand, and require OCR. The parser tries text extraction first and falls back to OCR when the extracted text is empty or implausibly short. Neither path is reliable enough to trust on its own, which is why a reconciliation job exists.

Tickers are the second problem. A filing may name "Apple Inc" with no symbol, may use a symbol that has since changed, or may describe a holding in a way that maps to no symbol at all. A separate job runs conservative ticker normalization against trades with null tickers every six hours. Conservative is the operative word: a wrong ticker is worse than a missing one, because a wrong ticker silently corrupts every downstream calculation.

The reconciliation job runs every four hours and compares parser output against an independent feed. It exists because a parser that silently degrades is the most likely failure mode in a system like this. Filings keep arriving, rows keep being written, dashboards keep rendering, and the numbers are quietly wrong. Comparing against a second source is the cheapest way to notice.

--------------------------------------------------------
# Net Worth From Annual Reports

Trades tell you what someone bought. They do not tell you whether the purchase was significant relative to their holdings, and a $15,000 trade means something different for different members.

Annual financial disclosure reports give asset ranges rather than values, which means the reconstruction is necessarily approximate: the output is a band, not a number. The job that builds this runs weekly and its result is presented as a range in the UI, deliberately, because presenting a midpoint as a figure would imply precision the source documents do not contain.

--------------------------------------------------------
# Serving It Publicly

The site is public, which meant deciding what is public. Three routes handle it: an internal route with no gate, a public route behind Authentik, and a public route with no auth for the pages that are open to everyone.

The Authentik integration follows the same pattern as my other public services. A proxy provider is created through the Authentik API rather than clicked together in the UI, which keeps the configuration reproducible and in version control alongside everything else.

--------------------------------------------------------
# Security and Accuracy Notes

**Be a polite scraper.** The Senate job throttles two seconds between requests and stops as soon as it recognizes a filing. The House job uses conditional GETs and does nothing on a 304. These are public records and the servers are public infrastructure, and a homelab project has no business hammering either.

**Approximate data must be labeled approximate.** Net worth comes from bracketed ranges. OCR output has an error rate. Ticker normalization is a guess. Every one of those is presented as what it is. A project like this fails by producing confident, wrong precision rather than by crashing.

**Say plainly what the thing is for.** Publishing a dashboard that backtests follow-the-politician strategies invites people to read it as a strategy, and a disclaimer buried at the bottom does not undo that. Put it up front, in the application as well as the write-up, and state the specific reasons the output is not actionable rather than relying on boilerplate. The 45-day disclosure lag is the single most important one, and it is a fact about the data rather than a legal hedge.

**Anything scraped is untrusted input.** Filing text, article text, and social sentiment all flow into an LLM summarization step. None of it is trusted, and the summarization step has no tools and no ability to act.

--------------------------------------------------------
# Wrapping Up

The engineering that took the time was accepting that the input is a pile of scanned PDFs from two incompatible systems, then building the reconciliation and labeling that let you use the output honestly anyway.

Eighteen CronJobs sounds like a lot until you notice that fifteen of them are cheap and idempotent, and the three that are not run once a week.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
