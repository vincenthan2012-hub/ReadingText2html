# Canonical reading worksheet schema

JSON root: `meta` + five exercise parts. Visual layout comes from the fixed HTML template.

## meta

Required:

- `titleEn` — page heading (English article title)
- `filenameStem` — ASCII letters, digits, underscores, hyphens
- `lessonTitle` — optional subtitle shown under the title (e.g. article name for badges)

Optional: `badges`, `footer`, `timeEstimate`, `directions` (global worksheet intro)

## matching

Vocabulary ↔ English definition matching from **powerWords** and **phrases**.

- `directions` — student-facing instruction
- `items`: 6–8 objects `{ word, meaning }`
  - `word`: headword or phrase label (plain text, no HTML)
  - `meaning`: English definition students match to

## fillInBlank

Cloze with shared **word bank**; answers drawn from power words / phrases.

- `directions`
- `wordBank`: array of strings (includes correct answers + distractors)
- `items`: exactly 5 objects:
  - `before` — text before the blank
  - `after` — text after the blank
  - `answer` — primary correct form
  - `accepted` — optional array of additional accepted forms (e.g. `["perfect","perfected"]`)

Students pick from `<select>` options built from `wordBank`. Word-form changes allowed via
`accepted`.

## imitation

Subjective sentence imitation from **structures** items.

- `directions`
- `items`: 3–4 objects:
  - `pattern` — short label for the structure (e.g. `Despite / Although`)
  - `example` — original sentence from the passage
  - `scenarios`: exactly 2 Chinese prompts describing new contexts for imitation

No `answer` field — template shows confirmation only after Submit.

## paragraphImitation

Subjective paragraph imitation from a Text Walkthrough card with a clear
`paragraphLogic` chain (prefer the paragraph with the richest step sequence).

- `directions`
- `sourceTag` — e.g. `¶3`
- `sourceTitle` — walkthrough card title (e.g. `Becoming a Storyteller`)
- `modelParagraph` — plain-text model paragraph from the passage (no HTML)
- `modelSegments` — optional array mapping logic steps to text spans for highlight-on-click:
  - `{ stepId, text }` — `stepId` matches `logicSteps[].id`
- `logicSteps`: 3–6 objects reused from lesson `paragraphLogic.steps`:
  - `id`, `labelEn`, `labelZh`
- `scenarios`: 2–3 objects; students **choose one** to imitate:
  - `id` — stable key (e.g. `chef`)
  - `titleZh` / `titleEn` — short scenario labels
  - `prompt` — Chinese prompt that maps onto the same logic chain in a new domain

No `answer` field — open writing; Submit only confirms submission.

## summary

Guided summary cloze from **text-structure mindmap** (`structure.nodes`, `centerLines`, etc.).

- `directions`
- `wordBank`: strings students may use (answers + 0–3 distractors)
- `segments`: array alternating plain text and blanks:
  - string → rendered as text
  - `{ blank: N }` → 0-based blank index (N matches position in `answers`)
- `answers`: array of strings, one per blank

**Length:** the completed summary prose (segments joined with answers filled in) should be
**adapted to the text length and difficulty**:
- **Simple / short text**: under 100 words (e.g. 50–100 words).
- **Long / difficult text**: 150–200 words.
- **Paragraphs**: When the summary is long, divide it into 2–3 paragraphs (by including `\n\n` in text segments) rather than presenting one dense block of text.

## Authoring rules

- Matching meanings must be English (not Chinese glosses).
- Fill-in sentences must be traceable to the passage or lesson language notes.
- Imitation scenarios must be concrete, reusable contexts in Chinese.
- Paragraph imitation must reuse a real walkthrough `paragraphLogic` chain and offer
  2–3 transferable domains (students pick one).
- Summary blanks should follow the mindmap's main branches, match passage difficulty, and split into paragraphs if lengthy.
- Keep `filenameStem` aligned with the paired reading lesson when both exist.
