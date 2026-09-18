---
name: reading-courseware
description: Transform English reading materials into interactive HTML courseware (Pre/While/Post lesson) AND a matched student worksheet in one build. Use when the user wants reading课件, interactive reading lesson, worksheet, 练习册, or both lesson + worksheet together from textbook screenshots or reading passages.
metadata:
  version: "1.5.9"
---

# Reading Courseware

**One skill, one command** — generates both deliverables:

| Output | Description |
|--------|-------------|
| `<stem>_Reading_Lesson.html` | Pre / While / Post interactive courseware |
| `<stem>_Student_Worksheet.html` | Matching, fill-in, sentence imitation, paragraph imitation, summary |

Content is canonical JSON; layout is locked HTML templates. Do not freehand new shells.

## 1. Confirm the input

Require:

- English reading source (text, screenshots, OCR, or structured notes);
- an isolated output directory.

Extract structured content from screenshots first. Do not invent a missing passage.
Worksheet items must come from the lesson's while-reading language content (power words,
phrases, structures, text-structure mindmap).

## 2. Author JSON

Read [references/lesson-schema.md](references/lesson-schema.md) and
[references/worksheet-schema.md](references/worksheet-schema.md).

Prepare two payloads (or one combined `package.json`). Both must share `meta.filenameStem`.

**Lesson** — `preReading`, `whileReading`, `postReading` (see lesson schema).

**Worksheet** — `matching`, `fillInBlank`, `imitation`, `paragraphImitation`, `summary` (see worksheet schema).

Combined `package.json`:

```json
{
  "lesson": { "meta": { ... }, "preReading": { ... }, "whileReading": { ... }, "postReading": { ... } },
  "worksheet": { "meta": { ... }, "matching": { ... }, "fillInBlank": { ... }, "imitation": { ... }, "paragraphImitation": { ... }, "summary": { ... } }
}
```

Fixture example: `evals/fixtures/caribbean/content.json` + `worksheet.json`.

## 3. Build (default: both outputs)

From this skill directory:

```bash
# Two JSON files (recommended)
node scripts/build.js /path/to/content.json /path/to/worksheet.json /path/to/output

# Single package.json
node scripts/build.js /path/to/package.json /path/to/output
```

Optional single-output flags:

```bash
node scripts/build.js --lesson-only /path/to/content.json /path/to/output
node scripts/build.js --worksheet-only /path/to/worksheet.json /path/to/output
```

Outputs:

- `<stem>_Reading_Lesson.html`
- `<stem>_Student_Worksheet.html`
- `source/normalized_content.json`
- `source/normalized_worksheet.json`
- `source/package-build-record.json`

## 4. Validate

```bash
node scripts/validate.js /path/to/output
```

Then follow [references/release-gates.md](references/release-gates.md).

## Quick example

```bash
node .cursor/skills/reading-courseware/scripts/build.js \
  .cursor/skills/reading-courseware/evals/fixtures/caribbean/content.json \
  .cursor/skills/reading-courseware/evals/fixtures/caribbean/worksheet.json \
  .
```

## Boundaries

- English reading lessons only (Pre / While / Post + worksheet).
- Do not regenerate CSS/JS from scratch unless explicitly asked to change templates.
- Do not copy copyrighted textbook page images into public HTML.
- Worksheet objective answers stay hidden until Submit; sentence/paragraph imitation have no model answer.
- **Export** menu offers *Export all as HTML* and *Export current as PDF* (lesson PDF = active stage).
- **Deep Dive** title/focus must match the article — never default to “Three Big Ideas”, and
  do not hard-code four “threads”; use 2–6 content-driven bullets with a matching title.
- **Paragraph Logic / Signpost (`dm`)**: mark only the **most important** cohesive devices in
  each paragraph or section (typically 1–4 per card). Do not mark every connector, relative
  **who / which / that / where / in which**, ordinary *and*, or modality *may / seem*.
- **Section Logic (`sent-step`)**: for multi-paragraph cards, number `data-step` **1…N across the
  whole section** — never reset to `1` on each paragraph’s first sentence; each step id wraps
  only the text that matches that chip’s label.
- **Text Structure** `layout` must fit the text (hub / timeline / compare / problem-solution).
- **Power words / phrases** must be at or above passage difficulty; skip overly basic items.
- **Worksheet summary** length must match passage difficulty & length (simple/short texts: under 100 words; longer/difficult texts: 150–200 words). If long, divide into paragraphs.
- **Interactive features**: Lesson includes Web Speech TTS (voice selector, paragraph reader, Word Power / Phrase pronunciation); Worksheet supports click/drag fill and clean handwriting underlines in print.

## Anti-patterns

- Installing or invoking three separate skills — use **this skill only**.
- Hand-editing built HTML instead of editing JSON and rebuilding.
- Worksheet vocabulary not traceable to the lesson's while-reading content.
