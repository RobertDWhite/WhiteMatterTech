---
title: "Breaking a 200-Year Brick Wall: Building a Family-History Research Hub with Claude, an OCR API, and a Big-Y Match"
date: "2026-07-29"
draft: true
categories:
  - "genealogy"
  - "ai"
  - "kubernetes"
tags:
  - "ai"
  - "genealogy"
  - "family-history"
  - "claude"
  - "llm"
  - "coding-agents"
  - "internet-archive"
  - "ohio-memory"
  - "ocr"
  - "dna"
  - "big-y"
  - "kubernetes"
  - "hugo"
cover:
  image: "cover.jpg"
  alt: "A pedigree chart of the White family rendered as colored cards, oldest at the top"
  caption: "The pedigree tab of the research hub. Card color encodes how solid each link is."
  relative: true
---

I have spent a long time stuck on one man. His name was Thomas White, he married Hannah Morris in New Jersey around 1803, and he is the father of my ancestor Jonathan White (1820–1901), who moved to Warren County, Ohio and lived out his life in Franklin Township. Thomas is where the paper trail goes cold. Nobody in two centuries of family lore or compiled genealogy has been able to say for certain who *his* father was. That gap — one unnamed father, sitting between a well-documented colonial family and my own line — is the kind of problem that eats years.

This post is about how I attacked that problem over a single long research session with Claude, and how the output became a small self-hosted website — the White Ancestry research hub — that runs on my cluster alongside everything else. I want to document the whole thing end to end: how the page is built and served, how the research was actually done, how I used a full-text OCR API to mine a 1,168-page genealogy volume and a century of Ohio newspapers, how a DNA match constrained the search, and — the part I find most interesting — how Claude parsed a stack of eighteenth-century wills into a structured, color-coded pedigree with an honest confidence rating on every single link.

I want to be upfront about one thing before I start: I did **not** finish. I did not prove who Thomas's father was. What I built instead is a rigorously-sourced *best hypothesis*, a falsifiable one, together with the exact archival records that would confirm or kill it. If you came here for a triumphant "and DNA revealed my ancestor," this is not that. It is something I find more useful: a research instrument that shows its work.

---

## What the page actually is

The White Ancestry hub is a small static site — eight hand-built HTML files, no framework, no build step. It presents seven tabs:

- **Pedigree & Sources** — the documented trunk of the family as an interactive, pan-and-zoom chart, with thirteen full source transcriptions underneath it.
- **Book Pedigree** — the same people mapped to the reference numbers used in the standard published genealogy, so anyone else working this family can cross-reference.
- **Detail Tree** — a collapsible tree with every date, marriage, and note.
- **Brick Wall** — the actual research problem, mapped: who fathered Thomas White, with every candidate and every dead end.
- **Noel Keith (DNA)** — the Big-Y match and what it does and does not tell me.
- **Western Star** — the results of a full-text sweep of the Lebanon, Ohio newspapers.
- **Research Log** — a step-by-step evidence trail of the session that produced the current conclusion.

The shell is deliberately dumb. `index.html` is a header with a row of tab buttons and a stack of `<iframe>`s; clicking a tab lazy-loads the corresponding page and swaps which frame is visible. Each content page is fully self-contained, which means any one of them can be opened, shared, or archived on its own. The pedigree and DNA charts are hand-rolled pan/zoom canvases; the newspaper tab is a filterable, sortable list of hits. There is no server-side anything.

The color system is the most important design decision on the page, and it runs through every tab. Every fact and every relationship is rendered in one of three states: **documented** (green — backed by a primary or near-primary record), **inferred** (amber — a reasoned conclusion drawn from documented facts), or **hypothesis/unknown** (red — a lead, not a finding). This is the discipline that makes the whole thing trustworthy. When you are working a genealogical brick wall, the single most dangerous move is to let a plausible guess quietly harden into an "established" fact three sessions later. Encoding confidence directly into the UI — into the border color of every card — makes that impossible to do by accident.

---

## How it's built and served

The page lives on my RKE2 cluster, served by a small in-house static-site host I run called `pages`. The pattern is simple and I have gotten a lot of mileage out of it: one Deployment serves every site on `:8080`, split by Host header, with one subdomain per site under a nested wildcard (`*.pages.internal.white.fm`). Site content lives on a Longhorn PVC at `/data/sites`, one directory per site, and it is Velero-backed like everything else.

