---
title: "Weather Dashboard: A Self-Hosted, NWS-Grade Weather Operations Console"
date: "2026-05-06"
categories:
  - "homelab"
  - "weather"
  - "kubernetes"
  - "oss"
  - "tutorials"
tags:
  - "weather"
  - "nws"
  - "noaa"
  - "spc"
  - "radar"
  - "fastapi"
  - "react"
  - "pwa"
  - "self-hosted"
  - "ghcr"
cover:
  image: "cover.png"
  alt: "Weather Dashboard screenshot"
  caption: ""
  relative: true
---

# Weather Dashboard: A Self-Hosted, NWS-Grade Weather Operations Console

**Bottom line up front.** I built and now open-sourced a self-hosted weather operations dashboard built around the US National Weather Service `api.weather.gov` and a stack of other free public sources (NOAA SPC, AviationWeather Center, NDBC, USGS, RainViewer, IEM). For fun, I also pull in APRS stations from [my SDR rig](https://whitematter.tech/posts/sdr-research-stack/). It renders active alerts with VTEC parsing and polygon overlays, NEXRAD and MRMS radar with time-machine playback, severe-weather products from SPC including ProbSevere v3 and GLM lightning, aviation METAR/TAF/AIRMET/SIGMET, marine buoys and tides, USGS earthquakes, AirNow AQI, and a 7-day NWS forecast. It speaks CAP 1.2 to other systems, fans out severe alerts to Slack/Discord/generic webhooks, and supports VAPID web push for the browser. Repository: [github.com/RobertDWhite/weather-dashboard](https://github.com/RobertDWhite/weather-dashboard). License: MIT. Multi-arch images at `ghcr.io/robertdwhite/weather-dashboard-{api,ui}`. The image I run in production is the same image GitHub Actions builds from `main`.

This post documents the architecture, the data sources, the configuration model, adn my own deployment.

**Disclaimer.** Unofficial. Not affiliated with NOAA, NWS, FAA, or any government agency. Not for life-safety decisions. Always defer to your local NWS office and EAS/IPAWS.

---

## Origin

The Dayton metro area sees enough severe weather each spring to make weather literacy a potential survival skill. I also sometimes wish I were a storm chaser. I would have four browser tabs open during every watch box: `radar.weather.gov`, `spc.noaa.gov/exper/probsvr/`, `aviationweather.gov`, and a Twitter feed of local meteorologists. Each tab was a separate mental context, none of them surfaced what mattered without a click, and most of them auto-refreshed at intervals that did not align.

The single piece of information I kept failing to surface in time was an active *Tornado Warning — Confirmed Tornado* polygon over my own ZIP code. A polygon in active warning state is a `<polygon>` on a Leaflet map. The signal was three API calls and a few hundred lines of code away, but instead I was reading line-wrapped text bulletins.

V1 was a single Leaflet map with the active NWS alert polygons painted on it and a banner across the top for any *Tornado Emergency* product within 50 miles. V2 added radar. V3 added SPC outlooks, mesoanalysis, and ProbSevere. By V0.1 (the first cut tagged for OSS release), it had grown to 40 API routers, 30+ React components, an offline-capable PWA, web push notifications, a CAP 1.2 feed for downstream consumers, and webhook fan-out for Slack and Discord.

It runs 24/7 on a kiosk monitor in my office. The OSS release is fresh; the project is alpha. Definitely expect rough edges.

## Architecture

Two services, no shared state except for a single PVC used for radar time-machine storage.

**API:** FastAPI plus httpx. Async-first, single-worker by design. Aggregates 40+ public data sources, normalizes their wire formats, caches aggressively with per-endpoint TTLs (10 seconds to 30 minutes), and serves the result on `/api/*`. Resident memory: ~250 MiB. The API is the only thing that talks to upstream providers, so the dashboard's network footprint is exactly *one* user-agent regardless of how many clients are viewing the page.

**UI:** Vite, React, TypeScript, Leaflet for mapping, MapLibre for vector tiles, custom WMS layers for radar mosaics. Static SPA served by an unprivileged nginx container. nginx reverse-proxies `/api/*` to the API. The front-end is also a PWA with an offline shell, installable on iOS/Android/desktop.

**Time-machine PVC:** A small RWO volume that stores the last N hours of NEXRAD frames per site for replay scrubbing. This is the only stateful component; lose it and you lose replay history but nothing else.

The API runs ~12 background loops, each polling its own data source on its own cadence:

| Source | Cadence | What it produces |
| ------ | ------- | ---------------- |
| NWS active alerts | 30 sec | All active warnings/watches/advisories nationwide, parsed VTEC, polygon GeoJSON |
| NEXRAD radar | 60 sec | Per-site Level III products (5 product types) cached for time-machine |
| SPC products | 5 min | Convective outlooks, mesoanalysis, mesoscale discussions |
| ProbSevere v3 | 2 min | Storm-cell tracks with severe-weather probability |
| GLM lightning | 1 min | Geostationary Lightning Mapper flashes |
| METAR/TAF | 5 min | Aviation observations and forecasts |
| NDBC buoys | 10 min | Marine observations |
| CO-OPS tides | 30 min | Tides and water levels |
| USGS earthquakes | 5 min | Recent seismic events |
| AirNow AQI | 30 min | Air quality (optional, requires free key) |
| Webhook fan-out | event-driven | Pushes severe alerts to Slack/Discord/generic |
| Web push fan-out | event-driven | VAPID push to subscribed browsers |

Caching is a first-class concern. NWS rate-limits aggressively on a per-User-Agent basis, and the 30-second alert poll combined with the 10-second client refresh means a busy weather day could mean ten thousand requests against `api.weather.gov` if every browser hit the upstream directly. The API's cache cuts that to one upstream request per polling interval, regardless of viewer count. Politeness is not optional on free public data sources.

## Data sources

All upstream data is public-domain US Government work or open-licensed. The full table:

| Source | Used for | License |
| ------ | -------- | ------- |
| api.weather.gov (NWS) | Alerts, forecasts, zones, hazards graphic, hourly | Public domain |
| spc.noaa.gov | Convective outlooks, mesoanalysis, MD, LSRs | Public domain |
| aviationweather.gov | METAR, TAF, PIREP, AIRMET, SIGMET, G-AIRMET, CWA | Public domain |
| ndbc.noaa.gov | Buoy observations | Public domain |
| tidesandcurrents.noaa.gov | Tides, water levels | Public domain |
| usgs.gov | Earthquakes, river gauges | Public domain |
| nhc.noaa.gov | Tropical cyclones | Public domain |
| nifc.gov | Wildfire perimeters | Public domain |
| droughtmonitor.unl.edu | Drought monitor | Public domain |
| rainviewer.com | Animated radar mosaic | Free tier |
| mesonet.agron.iastate.edu (IEM) | Radar tiles, LSR archive | CC-BY |
| realearth.ssec.wisc.edu | ProbSevere v3, GLM | SSEC terms |
| airnowapi.org | (Optional) AQI | Free with key |
| openweathermap.org | (Optional) extended forecast | Free tier |
| open-meteo.com | (Optional) ensemble forecast | Free tier |

Three of those are optional and require free keys (AirNow, OpenWeatherMap, Open-Meteo). The rest work with no signup. The dashboard is fully usable with zero API keys configured; the optional sources add depth rather than core functionality.

## Configuration model

A single `config.yaml` drives the application. Every key is optional. The minimum a new user needs to set is observer location for forecast lookups and map centering:

```yaml
observer:
  lat: 39.5
  lon: -84.5
  location: "Dayton, OH"
  state: "OH"

# NOAA asks for an identifying User-Agent on api.weather.gov requests.
# Failing to set this is the #1 cause of mysterious 403s.
nws_user_agent: "(my-weather-dashboard, contact@example.org)"

# Optional API keys (free signup at each provider).
api_keys:
  airnow: ""
  openweathermap: ""

# Webhook fan-out for severe weather alerts.
webhooks:
  - name: "ops-channel"
    kind: "slack"           # slack | discord | generic
    url: "https://hooks.slack.com/..."
    min_severity: "severe"  # minor | moderate | severe | extreme
    events: []              # empty = all
  - name: "tornado-only"
    kind: "discord"
    url: "https://discord.com/api/webhooks/.../..."
    events: ["tornado"]     # case-insensitive substring match

# Optional Ollama for the AI briefing endpoint.
ollama:
  url: ""
  model: "llama3.1:8b"
```

Environment variables override YAML for single-key tweaks (`WEBHOOK_URL`, `WX_CONFIG`, `NWS_USER_AGENT`).

The webhook fan-out has two filtering knobs: `min_severity` (a floor on the NWS severity scale) and `events` (a list of substring matches against the event name, case-insensitive). The two filters are AND-ed. The intent is that an ops channel gets every severe-or-worse alert, while a tornado-specific channel gets every tornado-related product regardless of severity. Both can run side by side.

## Production deployment

My deployment in summary:

- **API source**: `ghcr.io/robertdwhite/weather-dashboard-api:0.1.0`, built by GitHub Actions on every main push, multi-arch.
- **UI source**: `ghcr.io/robertdwhite/weather-dashboard-ui:0.1.0`, same.
- **Config**: a `ConfigMap` mounted at `/etc/weather-dashboard/config.yaml`. Observer set to my home location, NWS User-Agent set, AirNow key for AQI, no OpenWeatherMap (NWS hourly is enough).
- **Secrets**: a SOPS-encrypted `Secret` for webhook URLs and the AirNow key.
- **Storage**: a 5 GiB Longhorn PVC for the radar time-machine. RWO. Backed up weekly to MinIO via Velero.
- **GitOps**: ArgoCD watches the manifests in `whitehouse-rke2/weather/` and auto-syncs.

Two notable deploy quirks:

**`strategy: Recreate` on the API deployment, not RollingUpdate.** The API mounts a RWO PVC for time-machine storage. A rolling deploy would deadlock — the new pod cannot mount the volume while the old pod still holds it. Recreate kills the old pod first, frees the volume, then starts the new one. The cost is ~10 seconds of downtime per deploy. Acceptable for this use case.

**`replicas: 1` on the API.** Same reason. RWO does not support multi-attach. The API is also intentionally single-worker — the data sources are external, the work is I/O-bound, and aggressive caching means one async event loop is plenty for any plausible viewer count. Scale-out would require an RWX volume or moving time-machine state to S3; not worth it for a personal/small-team deployment.


## Closing observation

Most of the engineering effort in a project like this is in the seam between disparate data sources. NWS, SPC, AviationWeather, NDBC, USGS — each agency publishes weather data, but each has its own wire format, its own coordinate conventions, its own cadence, and its own idea of what a "polygon" is. The actual application logic — render the polygons, animate the radar, send a push notification when a tornado warning intersects the observer location — is small. Bridging the formats is most of the code.

That experience generalizes beyond weather. Anywhere you build a dashboard over public data, expect 80% of the work to be in the adapters and 20% in the application. But that's where the fun is too!

---

> Source: [github.com/RobertDWhite/weather-dashboard](https://github.com/RobertDWhite/weather-dashboard). Images: `ghcr.io/robertdwhite/weather-dashboard-api`, `ghcr.io/robertdwhite/weather-dashboard-ui` (multi-arch). License: MIT.
>
> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
