# Service Content Depth Strategy

## Problem
63 service pages, but 38+ are "thin" (<4 sections or <1000 chars). Yandex marks them as low quality → excluded from index (13 pages already excluded, growing).

## Goal
Each service page should have a minimum viable depth: 5+ standard sections with substantive content per section.

## Standard Sections (optional props in ServiceArticle.astro)

| Prop | Type | Description | Rendered as |
|------|------|-------------|-------------|
| procedure | string[] | Ordered steps of the procedure | Numbered list with counters |
| care | string[] | Care and maintenance tips | Grid with checkmarks |
| stats | {value,label}[] | Key numbers (lifespan, strength, etc) | 4-column stat cards |
| materials | {name,desc,features}[] | Materials used | 3-column material cards |
| aq | {question,answer}[] | Frequently asked questions | Accordion (details/summary) |
| comparison | {name,pros,cons}[] | Compare with alternatives | 2-column pros/cons cards |

### Required pattern per page (minimum)
1. **Slot content** (custom HTML): what, when needed, contraindications
2. **+2 of the standardized sections** (prefer procedure + stats or aq)

### Full pattern (ideal for SEO)
1. Slot: what, when needed, contraindications
2. procedure — этапы
3. materials — материалы
4. stats — цифры
5. care — уход
6. aq — вопросы
7. comparison — сравнение

## File to edit
- src/components/ServiceArticle.astro — component with all section rendering + CSS
- Individual pages in src/pages/services/*.astro — pass props, keep slot for unique content

## Backward Compatibility
- All new props are optional (default [])
- Existing pages with slot-only content continue to work unchanged
- No breaking changes to the interface

## Priority Pages (38 thin pages)
Priority 1 (most visited services): cirkonievaya-koronka, metalloplastmassovaya-koronka, nejlonovyj-protez, dentaldi, implakril, immediat-protez
Priority 2 (next tier): +12 pages
Priority 3 (remaining): +20 pages

## Related Pages
- [ServiceArticle component](../project/article-component.md)
- [Yandex Indexing](yandex-indexing.md)