# Plan: preview_v2.html — Broono Homepage Wireframe v2

## Context

`preview.html` is the v5 wireframe of the Broono mobile homepage. The `homepage-master-brief.md` has since been written as a consolidated brief that supersedes the ad-hoc section decisions from v5. This plan updates the wireframe to match the brief, incorporating new sections, updated copy, and corrected voice (Rebel/guilt-adjacent copy flagged in the brief replaced with Sage-voice alternatives).

## Output file

`c:\coding-projects\horizon-330\0. instructions\wireframe\preview_v2.html`

## Source files

- `c:\coding-projects\horizon-330\0. instructions\wireframe\preview.html` (v5 — base)
- `c:\coding-projects\horizon-330\0. instructions\wireframe\homepage-master-brief.md` (master brief)

---

## Changes from v5

### Hero — Replace with Fluent (user choice)
- **Remove:** "Health isn't something you chase. It's something you build." + sub "Sixty years of science. One daily ritual."
- **Replace with:**
  - H1: "You already speak the language. This is the vocabulary you were missing."
  - Body: "You can tell when they're off before the vet can. You know their gait well enough to notice the millimetre change. You've learned, over years, to read a species that can't tell you what's wrong. Broono is for owners at that level of attention — who want their daily care to match the quality of their observation."
  - Science bridge: "Knowing your dog is one thing. Knowing what to do with what you know is another. We translated forty years of canine longevity research into a daily routine that addresses the five systems most responsible for how a dog ages."
  - CTAs unchanged: [Shop all] [Take the quiz]

### § ② — Editorial Beat — Replace off-brand line
- **Remove (Rebel framing, flagged ⚠️):** "Most supplements wait for something to go wrong. This one makes sure it doesn't."
- **Replace with:** "The dogs who thrive aren't luckier. Their owners just started earlier."

### § ③ — Outcome Strip — Update pill copy
- Update pills to match brief:
  - Run longer / Musculoskeletal
  - Absorb better / Gut microbiome
  - Look well / Skin & Coat  *(was "Itch less / Skin & coat")*
  - Think clearly / Nervous system  *(was "Stay calm / Nervous system")*
  - Stay ready / Immune system  *(was "Fight stronger / Immune system")*

### § ④ — Two-Door System — Update copy + product names
- Section intro: add Witness frame opening: "Watching closely means noticing before it becomes obvious. Stiffness after rest. A slight change in how they climb stairs. We built four supplements around the five systems that decide how a dog ages."
- Daily Foundation: copy unchanged ("Designed for the dogs who look perfectly fine.")
- Targeted Care: replace "Waiting for symptoms is not a strategy." → "The time to support your dog is before they ask for help."
- Add product names under each card:
  - Foundation: **Essential**
  - Targeted: **Move · Prebiotic · Calm**
- Quiz link: change "Take the 2-minute quiz →" to "Find my supplement →"
- Add system line above the cards: "Foundation first. Then targeted care."

### § ⑤ — Body Systems — Update card copy
- Update card copy to match brief:
  - Card 1: "Joints & Bones" alias, "Cartilage, mobility, and bone density maintained from the inside."
  - Card 2: "Gut microbiome", "Absorption, immunity, and energy metabolism start here."
  - Card 3: "Skin & Coat", "The visible layer of what's working underneath."

### § ⑦ — NEW: The Gap / Nutrition Gap (insert after Best Sellers)
- Beat 1 — Healthspan concept:
  - H2: "The vibrant years don't happen by themselves."
  - Body: "Healthspan — the years a dog spends genuinely thriving — is determined largely by daily inputs made years before anything goes wrong. Not genetics. Not luck. What goes in the bowl, every morning, before the day starts."
  - Pull quote (indented): "Healthspan is the number of years your dog spends in good health — moving freely, thinking clearly, fully present. Distinct from lifespan. And unlike lifespan, it's something you can actively shape, starting today, before there's any reason to worry."
  - Brand statement: "Broono exists here. Not the crisis. The Tuesday."
- Beat 2 — Nutrition Gap:
  - Subhead: "Most food fills. This one builds."
  - Body: "Most premium dog foods meet minimum requirements. Minimum is not optimal."
  - Small note: "[anchor statistic pending — section locked until sourced]"
  - Link: "→ Ingredient glossary"

### § ⑧ — NEW: Quality Guarantee (insert after The Gap)
- Visual: two-stage horizontal timeline: "Incoming ingredients tested" → "Finished batch tested"
- Copy:
  - "We don't trust the specification sheet. We test it."
  - "Every ingredient tested before it enters production. Every batch tested before it leaves."
  - "ISO 22000. Pharmaceutical-grade. End-to-end."
  - "Two checkpoints. Zero shortcuts."
- Link: "→ Our quality standards"

### § ⑨b — NEW: Dog Aging Project (insert between Ingredients+Italy and Who We Are)
- H2: "50,000 dogs are teaching scientists how to age well. We read every paper."
- Body: "The Dog Aging Project is the largest open-science study of ageing ever conducted on companion animals. What it's finding is changing how veterinary nutritionists think about daily care — which five systems determine how well a dog ages, which daily inputs move those systems, and how much of a dog's healthspan is within an owner's control. We built Broono around those findings."
- One finding callout (the Purina study): "Lean-fed Labradors lived a median 1.8 years longer and had significantly delayed onset of chronic disease."
- Credibility close: "No proprietary blends. No vague claims. Every ingredient listed, every dose declared, every mechanism sourced."

### § ⑫ — Email Capture — Update copy
- Add "Stay curious." as H2 label above the discount offer
- Body: "Wellness research, ingredient deep-dives, and honest advice for modern pet parents. No noise."
- Keep the 15% off wireframe variant beneath

### § ⑬ — Footer — Update nav links
- Help column: change "FAQ · Shipping · Returns · Contact" → "Our story · The science · FAQ" (per brief)

### Section numbering
- Renumber all section labels in the wireframe annotations to match the brief's 13-section map

---

## Approach

- Base the file on `preview.html` (copy the full HTML structure)
- Preserve all wireframe styling (no color, monochrome/sandstone palette, label badges)
- Keep the same 340px mobile frame, sticky nav, drawer overlay
- Insert new sections in correct sequence with matching `①–⑬` section label badges
- All new sections use the same border/padding/font-size conventions as existing sections
- No fonts, no real colors — wireframe fidelity only

---

## Verification

1. Open `preview_v2.html` in a browser
2. Confirm section count is 13 (① through ⑬) plus the ⑨b insert
3. Check Hero shows Fluent copy (not "Health isn't something you chase")
4. Check § ② shows "The dogs who thrive aren't luckier." (not Rebel line)
5. Check § ④ Targeted Care shows updated line (not "Waiting for symptoms is not a strategy")
6. Check new sections ⑦, ⑧, ⑨b are present between Best Sellers and Ingredients
7. Confirm drawer nav still works (hamburger open/close)
8. Scroll to footer and confirm nav links match brief
