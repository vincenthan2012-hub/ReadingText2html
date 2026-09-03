# Canonical reading lesson schema

The JSON root contains `meta`, optional `teacherTips`, and exactly three stage objects:
`preReading`, `whileReading`, `postReading`.

Do not invent alternate stage names. Do not omit a stage. Visual layout, CSS, and interaction
behavior come from the fixed HTML template — this schema only carries lesson content.

## meta

Required:

- `titleEn` — displayed as the page heading (original English title only; no stage prefix or translation)
- `titleZh` — optional legacy field; not shown in the template
- `filenameStem` using ASCII letters, digits, underscores, and hyphens
- `lessonType`: must be `reading_and_writing`
- `objectives`: array of 3–5 Chinese (or bilingual) learning goals
- `timeEstimate`: short timing note for the three stages

Optional: `badges` (defaults to `["Reading & Writing", titleEn]`), `footer`.

## teacherTips

Optional map of tip keys to Chinese teacher-facing guidance strings.
Common keys used by the template: `leadin`, `debate`, `exit`.
Wire a tip into the page by setting `tipKey` on the matching activity.

## preReading

- `leadIn`: `{ prompt, placeholder?, tipKey? }`
- `prediction`: `{ hint?, prompt, placeholder? }`
- `keyWords`: 4–6 **Blocking Words** flip cards `{ word, meaning, example }`
  - Words that block comprehension but are not today's target vocabulary (`vocabMatch`).

## whileReading

### passageParagraphs

Array of HTML paragraph strings. Each must:

- be a single `<p id="para-N">...</p>`
- mark target vocabulary with `<span class="vocab" data-word="WORD">WORD</span>`
- mark highlight anchors with stable ids such as `pw-*`, `phrase-*`, `sent-*`

The template injects these strings into the left-hand passage pane. Do not wrap them in
extra containers.

### gist

- `hint`, `question`
- `options`: exactly 4 strings
- `correct`: 0-based index of the right option
- `paragraphFunctions`: `[{ p, label }]` for **section↔function** matching (not necessarily one paragraph per row). `p` is the section tag (e.g. `¶1`, `¶4–5`) and should align with `textWalkthrough[].tag`. `label` should align with `textWalkthrough` title + subtitle (e.g. `Origins and Purpose 起源与意义`). A section may span multiple paragraphs via the same `targets` grouping in `textWalkthrough`.
- `doneMessage`: shown when all pairs are matched

### structure

Data for the Text Structure flip card. **Choose a diagram layout that matches how the article
is organised** — do not default to a radial web for every text.

- `cardTitle`, `cardSubtitle` — flip-card heading (not hard-coded in template)
- `layout` — diagram type (required when authoring new lessons):
  - `hub` — radial concept map for **description / thematic** texts (center topic + 2–4 branches)
  - `timeline` or `sequence` — left-to-right boxes for **chronological / process** texts
  - `compare` — two sides + shared center for **comparison / contrast** texts
  - `problem-solution` — problem box → solution box(es) for **issue–response** texts
- `question`
- `centerLines`: 1–2 short strings for hub/compare center label
- `centerSub`: structure-type label (e.g. `Description structure`, `Problem–solution`)
- `nodes`: 2–6 items `{ label, sub, tone }` where `tone` is `mint` | `gold` | `coral` | `plum`
  - For `compare`: nodes[0]=left, nodes[1]=right, nodes[2]=shared (optional)
  - For `problem-solution`: nodes[0]=problem, nodes[1+]=solutions
  - For `timeline`: nodes in chronological order
- `summaryHtml`: short HTML summary under the SVG (may include `<strong>`)

### textWalkthrough

Array of **section cards** for Exploring Content → Text Walkthrough.
Each card corresponds to one **reading section** (one or more paragraphs). Section `tag` and
`title` / `subtitle` should match `gist.paragraphFunctions[].p` and `label`.
The large card does **not** flip; only individual question rows flip.

Each card:

- `title`, `subtitle`, `tag` — header (section already synced with the left carousel; title click
  no longer highlights the passage)
