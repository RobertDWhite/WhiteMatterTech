---
title: "Building Interactive Trainers From My Audiobook Library"
date: "2026-07-11"
categories:
  - "ai"
  - "homelab"
  - "kubernetes"
  - "learning"
tags:
  - "ai"
  - "whisper"
  - "mlx"
  - "apple-silicon"
  - "claude-code"
  - "kubernetes"
  - "transcription"
  - "self-hosted"
  - "audiobooks"
cover:
    image: "/posts/interactive-audiobook-trainers/images/library-hub.png"
    alt: "A dark card grid linking seven audiobook trainers"
    caption: "<text>"
    relative: true
aliases:
    - /posts/interactive-audiobook-trainers/interactive-audiobook-trainers
    - /2026/interactive-audiobook-trainers
---

# Building Interactive Trainers From My Audiobook Library

I listen to a considerable number of business and leadership audiobooks, yet retain very little of their content a month later. Listening is passive; useful frameworks blur together with time; and "I read that one" readily becomes "I think I read that one." I wanted the retention without replaying seven hours merely to recover the one idea I needed.

I therefore built a compact production process that converts an audiobook into an interactive trainer, in which each concept and example becomes a card supporting three modes: Browse, Flashcards, and Quiz. Each book receives its own self-hosted site on my internal network; during a single afternoon, I applied the process to seven titles.

![The library hub linking every trainer](/posts/interactive-audiobook-trainers/images/library-hub.png)

## A Note on the Books

Every title discussed here is an Audible purchase from my personal library, not an unlawfully obtained file. The resulting portable copies, transcripts, and trainers are personal study aids for books that I own; nothing is redistributed, and no audio or transcript leaves my network. Anyone replicating this process should begin with legitimately acquired books.

## What I Built

The template started life as a trainer I made for Chris Voss's *Never Split the Difference*, and it is a single self-contained HTML page with three modes. Browse gives you every concept as an expandable card, grouped by the book's real chapters and searchable, with the essential ideas flagged as Core. Flashcards is a shuffled deck with a Got It or Review Again flow for the ones that have not stuck yet. Quiz drops you into applied scenarios, like a peer lobbying your shared boss to reassign your team, each with one correct answer and three plausible distractors that get explained once you have picked one.

![Browse mode for the 7 Rules of Power trainer](/posts/interactive-audiobook-trainers/images/browse-mode.png)

Every card remains grounded in the narration rather than a summary that could have been produced without consulting the book. The *Financial Intelligence* trainer, for example, uses the source formulas as snippets—gross margin, return on assets, days sales outstanding, and free cash flow—while the *48 Laws of Power* trainer gives each law a distinct card containing Greene's historical example and reversal. The quiz questions likewise draw upon the books' actual cases.

![Quiz mode with an applied scenario](/posts/interactive-audiobook-trainers/images/quiz-mode.png)

## The Pipeline

The whole thing runs in four stages: get the audio, transcribe it, distill it, and ship it.

### 1. Audio

The source material is an `.m4b` file per book. I downsample each file to a 16 kHz mono MP3 with `ffmpeg`, because Whisper models operate on 16 kHz audio and because smaller files are easier to manage.

```bash
ffmpeg -i book.m4b -ac 1 -ar 16000 -c:a libmp3lame -b:a 32k book.mp3
```

### 2. Transcription

