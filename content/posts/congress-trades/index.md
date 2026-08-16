---
title: "Parsing Every Congressional Stock Disclosure: Seventeen CronJobs and a Lot of Bad PDFs"
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

Members of the United States Congress must disclose many securities transactions, and the resulting records are public. As a dataset, however, they are close to unusable: the House publishes a ZIP archive whose underlying filings are frequently scanned images; the Senate uses a separate system with its own irregularities; tickers are inconsistent or absent; and neither chamber provides an interface resembling a durable public API.

Several commercial services solve this and sell the result. I wanted to see how much of it I could do myself, in-cluster, from the primary sources.

The result is `congress-trades`, running at `congress.white.fm`. It ingests both chambers directly, enriches records with party and district data, estimates net-worth ranges from annual financial-disclosure reports, assigns sectors, calculates hypothetical follow-the-politician backtests, and serves the result behind public single sign-on. This post describes the architecture and the portions that demanded the greatest care.

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

One PostgreSQL instance, one API deployment, one UI deployment, and seventeen CronJobs compose the system. The CronJobs perform the substantive application work; the API primarily reads and presents their output.

They fall into three tiers by cadence.

**Ingest, every fifteen to twenty minutes.** The House job pulls the disclosure ZIP with a conditional GET, which means it returns 304 and does nothing on most runs. The Senate job walks the filing list incrementally and stops when it reaches a filing it has already seen, with a two-second throttle between requests. A third job cross-checks both twice daily as a safety net.

**Enrichment, from ten minutes to daily.** Quote refreshes run every ten minutes; SEC 8-K collection runs every thirty minutes; legislative context and StockTwits sentiment refresh every six hours; price history, follower returns, and model-generated summaries run each morning.

**Slow-moving, weekly.** Party, state, and district come from the `congress-legislators` dataset on Sundays. Net worth recalculates Monday mornings, because annual reports update roughly once a year and rechecking is cheap.

Cadence, rather than subject matter, determines the division of work. The more expensive and deliberately restrained scrapers run infrequently, whereas the inexpensive conditional-GET poller runs often and ordinarily performs no work.

--------------------------------------------------------
# Parsing Is the Whole Problem

The substantive difficulty resides in ingestion: recovering usable structure from documents that were never designed for machine interpretation.

House filings arrive as PDFs. Some are digitally generated and yield clean text with `pdftotext`. Others are scans, sometimes of a printout of a form filled in by hand, and require OCR. The parser tries text extraction first and falls back to OCR when the extracted text is empty or implausibly short. Neither path is reliable enough to trust on its own, which is why a reconciliation job exists.

Tickers constitute the second problem. A filing may name "Apple Inc" without a symbol, may use a symbol that has since changed, or may describe a holding that maps to no symbol at all. A separate job applies conservative ticker normalization to primary-source trades with null tickers every six hours. Conservatism is essential: an erroneous ticker silently contaminates every subsequent calculation and is materially worse than an acknowledged omission.

The reconciliation job runs every four hours and compares parser output with an independent feed. It exists because silent parser degradation is the most plausible failure mode in a system of this kind: filings continue to arrive, rows continue to be written, dashboards continue to render, and the numbers become quietly incorrect. Comparison with a second source provides a practical means of detecting that condition.

--------------------------------------------------------
# Net Worth From Annual Reports

Trades tell you what someone bought. They do not tell you whether the purchase was significant relative to their holdings, and a $15,000 trade means something different for different members.

Annual financial-disclosure reports provide asset ranges rather than values; the resulting reconstruction is necessarily approximate, and the output is a band rather than a single figure. The weekly job presents that result as a range in the UI, because displaying a midpoint as a definitive figure would imply a precision absent from the source documents.

--------------------------------------------------------
# Serving It Publicly

The site is public, which meant deciding what is public. Three routes handle it: an internal route with no gate, a public route behind Authentik, and a public route with no auth for the pages that are open to everyone.

The Authentik integration follows the same pattern as my other public services. A proxy provider is created through the Authentik API rather than clicked together in the UI, which keeps the configuration reproducible and in version control alongside everything else.

--------------------------------------------------------
# Security and Accuracy Notes

**Be a polite scraper.** The Senate job throttles two seconds between requests and stops as soon as it recognizes a filing. The House job uses conditional GETs and does nothing on a 304. These are public records and the servers are public infrastructure, and a homelab project has no business hammering either.

**Approximate data must retain its qualification.** Net worth derives from bracketed ranges; OCR output carries an error rate; and ticker normalization remains an inference. Each result is presented in those terms. A project of this kind fails when it produces confident but unwarranted precision, not when it visibly stops.

**Say plainly what the thing is for.** Publishing a dashboard that backtests follow-the-politician strategies invites people to read it as a strategy, and a disclaimer buried at the bottom does not undo that. Put it up front, in the application as well as the write-up, and state the specific reasons the output is not actionable rather than relying on boilerplate. The 45-day disclosure lag is the single most important one, and it is a fact about the data rather than a legal hedge.

**All scraped material is untrusted input.** Filing text, article text, and social sentiment flow into an LLM summarization step. None is trusted, and the summarization step has no tools or capacity for external action.

--------------------------------------------------------
# Wrapping Up

The principal engineering task was accepting the character of the input—scanned PDFs from two incompatible systems—and then building the reconciliation and qualification required to use the resulting output honestly.

Seventeen CronJobs may appear excessive until their respective cadences are examined: most are inexpensive and idempotent, while the more substantial jobs run at intervals appropriate to their data sources.

Questions or corrections are welcome. Start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a pull request](https://github.com/RobertDWhite/WhiteMatterTech/pulls), or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech).

Robert