- `targets`: passage element ids to persistently highlight on title click
- `questions`: **2–3** items. Choose types that fit the paragraph — do **not** force every type.
- `paragraphLogic` *(required)* — discourse / development logic for the card’s paragraph(s):
  - `steps`: ordered chips shown under the card title when logic mode is open
    - `id` — string matching `data-step` on a `<span class="sent-step">` in the passage
    - `labelEn`, `labelZh`
  - `devices`: **major** cohesive / lexical-signal categories used in this paragraph’s logic
    (do **not** list every connector — only ones that carry the paragraph’s development). Each:
    - `cat`: `cause` | `contrast` | `addition` | `sequence` | `hedge`
    - `labelEn`, `labelZh` — legend chip text

**Paragraph Logic UI:** a small icon left of the ¶ tag toggles mode. Open → flow chips under the
card title + category legend above the highlighted passage; click a flow chip for a wavy
underline on that step; click a legend chip to spotlight matching `<span class="dm" data-cat="…">`
markers **and** enter manual-mark mode. With a legend color selected, select text in the
passage → floating **+** (same color) wraps it as a `dm` mark; select an existing `dm` span →
floating **−** unwraps it. Toggle the logic icon again to collapse and clear highlights.
For multi-paragraph sections, one legend applies to the whole section and every paragraph’s
`dm` markers are highlighted together.

**Passage markup** for walkthrough targets:

- Wrap each logic step span: `<span class="sent-step" data-step="1">…</span>`
- Mark key devices: `<span class="dm" data-cat="contrast">despite</span>` (may also keep `cue` /
  existing ids). Only mark devices listed in `paragraphLogic.devices`.

**Critical — `sent-step` / Section Logic accuracy (multi-paragraph):**

- Number steps **1…N continuously across the whole card**, including every paragraph in
  `targets`. **Never** restart at `data-step="1"` on each paragraph’s first sentence.
- Each `paragraphLogic.steps[].id` must appear on **exactly one** `sent-step` in the targets.
- The span for step *k* must wrap the text that **realises that chip’s label** (e.g. “Set the
  trap”), not “the first sentence of every paragraph” or an arbitrary mid-sentence fragment.
- Single-paragraph cards may still use 1…N inside that one paragraph; multi-para cards treat
  the section as one sequence (see fixture ¶4–5: steps 1–4 in para-4, 5–7 in para-5).

**Signpost (`dm`) — major cohesive devices only:**

Mark only the **most important** discourse / cohesive signals that carry the
paragraph or section’s development. Prefer a few high-value markers per card
(typically about **1–4**), not every connector. Density should match the Caribbean
fixture (e.g. *despite / still / But / First / then / From there / For example /
In this way*).

- Wrap as `<span class="dm" data-cat="…">…</span>`; `data-cat` must be one of the
  cats listed in that card’s `paragraphLogic.devices`.
- Typical cats and gold-standard examples:
  - `contrast` — but, however, despite, although, still, yet, while *(when concessive)*
  - `sequence` — first, then, next, finally, from there
  - `addition` — for example, furthermore, more recently *(not every bare “and”)*
  - `cause` — because, so, therefore, as a result
  - `hedge` — in this way *(wrap-up / softener phrases, not every “may” / “seem”)*
- Relative-clause grammar (**who / which / that / where / in which**) is **not** a
  Signpost — leave unmarked, or keep as `cue` without `dm`.
- Bare temporal **before / after / when** are usually not major signposts; mark as
  `sequence` only when they truly stage the section’s logic (never as `contrast`).

Each question:

- `type`: one of `Fact` | `Infer` | `Tone` | `Vocabulary` | `Structure` | `Reflect`
  - **Fact** — locate / recall explicit information
  - **Infer** — read between the lines
  - **Tone** — attitude, mood, or writer stance
  - **Vocabulary** — word / phrase meaning in context
  - **Structure** — how the paragraph is organised or how ideas connect
  - **Reflect** — critical thinking (agree/disagree, evaluate, personal response)
