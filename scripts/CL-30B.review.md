# CL-30B — The Canterbury Tales (Geoffrey Chaucer, c. 1400) — fact-check / review

Source: Project Gutenberg #2383, *The Canterbury Tales and Other Poems*, ed. D. Laing Purves (a lightly modernized Middle English text with marginal glosses). `sources/canterbury_tales.txt`. Public domain (Chaucer d. 1400; this edition is 19th-c. public domain).

## Verbatim quotes (grep-verified against source)
- **q-april** — "When that Aprilis, with his showers swoot, / The drought of March hath pierced to the root…" — source lines 1348–1349 (opening of the General Prologue). Two lines quoted verbatim from the Purves text; trailing ellipsis indicates the sentence continues. ✔ verbatim.
- **q-knight** — "He was a very perfect gentle knight." — source line 1422 (General Prologue, the Knight). ✔ verbatim.
- **q-pardoner** — "Radix malorum est cupiditas." — source line 16468 (the Pardoner's Latin sermon-text, repeated at 16562). English gloss on the card ("the love of money is the root of all evil") matches the editor's own footnote at line 17132. ✔ verbatim Latin.

Note on text: this edition modernizes spelling somewhat (e.g., "When that Aprilis" rather than the manuscript's "Whan that Aprille"). It is still the Middle English, lightly regularized, and is the public-domain text we are quoting from — the card attributes it to "The General Prologue," not to a modern translator.

## Plot accuracy notes
- Frame: 29 pilgrims + narrator meet at the Tabard Inn, Southwark; Host Harry Bailly proposes a tale-telling contest (two tales each way, free supper as prize); Knight draws the first lot: correct.
- General Prologue portraits (Knight, Squire, Prioress, Monk, Friar, Clerk, Wife of Bath, Parson, Miller, Summoner, Pardoner) and their characterizing details: correct.
- **Knight's Tale**: Palamon & Arcite, sworn brothers of Thebes imprisoned by Theseus; both fall for Emily; Arcite freed-but-banished, Palamon imprisoned then escapes; they fight; Theseus decrees the tournament; Palamon→Venus, Arcite→Mars; Arcite wins but is thrown by his horse (Saturn/the gods) and dies, giving Emily to Palamon; Egeus's "make a virtue of necessity" wisdom; Palamon weds Emily: correct.
- **Miller's Tale**: carpenter John, young wife Alison, student Nicholas (affair), parish clerk Absolon; the fake-flood scheme with tubs; the misdirected kiss; the red-hot coulter; Nicholas scalded cries "Water!"; John cuts rope and crashes, breaks arm, is thought mad: correct. (Reeve takes offence → tells his own tale next: correct.)
- **Wife of Bath**: prologue — five husbands, defence of marriage/experience, mastery over husbands, the fight with fifth husband Jankin over his book of wicked wives, theme of "sovereignty": correct. Tale — Arthurian knight commits rape, is set the quest (what women most desire) by the queen; the loathly lady supplies the answer ("sovereignty/maistrie") for a promise; claims marriage; the wedding-night choice (ugly+true vs fair+uncertain); he yields the choice to her; she becomes fair and faithful: correct.
- **Pardoner**: prologue — sells pardons + fake relics, openly confesses his fraud, preaches "Radix malorum est cupiditas" out of greed. Tale — three rioters in plague-time vow to kill Death; the old man directs them to the oak; the heap of gold; mutual betrayal (two plot to stab the youngest; the youngest poisons the wine); all three die: correct. Epilogue — Pardoner tries to sell to the pilgrims/Host; Host's obscene rebuke; the Knight makes peace: correct.
- "Over a hundred tales planned, ~24 completed, no winner named, pilgrims never reach Canterbury on the page": correct (the work is unfinished).

## Judgment calls
- Scope: this is a selective retelling. The script explicitly flags (in the context scene) that it follows only four of the most famous pilgrims — Knight, Miller, Wife of Bath, Pardoner — out of the full company. No claim that these are all the tales.
- The Wife's Tale opens with a rape; handled plainly and seriously, not sensationalized, and framed as the crime the knight must atone for. Appropriate for the channel's literary-education register.
- Chaucer-the-civil-servant biographical note (customs house, diplomat, read Dante/Boccaccio): standard and accurate.
- end-screen points_to CL-01B (another full retelling) per longform-only policy, NOT CL-30A. Lint A↔B cross-link warning expected/acceptable.

## Lint
- Words ~5951 (target [5250,6750]); expected ~36 min at book rate (inside [35,45]).
- Hook 25 words, minimal internal breaks.
- One stray non-ASCII glyph caught and removed from the context scene before finalizing.