The part that matters for this post is that `pages` is not just a web server — it is also an MCP server. It exposes `deploy_site`, `list_sites`, `get_site`, and `delete_site` as tools. That means Claude, running in my terminal, can build a site and publish it in the same session, without me ever touching a file or a `kubectl apply`. The research and the deployment were the same workflow. Claude would revise a pedigree, call `deploy_site("white-ancestry", …)`, and the updated page was live on the internal network seconds later.

There is a nice durability property that falls out of the design. The `pages` server keeps an off-cluster git mirror (`pages-sites`) in sync automatically: after every `deploy_site`, the pod commits the change to the repo, because the PVC *is* the git work-tree. If the pod ever comes up with an empty volume, it restores every site from that repo on startup. So the site is simultaneously a live service, a Longhorn volume, a Velero snapshot, and a plain git repository of static HTML. I can hand you the folder and you would have the whole thing.

None of this is exotic infrastructure. It is the same GitOps-on-RKE2 approach I use for the rest of my stack. What is new here is using an MCP tool as the *publish step of a research process*, so that "do the research" and "update the website" collapse into a single conversation.

---

## The raw material, and teaching Claude to read a will

I did not start from nothing. I started from a folder of about twenty scanned record images: the 1775/1781 will of Thomas White (the family's testator, a man with a well-established place in the tree) and its probate; the New Jersey abstract of that will; a Quaker marriage abstract from the Shrewsbury Monthly Meeting; the family birth register; a 1759 will; a 1775 guardianship record; and several pages from the standard published genealogy of this family, Stillwell's *Historical & Genealogical Miscellany*.

The first job was to turn those images into a structured, reconciled family. This is exactly the kind of task I was skeptical an LLM could do responsibly, because it is precisely where hallucination would be catastrophic — a genealogy is only as good as its worst unearned assumption. So the workflow I settled on was strict: every person, date, and relationship that went into the chart had to be traceable to one of the transcribed source images, and each one got a confidence color. Claude transcribed all twenty images, reconciled them against each other (catching, for example, that an abstract's "Rachel Irons" was a copyist's slip for Rachel *Jones*, and that two different women named Meribah White had been conflated in the family for years), and produced the documented trunk: the immigrant Thomas White of Deal, Kent (d. 1684/5), down through his son Thomas (d. 1712) to the 1775 testator and his ten children.

Underneath the chart, all thirteen sources are transcribed in full, each with its library reference — will book and page, deed liber, the works. That source sheet is the part I trust, and it is the part that would let a stranger check my work or build on it. The chart is a *view*; the transcriptions are the evidence.

I want to be precise about the division of labor here, because I think it is the whole game. Claude was excellent at the mechanical-but-hard work: reading crabbed eighteenth-century handwriting and worse OCR, holding twenty documents in mind at once, noticing that two records contradicted each other, and keeping the reference numbers straight. It was *not* trusted to decide who descended from whom. Every inferential leap was rendered in amber or red and justified in prose. The machine did the reading and the bookkeeping; the conclusions stayed visibly provisional.

---

## Mining a 1,168-page book with the Internet Archive search-inside API

The documented trunk got me to the testator's generation, but not across the gap to my Thomas. The people I needed were the ones Stillwell *didn't* fully trace — the untidy branches at the edges of the published genealogy. The problem is that the relevant volume of Stillwell runs to 1,168 leaves. Reading it cover to cover for a handful of names is not a good use of a research session.

The unlock was that the full scanned volume is on the Internet Archive (`archive.org/details/historicalgeneal05instil`, the Allen County Public Library scan), and the Archive exposes a **full-text "search-inside" API** against the OCR index of any scanned book. Instead of reading the book, I could throw phrase queries at its OCR and get back the exact leaves where a name or a distinctive phrase appears. That single capability — targeted phrase extraction against a book's OCR index — is the method behind essentially every discovery in the session. It turns a 1,168-page book into a queryable database.

What it recovered, concretely:

- A **Joel White** who had been an empty numbered slot in the published pedigree, whose early death explained how a parcel of land passed sideways to my documented line "as brother."
- The lost sons of an **Amos White** branch, including a 1768-born Amos who turns out to sit directly in the paper chain of my DNA match (more on that below), pinned down by an 1800 record dividing Amos White's real estate among named heirs.
- A **Levi White** — a son of the 1712 Thomas by a *different* branch than the well-known Amos line — whose own 1784 will, once I pulled it in full from a separate scanned volume (the *Calendar of New Jersey Wills*), reconstructed an entire household the published genealogy had missed: sons Thomas, John, and Joseph, plus a granddaughter and a co-executrix daughter-in-law.
- Critically, a **John White (b. 1745)** whose family Stillwell explicitly *never traced* — a documented man with an untracked household, which is exactly the shape of hiding place an unplaced ancestor occupies.

Each of these came back as a specific leaf number and a verbatim quote, which is what makes them checkable rather than magical. The Research Log tab records them in order — the finding, the exact source leaf, and what it changed about the tree — so the reasoning is auditable step by step.

This is the "parsing the Stillwell docs to build the pedigrees" part, and I think it is worth being clear about what Claude was and wasn't doing. It wasn't inventing lineage. It was running phrase queries against an OCR index, reading the raw hits (which are often garbled), recognizing which garbled hit was the person I cared about, transcribing the real text, and slotting each result into the tree at the right confidence level. It is research assistance at the level of "here are the four leaves you need out of eleven hundred, here is what they say, and here is why it matters" — which, for this kind of work, is most of the labor.

---

## The newspaper sweep: 171 hits out of a century of the *Western Star*

The Stillwell mining was about the New Jersey origin. The other front was Ohio, where Jonathan actually lived and died. Warren County's paper of record, the Lebanon *Western Star*, is digitized on **Ohio Memory** (the Ohio History Connection's CONTENTdm platform, collection `p16007coll84`), and like the Internet Archive it is full-text searchable against OCR.