- `question`: English question prompt
- `questionZh`: optional Chinese question shown on the front when the **中** toggle is on
  (default English-only; backs remain bilingual via `answerZh` / `bulletsZh`)
- `answerEn`: answer / explanation shown on the flip face
- `answerZh`: optional Chinese answer (recommended)

Optional per question: `bulletsEn` / `bulletsZh` as `[label, explanation]` pairs for multi-point answers.

### deepDive

Synthesis card in Exploring Content → **Deep Dive** (Text Structure sits under this tab too).
**Title, thread count, and focus must match the article** — do not default to “Three Big Ideas”
or always use four threads. Choose **2–6** bullets driven by the text (e.g. “Two tensions”,
“Three stages”, “Four threads”, “Problem → response”). Title/subtitle/question should name
the actual count and framing (not a fixed demo phrase).

Required fields: `title`, `subtitle`, `question`, `bulletsEn` / `bulletsZh` (same length, 2–6 each),
`summaryEn` / `summaryZh`. Optional: `questionZh` for the front face (shown when **中** is on).

### powerWords / phrases

Arrays of **individual flip cards** (the list is no longer one big non-flipping card).

Each item:

- `target` — passage element id (clicking the card also highlights this span)
- `word` — headword or phrase (display + TTS)
- `pos` — optional part of speech / label (e.g. `n.`, `v.`, `phr.`)
- `meaningEn` — English gloss on the **front**
- `trait` — 词汇特点 on the **back** (e.g. `熟词僻义`, `academic register`, `idiomatic`, `简洁小词`)
- `meaningZh` — Chinese gloss on the **back**

**Front:** word · pos · English meaning · 🔊 pronounce · ↻ flip  
**Back:** trait badge · Chinese meaning · ↻ flip back

**Difficulty filter (required):** select language at or above the passage's CEFR / grade band.
Skip words students already control at this level (e.g. `gently`, `differ`, `throughout`,
`make comments on`). Prioritise:

- **Power Words**: rare senses, academic register, idiomatic precision, or compact words with
  flexible usage — not basic A2–B1 vocabulary.
- **Phrases**: fixed collocations, figurative expressions, or multi-word units that carry
  meaning beyond literal word lists.
- **Structures**: syntactic patterns worth imitating (contrast, relative clauses, etc.) — not
  single easy words repackaged as “structures”.

### structures

Language-structure groups for the Structure light-tab:

```json
[{ "title": "...", "subtitle": "...", "tag": "...", "items": [{ "target": "...", "text": "..." }] }]
```

### trueFalse

`[{ n, text, answer, reason }]`.

### vocabMatch

`[{ word, meaning }]` — words must appear as `data-word` spans in the passage.
Optional: `vocabMatchHint`, `vocabDoneMessage`.

## postReading

Required activities (template renders all five sections):

- `predictionCheck`: `{ prompt, placeholder? }`
- `speaking`: `{ hint?, prompts: [{ prompt, placeholder? }, ...] }` — at least 2 prompts
- `textToSelf`: `{ prompt, placeholder? }`
- `textToWorld`: `{ prompt, placeholder?, sides: [{ id, label }, ...], extensionPrompt?, extensionPlaceholder?, tipKey? }`
  - at least 2 sides
- `exitTicket`: `{ prompt, placeholder?, tipKey? }`

## Authoring rules that keep output close to the prototype

- Prefer teaching redesign over copying paper exercise layouts.
- Keep Pre-reading light; do not leak every later answer.
- Every walkthrough card needs 2–3 typed questions (`Fact` / `Infer` / `Tone` / `Vocabulary` / `Structure` / `Reflect`).
- Every walkthrough card needs `paragraphLogic` with steps + only logic-relevant devices.
- Multi-para `targets`: `data-step` ids are unique and sequential across the whole section.
- Signpost `dm`: only major cohesive devices for the paragraph/section; do not mark
  relative who/which/that/where/in which as `dm` (validate_lesson enforces that guard).
- Passage highlight ids must be stable and referenced from language / walkthrough items.
- **Text Walkthrough** includes Paragraph Logic (icon → flow chips + passage legend for major cohesive devices only).
