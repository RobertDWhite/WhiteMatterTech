---
title: "Always-On SDR: Building a Multi-Band Radio Intelligence Platform on Kubernetes"
date: "2026-04-20"
categories:
  - "sdr"
  - "kubernetes"
  - "ham-radio"
  - "ai"
  - "tutorials"
tags:
  - "sdr"
  - "gnuradio"
  - "kubernetes"
  - "whisper"
  - "ollama"
  - "aprs"
  - "adsb"
  - "hf"
  - "ft8"
  - "wspr"
  - "hfdl"
  - "sstv"
  - "airspy"
  - "rx888"
  - "rtlsdr"
cover:
  image: "cover.jpg"
  alt: "SDR Research Stack"
  caption: ""
  relative: true
---

> *This post was originally published at [w3rdw.radio](https://w3rdw.radio/posts/sdr-research-stack/), the ham radio blog of Robert White (W3RDW). It is cross-posted here for the WhiteMatter Tech audience.*

# Always-On SDR: Building a Multi-Band Radio Intelligence Platform on Kubernetes

I have been quietly building something i am pretty excited about. The idea started simple enough: i wanted a permanent, always-on radio monitor for 2m. It grew into something considerably larger. Today the stack covers 2m, 70cm, and the full HF spectrum from 3–28 MHz simultaneously: recording, decoding, transcribing, and tagging everything it hears, around the clock, with no manual intervention.

This post is a detailed technical walkthrough of how it works. I will cover the hardware, the recording pipeline, every decoder running against that data, the AI transcription and tagging layer, the ADS-B integration, and the web interface that ties it all together. It runs entirely on Kubernetes via ArgoCD, and the full stack is in [my GitHub repo](https://github.com/RobertDWhite/whitehouse-rke2) under `sdr-research/`.

---

## The Goal

The objective is broad, passive spectrum intelligence across three bands simultaneously:

- **2m (144–148 MHz):** amateur FM repeaters, APRS, digital voice, weak signal
- **70cm (430–440 MHz):** amateur FM/digital, satellite, ATV
- **HF (3–28 MHz):** FT8/WSPR propagation spots, HFDL aviation datalink, SSTV images, Morse

Every transmission is captured without pre-configuring specific channels. The system uses FFT energy detection to find active signals and dynamically allocates decoders to them. If something is transmitting in the band, it gets recorded. Whisper large-v3 on a GPU transcribes the voice recordings. Ollama tags everything with semantic labels. APRS positions are decoded and mapped. ADS-B aircraft positions from the local ultrafeeder are overlaid in the same interface. HF spots flow into a propagation database.

From antenna to searchable, tagged, transcribed recording, the entire data flow runs automatically with no operator input.

---

## Hardware

Three SDR receivers cover the spectrum. Each is physically attached to a different Kubernetes node via USB and accessed by containers with `privileged: true` and a host `/dev/bus/usb` mount.

### Airspy Mini: 2m Band

The [Airspy Mini](https://airspy.com/airspy-mini/) is the anchor of the 2m setup. It runs at **6 MSPS**, which gives a 6 MHz instantaneous bandwidth. Centered at **146 MHz**, it covers 143–149 MHz (the entire 2m amateur band plus the edges) in a single capture. No scanning required.

The Airspy runs directly on **rke2-node-10**, a bare-metal ARM64 machine with a GPU. It is accessed via direct USB using `osmosdr` (`airspy=0`). An earlier attempt to use SoapyRemote over the network delivered empty sample buffers; direct USB access on the bare-metal host is reliable.

Key configuration:
- Center: 146.000 MHz
- Sample rate: 6.000 MSPS
- RF gain: index 18 (out of 21)
- Fixed monitor: **144.390 MHz** (APRS primary, permanent and never released)
- Dynamic FM slots: 12
- Dynamic CW slots: 4

### RTL-SDR #2: 70cm Band

A standard [RTL-SDR Blog V4](https://www.amazon.com/dp/B0CD745394?tag=whitematter-20) dongle (serial `00000002`) on **rke2-node-13** handles 70cm. It runs at **2.4 MSPS** centered at **432 MHz**, covering the core 70cm amateur allocation. The DVB kernel driver is blacklisted on this node so the SDR driver loads cleanly.

Key configuration:
- Center: 432.000 MHz
- Sample rate: 2.400 MSPS
- PPM correction: 30 PPM
- RF gain: 40 dB
- Dynamic FM slots: 8
- Dynamic CW slots: 4

The 70cm deployment shares the same `unified_sdr.py` codebase as the 2m setup; it is parameterized via environment variables, so the same GNURadio flowgraph serves both bands.

### RX888 MkII: HF

The [RX888 MkII](https://www.amazon.com/dp/B09FB425CQ?tag=whitematter-20) (Cypress WestBridge) on **rke2-node-12** handles HF from 3–28 MHz. It connects via SoapySDDC (`driver=SDDC`) with a 2 MSPS capture rate. This receiver does not support multiple simultaneous clients, so the HF decoders time-share it using a cooperative scheduler (described in the HF section below).

---

## The Recording Pipeline: How Signals Get Captured

The core recording engine is a Python/GNURadio script (`unified_sdr.py`) running inside a container. Understanding how it works is key to understanding everything downstream.

### FFT Energy Detection

Every second, the script computes a 4096-bin FFT across the full instantaneous bandwidth. Bins that exceed the noise floor by **15 dB** are flagged as active. The script then makes a mode determination: bins wider than 5 kHz get assigned an FM channel slot; narrower bins get a CW slot.

This detection runs continuously as a background thread, independent of recording. It also writes a detections JSON file consumed by the Prometheus spectrum exporter for historical trending.

### Dynamic Slot Assignment

The system pre-wires a fixed number of `SquelchRecorder` objects at startup (12 FM + 4 CW for 2m). Each recorder is a complete GNURadio signal chain: frequency translation → channel filter → demodulator → squelch → WAV sink. They are all connected at initialization and never disconnected while running. GNURadio 3.10 has a race condition in `connect()`/`disconnect()` on live flowgraphs that causes heap corruption; the solution is to never modify the graph after `tb.start()`. Slot assignment is purely parameter changes: center frequency and squelch thresholds.

When the FFT detects a new active signal, it calls `_assign_fm_slot()` or `_assign_cw_slot()`. The slot finder looks for an idle recorder, tunes it to the peak frequency, and opens the squelch. If all slots are occupied, the weakest signal gets evicted.

### Squelch and Recording Thresholds

Each channel recorder has two squelch stages:

1. **RF squelch** (`RF_SQUELCH_DB = -30 dBFS`): a pre-filter applied at the channel input. If the signal does not exceed this threshold, the recorder never opens. This prevents band-edge noise at 143–144 MHz and 148–149 MHz from consuming slots.

2. **Audio squelch** (open: `-35 dBFS`, close: `-40 dBFS`): applied post-demodulation on the audio stream. The recorder opens when audio power exceeds the open threshold and holds for `TAIL_SEC = 1.5` seconds after dropping below the close threshold.

Recordings shorter than 0.5 seconds are discarded. The maximum recording length is 120 seconds, after which the file is closed and a new one starts.

### Band Filter for Slot Assignment

The FFT scanner applies a 2m ham band guard: **only frequencies between 144.000 and 148.000 MHz are eligible for dynamic slot assignment**. Signals detected below 144 MHz or above 148 MHz are ignored. This prevents edge-of-bandwidth noise from consuming FM and CW slots that belong to in-band signals.

The fixed 144.390 MHz APRS monitor is outside this guard (it is fixed, not dynamically assigned) and runs permanently.

### Output Files

All recordings land on a shared NFS-backed PVC (`sdr-artifacts-rwx`) mounted at `/data`:

| Directory | Contents |
|---|---|
| `/data/audio/voice/` | FM voice recordings (2m, 70cm) |
| `/data/audio/pager/` | Pager band recordings (151–158 MHz) |
| `/data/audio/cw/` | CW envelope recordings (8 kHz mono) |
| `/data/audio/sstv/` | HF SSTV audio captures |
| `/data/detections/` | FFT detection JSON files |
| `/data/text/aprs/` | Decoded APRS packets |
| `/data/text/voice/` | Whisper transcripts |
| `/data/text/pager/` | POCSAG/FLEX decoded messages |
| `/data/text/cw/` | Decoded Morse text |
| `/data/text/eas/` | EAS/SAME decoded alerts |
| `/data/text/ft8/` | FT8/WSPR spot JSON files |
| `/data/text/hfdl/` | HFDL aviation datalink frames |
| `/data/images/sstv/` | Decoded SSTV images |

File names encode the frequency and timestamp: `{frequency_hz}_{timestamp}.wav`. This naming convention is the key that all downstream decoders use to identify what frequency a recording came from.

---

## Decoders

With audio on disk, a fleet of specialized decoder pods processes each type of signal. Each runs independently and watches the shared PVC for new files.

### APRS: 144.390 MHz

The APRS decoder runs `multimon-ng` in AFSK1200 mode against any WAV file whose filename falls in the 144.370–144.410 MHz range (2m APRS primary) or 145.805–145.845 MHz (ISS APRS). It also handles the fixed-monitor recordings from 144.390 MHz.

Decoded packets are written as TNC-2 formatted text: `CALLSIGN>DEST,PATH:PAYLOAD`. Audio files are deleted after a successful decode. APRS packets are data, not voice, and the WAV serves no further purpose once decoded.

The API's APRS router then parses position reports (uncompressed `!DDMM.mmN/DDDMM.mmW` format and compressed variants), extracts speed, course, altitude, and comment fields, and stores everything in PostgreSQL. The UI shows a live station map and per-callsign track history.

W3RDW operates as an APRS-IS igate. Locally decoded packets are injected into the APRS-IS network with filter `r/39.0/-84.0/100`, contributing to the global APRS mesh.

### CW: Morse Code

The CW decoder is a pure Python implementation. The input is an 8 kHz mono WAV containing the post-demodulation magnitude envelope from one of the CW slots. The algorithm:

1. Threshold the envelope at 30% of peak power to produce a binary on/off stream
2. Sample the distribution of "on" durations to estimate the dit length
3. Apply 1:3:7 ratios (dit : dah : word space) with generous tolerance for QSB and irregular sending
4. Emit decoded characters to a text file

Minimum output threshold is 2 characters (to filter pure noise triggers). CW recordings are captured on any frequency in the ham band where the FFT detects a narrowband signal, and the decoder determines whether there is actually Morse content.

### Pager: POCSAG and FLEX

A separate [RTL-SDR Blog V4](https://www.amazon.com/dp/B0CD745394?tag=whitematter-20) (serial `00000001`) on rke2-node-13 monitors the pager band. The `unified_sdr.py` script routes recordings from 151.820–154.200 MHz and 157.450–158.700 MHz to `/data/audio/pager/` instead of the voice directory. The pager decoder runs `multimon-ng` in POCSAG512, POCSAG1200, POCSAG2400, and FLEX modes against these files, writing decoded messages to `/data/text/pager/`. Retention is 30 days.

### EAS: Emergency Alert System

The EAS decoder processes NOAA Weather Radio (162.000–163.000 MHz) recordings using `multimon-ng` in EAS mode. It is looking for SAME (Specific Area Message Encoding) headers embedded in the weather radio audio.

Non-alert audio (routine weather broadcasts without SAME tones) is marked `EAS_NO_ALERT` and skipped on subsequent cycles. When a SAME header is found, the event code is checked against a watchlist: TOR, SVR, FFW, EWW, BZW, HUW, TSW, EAN, and other severe/emergency codes trigger immediate log alerts. EAS records are retained for 365 days, the longest retention policy in the stack.

### ACARS: VHF Aircraft Data Link

ACARS frames from commercial aviation are transmitted on AM carriers in the 128–132 MHz range (129.125, 130.025, 130.425, 130.450, 131.125 MHz are the primary US channels). The unified-SDR captures these alongside voice; the NBFM demodulator partially preserves the AFSK tones used by ACARS. The `multimon-ng` ACARS decoder processes the resulting WAV files and writes decoded frames to `/data/text/acars/`.

### VDL2: VHF Data Link Mode 2

VDL2 is the digital successor to ACARS, operating at 136.900 MHz. The `dumpvdl2` decoder can pull from the rtl_tcp service on the 70cm dongle when the dongle is temporarily retuned. VDL2 data is written to `/data/text/vdl2/` in 300-second rotation windows. This decoder is currently at replicas=0 while the 70cm dongle is dedicated to amateur band monitoring.

### AIS: Maritime

AIS (Automatic Identification System) maritime vessel tracking runs on 161.975 and 162.025 MHz. The `ais-catcher` container decodes vessel position, speed, and identity from these channels. Like VDL2, AIS is currently scaled down while the SDR it would share is dedicated to 70cm.

---

## HF: The RX888 MkII Stack

The RX888 MkII covers HF from 3–28 MHz, giving access to the global amateur bands and several aviation/maritime datalink services. Because the receiver only supports one active connection at a time, the `ft8-wspr-decoder` container acts as a cooperative scheduler, cycling through four decoders using coprime cycle counters that prevent any one decoder from starving another.

| Decoder | Cycle | Dwell |
|---|---|---|
| FT8 | every cycle | 15 seconds per band |
| WSPR | every 6 FT8 cycles | 2 minutes per band |
| SSTV | every 7 FT8 cycles | 60 seconds per frequency |
| HFDL | every 11 FT8 cycles | 2 minutes |

The numbers 6, 7, and 11 are coprime; no two decoders collide on the same cycle.

### FT8 and WSPR: Propagation Spots

FT8 is the dominant digital mode on HF today. Every 15-second transmission window, stations exchange highly structured messages: callsign, grid square, and signal report. The decoder uses `jt9` (from WSJT-X) at decode depth 3, then writes one JSON file per decoded spot to `/data/text/ft8/`. Each spot includes callsign, grid square, frequency, signal report (dB), distance, and the two-letter mode (FT8 or FT8B).

WSPR (Weak Signal Propagation Reporter) uses 2-minute windows and encodes callsign, power, and grid square. The decoder captures one WSPR window per every six FT8 cycles on the frequencies 7.0386, 10.1387, 14.0956, 21.0946, and 28.1246 MHz.

FT8 frequencies covered: 3.573, 7.074, 10.136, 14.074, 18.100, 21.074, 24.915, 28.074 MHz.

The UI's Spots page shows a world map with great-circle lines between W3RDW's grid and each decoded station's grid. The band summary table shows active bands, spot counts, and signal reports. Spot data is retained for 180 days, building a long-term propagation record.

### HFDL: Aviation HF Data Link

HFDL (HF Data Link) is the HF equivalent of VDL2. Airlines and business aviation use it for position reports and ACARS-style data exchange over intercontinental routes. The `dumphfdl` decoder monitors five New York Ground Station frequencies simultaneously: 8.912, 8.927, 10.081, 11.384, and 13.303 MHz. Each decoded frame is written to `/data/text/hfdl/` as JSON containing aircraft ID, frequency, position (when included), and message content. Retention is 30 days.

### SSTV: Slow Scan Television

SSTV images are transmitted by amateur stations on well-known calling frequencies: 7.171 MHz (40m), 14.230 MHz (20m), 21.340 MHz (15m), 28.680 MHz (10m). The `slowrx` library decodes WAV captures into PNG images, which are saved to `/data/images/sstv/`. The decoder also monitors VHF SSTV frequencies derived from the voice recordings. Images appear in the web interface alongside the recording metadata.

---

## Voice Transcription: Whisper large-v3

All FM voice recordings from 2m and 70cm flow through an NVIDIA GPU-accelerated Whisper transcription pipeline.

### The Transcription Process

The voice decoder container runs `faster-whisper` with the `large-v3` model on CUDA, using `float16` compute precision. It scans `/data/audio/voice/` and `/data/audio/pager/` for new WAV files, chunks them into 30-second segments, and transcribes each segment.

Before transcription, it excludes APRS frequencies (144.37–144.41 MHz and 145.805–145.845 MHz). Those recordings go to the APRS decoder, not Whisper.

Whisper's built-in noise rejection settings are tuned to reduce hallucinations:
- `no_speech_threshold: 0.7`: high confidence required before emitting text
- `vad_filter: true`: voice activity detection pre-filters silence
- `compression_ratio_threshold: 2.0`: rejects transcripts with suspicious repetition
- `log_prob_threshold: -1.0`: low-probability outputs are discarded

After transcription, a regex filter catches common Whisper hallucinations on noise. Phrases like "Thank you for watching" are flagged and marked as no-speech rather than stored as false transcripts.

Transcripts are written to `/data/text/voice/{freq}_{timestamp}.txt` and picked up by the API indexer.

---

## AI Tagging: Ollama + dolphin-mistral

Transcription tells you *what* was said. Tagging tells you *what kind of traffic* it was.

After the indexer stores a transcript, it passes it to Ollama running `dolphin-mistral` in the `ai-stack` namespace. The prompt is built with the transcript text, any known callsigns extracted via regex, the frequency label, and associated repeater information if the frequency matches a known repeater. Ollama returns a JSON array of up to 8 tags.

Example tags from real traffic:

- `["W8EH", "W8MRC", "fm_voice", "repeater"]`: two callsigns heard on a known repeater
- `["aprs", "weather"]`: an APRS weather station packet
- `["emergency", "fire"]`: fire dispatch traffic on a public safety frequency
- `["cw", "contest"]`: Morse exchange during a contest weekend

The tagger also runs a fast regex pre-scan before calling Ollama. If the transcript matches emergency keyword patterns (fire, ambulance, police dispatch, shots fired, etc.), the `emergency` tag is added immediately without waiting for the LLM. This ensures emergency traffic is flagged even if the Ollama circuit breaker is open.

The Ollama prompt includes a hard guard: if the transcript is noise, a filler phrase, or does not contain recognizable radio content, Ollama is instructed to return empty tags rather than guessing. This prevents noise recordings from being mislabeled.

The tagging model is selected for speed over accuracy. Dolphin-mistral gives usable results in under five seconds per transcript on the available GPU. The full tag set is stored in PostgreSQL as JSONB and is searchable from the UI.

---

## ADS-B Integration: Live Aircraft Positions

The SDR research platform includes a live ADS-B feed. The ADS-B stack (ultrafeeder + Flightradar24 feeder) runs separately on rke2-node-15 with a dedicated [1090 MHz ADS-B antenna](https://www.amazon.com/dp/B07X3RL3GL?tag=whitematter-20), publishing data at [adsb.w3rdw.radio](https://adsb.w3rdw.radio).

The SDR viewer API proxies the ultrafeeder's `aircraft.json` endpoint directly from the cluster's internal network. The UI overlays current aircraft positions on the same map that shows APRS stations and FT8 spots. You can see a 2m repeater contact, the APRS position of the station you just heard, and the aircraft overflying the area at the same moment, all in one view.

---

## RepeaterBook Integration

The API syncs repeater data from RepeaterBook on a configurable schedule, pulling repeaters within 75 miles of the station's configured coordinates. When the indexer assigns a recording to a frequency, it checks the repeater database within ±6 kHz. If a match is found, the recording is linked to that repeater record.

This means recordings are searchable by repeater name, trustee, and location rather than just raw frequency. The repeater data also feeds the Ollama prompt context, so the tagger knows whether a transmission was on a linked repeater, a simplex frequency, or a public safety channel.

---

## The Web Interface

Everything flows into a React/FastAPI web application accessible at [sdr.w3rdw.radio](https://sdr.w3rdw.radio).

### Dashboard

The dashboard shows the live stream of voice recordings with transcription. Only voice recordings with non-trivial transcripts appear here. CW, APRS, emergency, and digital mode traffic is accessible under Browse. A server-sent events stream pushes new recordings to the dashboard in real time as they are indexed.

### Browse

Full access to all recordings across all modes. Filterable by mode, frequency, date range, AI tags, and free-text search across transcripts. Each recording entry shows the waveform, spectrogram, transcript, AI tags, signal strength, and the matched repeater (if any).

### APRS Map

Live and historical APRS station positions decoded locally. Click any callsign for packet history and track polylines. Filterable by time window.

### Spots Page

FT8 and WSPR spots on a world map with great-circle propagation paths. Band summary statistics, SNR distribution, and spot rate over time. The map provides an immediate visual on which bands are open and to where.

### Spectrum

FFT waterfall and per-channel signal power metrics sourced from the Prometheus spectrum exporter. Historical trending of band activity over time.

---

## Infrastructure

The entire stack runs on [RKE2 Kubernetes](https://docs.rke2.io/) with [ArgoCD](https://argo-cd.readthedocs.io/) for GitOps deployment. Every component is defined in YAML in the `sdr-research/` directory of [the repo](https://github.com/RobertDWhite/whitehouse-rke2). Changes are committed to Git; ArgoCD syncs them automatically with `prune: true` and `selfHeal: true`.

Secrets (database credentials, API keys, webhook URLs) are encrypted with [SOPS](https://github.com/getsops/sops) using an age key and decrypted at apply time via [ksops](https://github.com/viaduct-ai/kustomize-sops).

A watchdog deployment runs every 60 seconds, checks the heartbeat files written by each SDR container, and fires webhook alerts if any component goes stale. Each SDR pod writes `sdr_heartbeat_{capture_id}.json` with a current timestamp; the watchdog considers anything older than 90 seconds a failure.

Observability is via Prometheus + Grafana. The spectrum exporter exposes signal power, noise floor, and active channel count as Prometheus metrics. All pod logs ship to Loki via Promtail. Audio and text files are backed up daily via Velero to MinIO.

---

## A Note on Hardware and Lessons Learned

A few things worth knowing if you are building something similar:

**VMware USB passthrough does not work for the [Airspy Mini](https://airspy.com/airspy-mini/).** The Airspy returns error -71 (EPROTO) when accessed through a VMware hypervisor's USB passthrough. Direct bare-metal USB is required. The [RTL-SDR V4](https://www.amazon.com/dp/B0CD745394?tag=whitematter-20) dongles work fine via VMware passthrough.

**GNURadio 3.10 does not support runtime graph modification safely.** Calling `connect()` and `disconnect()` on a live flowgraph causes sporadic double-free crashes. The solution is to pre-wire everything at startup and only change parameters, never topology.

**Whisper large-v3 hallucinates on noise.** On weak or empty signals, the model confidently produces fluent sentences that have nothing to do with the audio. "Thank you for watching" is the most common output. Aggressive VAD filtering and a post-processing regex filter are necessary to keep false transcripts out of the database.

**The [RX888 MkII](https://www.amazon.com/dp/B09FB425CQ?tag=whitematter-20) is single-client only.** Unlike the Airspy (which supports SoapyRemote sharing), the RX888 via SoapySDDC allows only one active connection. Any multi-decoder HF setup requires time-sharing at the application layer.

---

## Recommended Hardware

If you want to build a similar setup, here is everything i use or have used in this stack. Amazon affiliate links below (they help keep the site running at no extra cost to you).

### SDR Receivers

The heart of the setup. You do not need all three to start. One RTL-SDR V4 is enough to begin experimenting.

- [Airspy Mini SDR Receiver (24–1700 MHz, 12-bit ADC)](https://airspy.com/airspy-mini/): The best performer for 2m. No stable Amazon listing; order direct from Airspy or your preferred ham dealer (~$99).
- [RTL-SDR Blog V4 Dongle Only](https://www.amazon.com/dp/B0CD745394?tag=whitematter-20): The current best RTL-SDR. 1 PPM TCXO, SMA connector, HF-capable via direct sampling. ~$35.
- [RTL-SDR Blog V4 Kit with Dipole Antenna](https://www.amazon.com/dp/B0CD7558GT?tag=whitematter-20): Same dongle bundled with a telescoping dipole kit for immediate use. ~$40.
- [RX888 MkII HF SDR Receiver (1 kHz–64 MHz)](https://www.amazon.com/dp/B09FB425CQ?tag=whitematter-20): Wideband HF coverage with 16-bit ADC. Required for the FT8/WSPR/HFDL stack. ~$160.

### Antennas

Antenna quality matters more than receiver quality. A mediocre SDR with a good antenna outperforms the reverse every time.

- [Diamond X50A 144/440 MHz Dual-Band Base Antenna](https://www.amazon.com/dp/B00AR0AFCG?tag=whitematter-20): What i use for 2m and 70cm. 5.6 ft fiberglass, UHF (SO-239) base connector, solid gain across both bands. ~$100.
- [Nagoya NL-770S 144/430 MHz Dual-Band Antenna](https://www.amazon.com/dp/B0936XF4BZ?tag=whitematter-20): Good smaller alternative if you cannot mount a full base antenna. ~$35.
- [MFJ-1984MP End-Fed Half-Wave HF Wire Antenna (40–10m, 300W)](https://www.amazon.com/dp/B06ZYDMCPX?tag=whitematter-20): Compact end-fed design, no tuner needed on resonant bands. Good starting point for HF receive. ~$65.

### Cables and Adapters

RTL-SDR dongles use SMA connectors. Most base antennas use PL-259 (UHF). You will need adapters.

- [SMA Extension Cable, SMA Male to SMA Female, 3 ft](https://www.amazon.com/dp/B07TCLCVRR?tag=whitematter-20): Useful for positioning the dongle away from USB noise. ~$15.
- [SMA Female to BNC Male Adapter (2-pack)](https://www.amazon.com/dp/B09P4YSHVC?tag=whitematter-20): Connects RTL-SDR to BNC-terminated antennas or test gear. ~$9.
- [SMA Female to PL-259 (UHF Male) Adapter](https://www.amazon.com/dp/B00CVQRJG4?tag=whitematter-20): Directly connects your RTL-SDR to SO-239 base antennas and coax runs. ~$8.
- [RG-8X Coax with PL-259 Connectors, 50 ft](https://www.amazon.com/dp/B004EFNHXE?tag=whitematter-20): Low-loss flexible coax for runs from antenna to shack. ~$38.

### Accessories

Items that make the setup considerably more reliable.

- [Nooelec LaNA Ultra Low-Noise Amplifier (20 MHz–4 GHz)](https://www.amazon.com/dp/B07XNLJ9X2?tag=whitematter-20): Preamp for VHF/UHF when the antenna run is long or signals are weak. Bias-tee powered. ~$35.
- [SMA Lightning Surge Protector / Arrestor (0–6 GHz)](https://www.amazon.com/dp/B07K25Y1JW?tag=whitematter-20): Inline protection between your antenna feedline and dongle. Worth it before the first thunderstorm. ~$18.
- [Anker 7-Port Powered USB 3.0 Hub](https://www.amazon.com/dp/B014ZQ07NE?tag=whitematter-20): Multiple SDR dongles on one machine require a powered hub. Bus-powered hubs cause sample drops and resets. ~$30.
- [USB-A to Micro USB Cable, 6 ft](https://www.amazon.com/dp/B07232M876?tag=whitematter-20): For RTL-SDR dongles with Micro USB ports or extension use. ~$8.

---

## Source Code

The full stack is in [my GitHub repo](https://github.com/RobertDWhite/whitehouse-rke2) under `sdr-research/`. Key files:

- `04-unified-sdr-configmap.yaml`: the complete GNURadio recording script
- `05-unified-sdr-deployment.yaml`: 2m deployment (Airspy Mini)
- `05b-unified-sdr-70cm-deployment.yaml`: 70cm deployment (RTL-SDR)
- `58-ft8-wspr-decoder-deployment.yaml`: HF FT8/WSPR/HFDL/SSTV scheduler
- `11-aprs-decoder-deployment.yaml`: APRS decoder
- `30-deployment-api.yaml`: SDR viewer API
- `32-deployment-ui.yaml`: SDR viewer UI

The web application source is not currently public. If there is interest, i am open to discussing it. Reach out via the channels below.

---

> *Originally published at [w3rdw.radio](https://w3rdw.radio/posts/sdr-research-stack/).*
>
> As always, if you have any questions or want to contribute, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes or fixes, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> 73 from Robert, W3RDW
