# Sources & citations — talktiles

talktiles' 120 starter tiles are **authored expressive language** (first-person
phrases a person might want to say), not sourced facts, so there is no health or
statutory number to verify. The one research-grade claim is the **colour-coding
convention** used for the tile edge-stripes. That convention, and the design
decisions that follow published AAC practice, are cited below.

## 1. Modified Fitzgerald Key — colour-coding by part of speech

**Used for:** the muted 4px edge-stripe on every tile, and the `fitz` field on each
corpus item (people | action | descriptor | noun | social | question | misc).

**Convention (verified 2026-07-22):**

| talktiles tag | part of speech      | conventional colour family |
|---------------|---------------------|----------------------------|
| people        | pronouns            | yellow  (we use ochre)     |
| action        | verbs               | green   (moss)             |
| descriptor    | adjectives          | blue    (steel-blue)       |
| noun          | nouns               | orange  (burnt-orange)     |
| social        | social / prepositions | pink  (dusty-pink)       |
| question      | question words      | purple  (violet)           |
| misc          | conjunctions / function words | white/grey (fog-grey) |

**Source:** Thistle, J. J., & Wilkinson, K. M. (2009), as summarised by
Communication Community, "The Fitzgerald Key for AAC."
<https://www.communicationcommunity.com/fitzgerald-key-for-aac/>

**Verbatim (quoted from the source):** "The Modified Fitzgerald Key, as it relates
to AAC, is a system of using color-coded display designs within an AAC system to
increase visual access and linguistic relationships (Thistle & Wilkinson, 2009)."
The source explicitly notes that "some variation" exists across systems (Goossens',
Crain, Elder) and that **consistency matters more than the exact hues** — so
talktiles keeps the hues muted and lets the caregiver retag tiles.

**Verified how:** WebSearch + WebFetch of the source page on 2026-07-22; the
green=verbs / yellow=pronouns / orange=nouns anchors were confirmed against the
source text, and the remaining categories against the widely-published Modified
Fitzgerald Key mapping.

## 2. Design conventions that follow published AAC practice

- **Stable tile positions for motor planning** — new/edited tiles are appended, never
  reflowed; ids are never renumbered. This mirrors the AAC principle that consistent
  motor patterns aid access. (General AAC practice; stated as a design choice, not a
  clinical claim.)
- **Local-only speech synthesis** — `speechSynthesis` runs on-device; speech
  *recognition* is excluded because browser recognition (e.g. Chrome's Web Speech
  API) streams audio to vendor servers. This is a privacy decision, stated on-page.

## Honesty note

talktiles is **not clinically validated** and is not a substitute for a
speech-language professional. The starter phrases are English-only and were each
read aloud once by a human and once through `speechSynthesis` on 2026-07-22 for
first-person naturalness (a QA pass, not a clinical validation). No phrase gives
medical advice or dosing; every phrase is the *user* speaking.