So I ran a full-text OCR sweep of the *Western Star* across 1820–1901 for the family names, and Claude compiled the results into the Western Star tab: **171 hits**, each one a record with the person, the date, the relevance rating (high/medium/low), the OCR snippet, a note, and a deep link back to the specific Ohio Memory item. The tab is filterable by person and relevance and sortable by date, so it functions as a standing index of every appearance of the family in that paper.

The outcome was genuinely useful and genuinely mixed, which is the honest result:

- **Jonathan was confirmed.** His 1901 death and probate are right there — "Jonathan White died at his home in Franklin, Thursday, at the age of 82… he has lived in Franklin and vicinity since he was 18" — naming his widow Eleanor and his son as executor. That matches the known ancestor exactly. His granddaughter Alice is even named as being called to Franklin by his death.
- A family **burial ground** turned up: a documented interment at the Kirby graveyard, corroborating a long-standing family belief about where the Ohio Whites are buried.
- **The thing I most wanted, I did not get.** There is no death notice for Hannah (Morris) White, the mother. The OCR coverage of the 1820s–40s is thin, and the relevant names return either nothing or a single unrelated hit. That is a real negative result, and the tab says so, along with the next steps (browsing the early death columns by page image, the county genealogical society index, the cemetery transcription).

The sweep also did something subtler that I have come to think is underrated: it flagged **decoys**. There are other Thomas Whites, Elizabeth Whites, and a George Haggerty in Warren County who are *not* my family, and it is very easy to merge one of them in by accident. The tab explicitly marks "do not merge" people. A search tool that hands you 171 hits is only helpful if it also tells you which of them will poison your tree.

---

## The DNA constraint: a Big-Y match born around 1700

Running underneath all of this is a piece of evidence that doesn't come from any archive: a Y-DNA match. I have a **Big-Y (FamilyTreeDNA) match** to another White researcher — I call his tab "Noel Keith" on the site — in haplogroup **R-FTB7652**, with a most-recent-common-ancestor estimate for a man **born around 1700**. That genetic link is solid regardless of anybody's paper tree, and it is the single most powerful constraint in the whole problem, because it tells me roughly *when* our lines split even though it can't tell me *where*.

Here is the elegant part. The match's own documented ancestry only runs back to an earliest-known ancestor born in 1841; everything above that on his side is provisional paper. But his provisional chain runs up through the **Amos** branch of the 1712 Thomas White. And my strongest New Jersey candidate — via that untracked John White (b. 1745) — runs up through the **Levi** branch of the *same* 1712 Thomas White. Two brothers, Amos and Levi, splitting around 1700. A Big-Y TMRCA of "a man born ~1700" lands almost exactly on that split. The DNA doesn't prove my hypothesis, but it is precisely consistent with it, and it excludes several alternatives that would push the common ancestor a century too early.

The Noel Keith tab lays this out as a two-column chart — his line and mine drawn so they meet where the DNA says they should — plus a table that scores every competing hypothesis against the ~1700 yardstick. This is the tab where I most appreciated having the confidence-color discipline, because it would be so easy, and so wrong, to draw that shared ancestor as a solid line. He is drawn with a dashed border and a "candidate MRCA" label, because that is exactly what he is.

---

## The Brick Wall tab, and prompts that paste into Claude