My first inclination was to run the work on a GPU node in the Kubernetes cluster, an approach that proved unsuitable for reasons described below. The more effective arrangement was [`mlx-whisper`](https://github.com/ml-explore/mlx-examples) running `large-v3-turbo` locally on an M2 Pro. On clean, single-narrator audio, my observed throughput was approximately 29 times real time: a six-hour book required about thirteen minutes, and the accuracy on studio narration proved adequate for this purpose. The audio already resided on the laptop, eliminating any transfer requirement.

```bash
pip install mlx-whisper
# large-v3-turbo, language=en, condition_on_previous_text=False to avoid loops
```

### 3. Distillation

Claude Code handles the distillation, and for each book I hand a subagent the full transcript, the chapter list, and a fairly strict brief, after which it hands back a structured content pack: a concepts array with names, descriptions, verbatim snippets, when-to-use notes, and a Core flag, along with a chapter map and a bank of quiz scenarios. I run one subagent per book, and they all work in parallel while transcription keeps going on the laptop.

The brief requires grounding in the transcript; the subagent must extract the author's examples, terminology, and numbers rather than paraphrasing from its parametric knowledge. Across seven books, the process produced 509 concept cards and 98 quiz scenarios. My source spot checks found the resulting material adequately faithful to the narration.

### 4. Generate and Ship

A small Python generator drops the content pack into the template and writes out the final HTML, and deploying it is just a file copy into my internal static-site host, which is a small Kubernetes service that serves a wildcard subdomain per site. A new trainer goes live the moment the file lands, with no build step and no per-site DNS to set up.

![Flashcard mode](/posts/interactive-audiobook-trainers/images/flashcard-mode.png)

## The Gotchas

That orderly description is retrospective; the actual afternoon was materially less orderly.

The cluster GPU was the first impediment. An older transcription image referred to a registry host that no longer resolved, and fresh storage volumes also refused attachment to the node. After approximately twenty minutes, I returned to the machine that already held the audio. Apple Silicon performed the task adequately, which reaffirmed a recurring operational principle: execute a data-intensive job where the data already resides when that arrangement satisfies the performance requirement.

The next constraint was memory. Six of the seven books transcribed without difficulty, but *The 48 Laws of Power* did not. The unabridged edition is twenty-three hours long, and `mlx-whisper` loaded the complete file into a single buffer; in my environment, that required approximately 13 GB against a 9.5 GB ceiling on a 16 GB machine, producing a Metal allocation error. The remedy was to split files longer than approximately thirteen hours into shorter chunks, transcribe each independently, and then reassemble the segments with their offset timestamps. That book alone produced 213,000 words.

Those 213,000 words also exceeded the context window available to one subagent. I divided the transcript by chapter using the segment timestamps, assigned three subagents to ranges of laws and another to the foundations and quiz bank, then merged the resulting material; all forty-eight laws remained represented.

Deployment should have been routine, yet the static-site host's management API was on a defective release and the ordinary deployment tool performed no operation. I therefore wrote the files directly to the mounted volume in the running pod, a recovery measure rather than a desirable deployment method. The volume remained authoritative and received nightly backup coverage, and the sites became available without further incident.

## Making It Repeatable

Repeating this process seven times justified its codification as a Claude Code skill. The skill bundles the template, generator, transcriber with its chunking correction, distillation brief, deployment script, operating instructions, and the practical failure cases described above.

The next book now begins with a single command: supplying a title directs the skill to transcribe, distill, generate, and deploy the trainer. The initial version handled seven books in an afternoon; the subsequent revision is intended to reduce the eighth to roughly fifteen minutes, subject to transcript length and local resource availability.

## Results

Seven trainers, with a single hub page to find them, all served on my internal network:

| Book | Concepts | Quizzes |
| --- | --- | --- |
| 7 Rules of Power | 70 | 14 |
| The Effective Executive | 67 | 14 |
| The First 90 Days | 78 | 14 |
| Selling to the C-Suite | 65 | 14 |
| Financial Intelligence | 84 | 14 |
| Dare to Lead | 85 | 14 |
| The 48 Laws of Power | 60 | 14 |

![The 48 Laws of Power trainer](/posts/interactive-audiobook-trainers/images/48-laws.png)

I use the trainers regularly, and a five-minute quiz before a meeting is more useful than re-skimming an entire chapter. The objective was to convert a passive seven-hour listen into material that can be reviewed within five minutes; for books I already owned and had heard once, that has proved a materially better use of time. A personal audiobook library and a capable laptop are sufficient for a weekend implementation, provided that the source books have been legitimately acquired.
