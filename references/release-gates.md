# Release gates

Static validation alone is not a release claim. After `build_lesson.js` and
`validate_lesson.js` succeed, manually check the HTML in a browser.

## Must pass

1. **Stage navigation** — Pre / While / Post tabs switch panels; footer next buttons work.
2. **While-reading split** — passage stays on the left (numbered paragraphs, TTS at paragraph end);
   activity pane tabs switch Gist / Details.
3. **Persistent highlight** — clicking Text Walkthrough **card titles**, Power Words, Phrases, or Structure
   items highlights the matching passage span and does **not** auto-clear.
   **Paragraph Logic** icon (left of ¶ tag) toggles a flow strip under the card title and a
   category legend above the highlighted paragraph; flow chips apply wavy underlines; legend
   chips spotlight major `dm` markers only. Toggle again to collapse.
   For multi-para sections: each flow chip underlines **only** the span for that step
   (not every paragraph’s first sentence). Signpost chips spotlight only major `dm`
   markers — not relative *who / which / in which*.
4. **Flip cards** — Key-word flash cards, Structure, and Deep Dive flip via ↻.
   Text Walkthrough: the large card stays put; each typed question row flips to its answer.
   Clicking a walkthrough card **title** still highlights the linked paragraph.
   Power Word / Phrase: each vocabulary item is its own flip card (front = word·pos·EN;
   back = trait + 中文); click also locates the word in the passage.
   In Exploring Content, **Text Structure** appears only under the **Deep Dive** tab
   (not under Text Walkthrough). Deep Dive bullet count is 2–6 and must follow the article.
5. **Gist** — MCQ gives feedback; paragraph-function matching completes and shows `doneMessage`.
6. **Comprehension Check** — True/False submit + retry; vocabulary matching completes.
7. **Post-reading** — Text-to-World side buttons toggle; all textareas accept input.
8. **Teacher tips** — tip buttons open the modal with the expected Chinese guidance.
9. **Visual contract** — sand background, ocean hero, coral/gold accents, Fraunces + Work Sans.
   If the page looks like a generic purple dashboard or a flat white quiz sheet, the wrong
   template was used — rebuild from `assets/reading-lesson.html.template`.

## Do not claim release if

- the agent hand-wrote a new HTML shell instead of running the build script
- CSS/JS was regenerated from scratch
- stage order or nested While-reading tabs differ from the template
- highlights disappear on a timer