The Brick Wall tab is the emotional center of the site: a single map of the actual unsolved problem, with the red band across the middle marking the missing father(s). It carries the competing theories, the ruled-out candidates (there are several tempting "brothers" who are demonstrably *not* brothers), and the outright decoys not to merge.

It also has a feature I am fond of because it closes the loop between the research artifact and the research tool. Scattered through the tab are little "copy prompt" buttons. Each one copies a ready-made, context-loaded prompt to your clipboard — "trace the 1801-will lots through the Monmouth deeds," "test the Joanna Morris baptism lead," "pull John White's estate file" — that you paste straight into Claude to start that next investigative step. The website isn't a dead report. It is a launchpad: every open question on the page is one paste away from being worked.

---

## Where it landed: a ranked hypothesis and a letter to the archives

After a day of this, the synthesis was a ranked set of hypotheses rather than an answer, and I am comfortable with that. The favored one — the site calls it Hypothesis D — is that my Thomas White was the son of that untraced John White (b. 1745), of the Levi branch. Three independent constraints happen to point at the same man: a 1801 will that documents a living "brother John White's son, Thomas White" inheriting land in the right town; a DNA split that dates to almost exactly the right decade; and the fact that John's household was precisely the kind of documented-but-untraced family that an unplaced ancestor disappears into. The competing hypotheses each survive only if some other piece of evidence is wrong, and the site says exactly which piece for each one.

And then the most practical output of the whole exercise: Claude drafted the **records request** that would actually settle it — a specific letter to the New Jersey State Archives and the Monmouth County Surrogate, naming the exact estate files, deed libers, and index searches that would confirm or break Hypothesis D. Will Book 39, page 263. Liber 26, page 329. The grantor/grantee index for two specific parcels between 1801 and 1825. That letter is the deliverable I care about most, because it converts a day of AI-assisted desk research into a concrete, cheap, human next action in a physical archive.

---

## What I actually think about doing genealogy this way

A few honest conclusions, since the point of writing this up is to be useful to someone else considering the same approach.

The LLM was genuinely transformative at three things, and all three are mechanical rather than inferential. First, **OCR phrase-mining**: turning an 1,168-page book and a century of newspapers into things I could query by name and get back exact page-level citations. Second, **transcription and reconciliation**: reading bad handwriting and worse OCR, and holding dozens of documents in view at once to notice that two of them disagree. Third, **bookkeeping**: maintaining a large web of people, reference numbers, and confidence levels without letting a guess silently promote itself to a fact. That third one sounds boring and is, I think, the real value — disciplined uncertainty tracking is exactly what human researchers get wrong when they are excited about a lead.

The thing it must *not* do is decide the answer, and the entire design of the site is built around not letting it. The color system, the dashed candidate lines, the "documented vs. inferred vs. hypothesis" tables, the explicit decoy warnings, the negative results stated as negative results — all of it exists to keep the machine's fluency from being mistaken for proof. An LLM will happily give you a confident, beautifully-written lineage that is wrong. The countermeasure is to make it show every source and grade every claim, and to treat the polished narrative as the *least* trustworthy artifact on the page, well below the transcriptions and the citations.

The reproducibility is a nice bonus of building it this way. Because the research *is* the website and the website is git-mirrored static HTML, the whole investigation is one folder you could clone. The evidence trail is in the Research Log, the sources are transcribed with their libers and pages, and the open questions come with the prompts to keep going. If I get those archive records back next month, updating the site is another `deploy_site` call — and if the records break Hypothesis D, that is a good day too, because the site already knows which line to redraw.

I still don't know who Thomas White's father was. But for the first time in a long time, I know *exactly* which record would tell me — and the letter asking for it is already written.

*The full stack that hosts this — the `pages` server and the rest of the cluster — is in [my GitHub repo](https://github.com/RobertDWhite/whitehouse-rke2). The site content is mirrored in a separate `pages-sites` repository.*


## Related Posts

- [Agentic Static-Site Hosting: Giving Claude a Place to Publish on Kubernetes](/posts/pages-mcp/) — the hosting layer the research hub is published onto.
- [Building Interactive Trainers From My Audiobook Library](/posts/interactive-audiobook-trainers/) — another agent-built site deployed through the same server.
- [Parsing Every Congressional Stock Disclosure: Seventeen CronJobs and a Lot of Bad PDFs](/posts/congress-trades/) — more OCR against documents that were never meant to be parsed.
- [The Lever and the Enter Key: A Conceptualization of Agent-Mediated Software Development as a Functional Analog of Brain Stimulation Reward](/posts/the-lever-and-the-enter-key/) — why a project like this expands the way it does.

