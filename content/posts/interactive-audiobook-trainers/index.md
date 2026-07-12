---
title: "Building Interactive Trainers From My Audiobook Library"
date: "2026-07-11"
categories:
  - "ai"
  - "homelab"
  - "kubernetes"
  - "learning"
tags:
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

I listen to a lot of business and leadership audiobooks, and I retain almost none of them a month later. Listening is passive, the good frameworks blur together over time, and "I read that one" soon becomes "I think I read that one." I wanted the retention without having to re-listen to seven hours just to find the one idea I actually needed.

So I built a small factory that turns an audiobook into an interactive trainer, where every concept and example from the book becomes a card and the cards drive three modes: Browse, Flashcards, and Quiz. Each book gets its own self-hosted site on my internal network, and over the course of a single afternoon I ran the whole thing across seven titles.

![The library hub linking every trainer](/posts/interactive-audiobook-trainers/images/library-hub.png)

## A Note on the Books

Every title here is one I own, since these are Audible purchases from my personal library rather than pirated files. Libation de-DRMs my own purchases into a portable format so that I can keep what I paid for, and the transcripts and trainers below are personal study aids for books I own and nothing more. Nothing is redistributed, and no audio or transcript ever leaves my network. If you want to build the same thing for yourself, buy the books first.

## What I Built

The template started life as a trainer I made for Chris Voss's *Never Split the Difference*, and it is a single self-contained HTML page with three modes. Browse gives you every concept as an expandable card, grouped by the book's real chapters and searchable, with the essential ideas flagged as Core. Flashcards is a shuffled deck with a Got It or Review Again flow for the ones that have not stuck yet. Quiz drops you into applied scenarios, like a peer lobbying your shared boss to reassign your team, each with one correct answer and three plausible distractors that get explained once you have picked one.

![Browse mode for the 7 Rules of Power trainer](/posts/interactive-audiobook-trainers/images/browse-mode.png)

Every card stays grounded in the actual narration rather than in a summary I could have written without opening the book. The *Financial Intelligence* trainer, for instance, uses the real formulas as its snippets, so you get gross margin, return on assets, days sales outstanding, and free cash flow, while the *48 Laws of Power* trainer gives each law its own card with Greene's own historical example and his reversal sitting right next to it. The quiz questions all reference the book's real cases.

![Quiz mode with an applied scenario](/posts/interactive-audiobook-trainers/images/quiz-mode.png)

## The Pipeline

The whole thing runs in four stages: get the audio, transcribe it, distill it, and ship it.

### 1. Audio

Libation gives me an `.m4b` per book, and I downsample each one to 16 kHz mono MP3 with `ffmpeg`, partly because Whisper resamples to that internally anyway and partly because smaller files are easier to move around.

```bash
ffmpeg -i book.m4b -ac 1 -ar 16000 -c:a libmp3lame -b:a 32k book.mp3
```

### 2. Transcription

My first instinct was to run this on the GPU node in my Kubernetes cluster, which turned out to be wrong for reasons I will come back to. The approach that actually worked was far simpler, which was [`mlx-whisper`](https://github.com/ml-explore/mlx-examples) running `large-v3-turbo` locally on an M2 Pro. On clean, single-narrator audio it moves quickly, at roughly 29 times realtime, so a six-hour book transcribes in about thirteen minutes and the accuracy on studio narration held up well. The audio was already sitting on the laptop, so there was nothing to move in the first place.

```bash
pip install mlx-whisper
# large-v3-turbo, language=en, condition_on_previous_text=False to avoid loops
```

### 3. Distillation

Claude Code handles the distillation, and for each book I hand a subagent the full transcript, the chapter list, and a fairly strict brief, after which it hands back a structured content pack: a concepts array with names, descriptions, verbatim snippets, when-to-use notes, and a Core flag, along with a chapter map and a bank of quiz scenarios. I run one subagent per book, and they all work in parallel while transcription keeps going on the laptop.

The brief is strict about staying grounded, so the subagent has to pull the author's real examples, terms, and numbers straight from the transcript instead of paraphrasing them from memory. Across seven books that came out to 509 concept cards and 98 quiz scenarios, and when I spot-checked them against the source, the fidelity held up.

### 4. Generate and Ship

A small Python generator drops the content pack into the template and writes out the final HTML, and deploying it is just a file copy into my internal static-site host, which is a small Kubernetes service that serves a wildcard subdomain per site. A new trainer goes live the moment the file lands, with no build step and no per-site DNS to set up.

![Flashcard mode](/posts/interactive-audiobook-trainers/images/flashcard-mode.png)

## The Gotchas

The clean version of that pipeline is a retrospective, and the actual afternoon was quite a bit messier than it sounds.

The cluster GPU was the first trap. I have GPUs sitting in a node, so of course I tried to run Whisper there before anything else, but the old transcription image would not pull because it points at a registry host that no longer resolves, and fresh storage volumes refused to attach to the node on top of that. About twenty minutes in, I remembered that the audio was already on the Mac and that Apple Silicon is quick at this, so local won, and I relearned the lesson I seem to relearn every few months, which is to run the job on the machine the data already lives on.

The next surprise was memory. Six of the seven books transcribed without any trouble, but the 48 Laws of Power did not, and the reason was almost funny once I saw it. It is the unabridged edition at twenty-three hours, and `mlx-whisper` loads the whole file into a single buffer, so a twenty-three-hour file ends up asking for around 13 GB against a 9.5 GB ceiling on a 16 GB machine, at which point it simply dies with a Metal allocation error. The fix is dull once you understand the cause, and it amounts to splitting anything over about thirteen hours into shorter chunks, transcribing each one on its own, and then stitching the segments back together with their offset timestamps. That single book came to 213,000 words.

Those same 213,000 words then went on to break the distiller, since they blew straight past a single subagent's context window, so I split the transcript by chapter using the segment timestamps, ran three subagents over ranges of laws with one more handling the foundations and the quiz bank, and merged everything back together, which left all forty-eight laws intact.

Shipping should have been the easy part, and it was not, because my static-site host's management API happened to be on a broken release and the usual deploy tool did nothing at all. So I ended up writing the files straight into the running pod, which is ugly but works fine given that the volume is authoritative and backs up nightly, and the sites came up without any further complaint.

## Making It Repeatable

Doing something this fiddly seven times over is a good argument for never doing it fiddly again, so I packaged the whole pipeline as a Claude Code skill, which bundles the template, the generator, the transcriber with the chunking fix already baked in, the distillation brief, and the deploy script, together with the instructions and every one of the gotchas above written down somewhere I will actually see them next time.

The next book is now a single command, since pointing the skill at a title is enough for it to transcribe, distill, generate, and deploy on its own. V1 did seven books in an afternoon, and V1.1 should manage the eighth in about fifteen minutes.

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

I actually use them, which is the only test I care about, and a five-minute quiz before a meeting beats re-skimming a chapter every time. The whole goal was to turn a passive seven-hour listen into something I can drill in five minutes, and for books I already owned and had already heard once, that has turned out to be a much better use of the time. If you happen to have a shelf of audiobooks you have "read" and a laptop that is faster than you think, this is very much a weekend project, as long as you buy the books first.
