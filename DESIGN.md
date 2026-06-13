---
version: alpha
name: ortopednn-design
description: "A warm, trustworthy medical landing page system for a dental prosthodontist in Nizhny Novgorod. Light purple-tinted canvas (#faf5ff) with a bold violet accent (#7c3aed) — designed to feel clinical yet welcoming. Content-block layouts with generous whitespace, rounded cards, and a single vibrant accent color. The system prioritizes readability and trust signals (experience, education, contact prominence) over decorative chrome. Typography is Inter at 400/600/700 weights with 1.6 line-height for body comfort. CTAs are solid violet pills with lift-on-hover. The visual mood is 'clean clinic reception' — not hospital-sterile, not trendy-dark."

colors:
  primary: "#7c3aed"
  primary-hover: "#6d28d9"
  primary-active: "#5b21b6"
  text: "#1e1b4b"
  text-muted: "#4b5563"
  text-disabled: "#9ca3af"
  canvas: "#faf5ff"
  canvas-alt: "#f5f3ff"
  border: "#e9d5ff"
  success: "#16a34a"
  warning: "#f59e0b"
  error: "#dc2626"
  white: "#ffffff"

typography:
  display-xl:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 2.25rem
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 1.875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  display-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  subhead:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.05em
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px

spacing:
  xxs: 0.125rem
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  xxl: 3rem
  section: 4rem

shadows:
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)"
  md: "0 4px 12px rgba(124, 58, 237, 0.15)"
  lg: "0 10px 25px rgba(0, 0, 0, 0.1)"
  card-hover: "0 15px 40px rgba(124, 58, 237, 0.4)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.5rem"
    border: none
    transition: "all 150ms ease"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.5rem"
    transform: "translateY(-1px)"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.5rem"
    border: "2px solid {colors.border}"
  button-secondary-hover:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    border: "2px solid {colors.primary}"
  nav-link:
    backgroundColor: transparent
    textColor: "{colors.text}"
    typography: "{typography.body}"
    padding: "0.25rem 0.75rem"
    rounded: "{rounded.md}"
  nav-link-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    padding: "0.25rem 0.75rem"
    rounded: "{rounded.full}"
  hero-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.xl}"
    padding: "2rem"
    shadow: "{shadows.lg}"
    border: "1px solid {colors.border}"
  feature-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
    shadow: "{shadows.sm}"
    border: "1px solid {colors.border}"
  feature-card-hover:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.md}"
    border: "1px solid {colors.primary}"
  service-item:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    border: "1px solid {colors.border}"
  service-item-hover:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.primary}"
  cta-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0.25rem 1rem"
  cta-section:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.display-md}"
    rounded: "{rounded.xl}"
    padding: "3rem 2rem"
  text-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    border: "1px solid {colors.border}"
  text-input-focused:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.primary}"
    shadow: "0 0 0 3px rgba(124, 58, 237, 0.1)"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    height: 64px
    border-bottom: "1px solid {colors.border}"
  footer:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body-sm}"
    padding: "2rem 1rem"
  blog-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
    shadow: "{shadows.sm}"
  blog-card-hover:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.md}"
    transform: "translateY(-2px)"
  faq-item:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1rem 1.5rem"
    border: "1px solid {colors.border}"
  location-card:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
    border: "1px solid {colors.border}"
---

## Overview

Ortopednn.ru is the marketing site for Marina Georgievna Nikitina, a dental prosthodontist in Nizhny Novgorod with 30+ years of experience. The design system is built around **medical trust** — purple-toned (#7c3aed primary, #faf5ff canvas) to feel clinical but not cold, with generous rounded corners and soft shadows to keep the atmosphere welcoming.

The page model is **content-block based**: sections stack vertically, each with a clear heading, supporting body text, and a card grid or list. The hero is centered with a badge, headline, subheadline, and two CTAs. There are no sidebars, no complex multi-column layouts, no carousels.

**Key Characteristics:**
- **Single accent color** — purple (#7c3aed) for all interactive elements. No secondary brand color.
- **Light violet-tinted canvas** (#faf5ff) with white card surfaces — the palette reads as clean and slightly warm.
- **Cards are rounded rectangles** with `{rounded.lg}` (12px) corners, white fill, and subtle shadows.
- **Full-pill badges** (`{rounded.full}`) for category labels and CTAs-in-badges.
- **Inter** typeface across all surfaces — 400 for body, 600 for strong, 700 for headings, 800 for hero display.
- **No dark mode** — intentionally disabled because the purple-tinted scheme does not invert cleanly.
- **Trust signals** (experience years, education, contact info) are elevated over decorative elements.
- **Content-grid rhythm**: section → heading → body → 3-column card grid (responsive to 1-column).

## Colors

> Source pages: ortopednn.ru (/, /about/, /services/, /blog/, /materials/, /compare/)

### Brand & Accent
- **Violet** (`{colors.primary}` #7c3aed): The single interactive color. All CTAs, link text, icon accents, badges, focus rings. Purple was chosen for its association with medical professionalism without being "surgical blue."
- **Violet Hover** (`{colors.primary-hover}` #6d28d9): Darkened variant — primary button on hover, active link.
- **Violet Active** (`{colors.primary-active}` #5b21b6): Pressed state for buttons.

### Surface
- **Lavender Canvas** (`{colors.canvas}` #faf5ff): Page background. A very light purple tint — the defining atmospheric color of the site.
- **Alt Canvas** (`{colors.canvas-alt}` #f5f3ff): Slightly deeper lavender tint — used to alternate section backgrounds and for the footer.
- **White** (`{colors.white}` #ffffff): Card backgrounds, input backgrounds, secondary buttons.

### Text
- **Deep Indigo** (`{colors.text}` #1e1b4b): All headings, body text, nav links. High-contrast dark tint that reads almost as black but carries a subtle purple undertone.
- **Slate Muted** (`{colors.text-muted}` #4b5563): Secondary body text, metadata, card descriptions.
- **Gray Disabled** (`{colors.text-disabled}` #9ca3af): Disabled states, placeholders.

### Semantic
- **Green** (`{colors.success}` #16a34a): Success indicators, positive results.
- **Amber** (`{colors.warning}` #f59e0b): Warnings, notices.
- **Red** (`{colors.error}` #dc2626): Errors, alerts.

### Hairlines & Borders
- **Lavender Border** (`{colors.border}` #e9d5ff): 1px borders on cards, inputs, dividers, and structural separators. Matches the lavender atmosphere.

### Brand Gradient
A linear gradient `linear-gradient(135deg, var(--color-bg), var(--color-bg-alt), #ede9fe)` is used as the hero section background — a soft fade from lavender canvas through alt canvas to an even lighter purple. This is the only gradient in the system and is specific to the hero section.

## Typography

### Font Family
- **Inter** (`Inter, system-ui, -apple-system, sans-serif`) is the sole typeface across all surfaces — display, body, and UI. Loaded from Google Fonts with weights 400, 500, 600, 700, 800.
- Inter was chosen for its excellent Cyrillic support (critical for a Russian-language medical site), readability at body sizes, and clean geometric forms.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 36px / 2.25rem | 800 | 1.15 | -0.02em | Hero H1 — the largest text on the page |
| `{typography.display-lg}` | 30px / 1.875rem | 700 | 1.2 | -0.01em | Section H2 headings |
| `{typography.display-md}` | 24px / 1.5rem | 700 | 1.25 | -0.01em | Card titles, sub-section H3 |
| `{typography.headline}` | 20px / 1.25rem | 700 | 1.3 | 0 | Service names, blog post titles |
| `{typography.subhead}` | 18px / 1.125rem | 600 | 1.4 | 0 | Intro paragraphs, lead copy |
| `{typography.body-lg}` | 16px / 1rem | 400 | 1.6 | 0 | Default body text |
| `{typography.body}` | 14px / 0.875rem | 400 | 1.6 | 0 | Card body, nav links, small text |
| `{typography.body-sm}` | 12px / 0.75rem | 400 | 1.5 | 0 | Captions, footer |
| `{typography.button}` | 14px / 0.875rem | 600 | 1.2 | 0 | All button labels |
| `{typography.caption}` | 12px / 0.75rem | 500 | 1.4 | 0 | Badge text, stat labels |
| `{typography.eyebrow}` | 12px / 0.75rem | 600 | 1.3 | 0.05em | Section label / category badge |
| `{typography.mono}` | 14px / 0.875rem | 400 | 1.5 | 0 | Code snippets, technical content |

### Principles
- **Body comfort at 1.6 line-height.** Body text runs at a relaxed 1.6 leading — wider than the typical 1.4–1.5 SaaS standard — to improve readability of Russian medical content on all screen sizes.
- **Headings at weight 700 (hero at 800).** The system uses weight 700 for most headings; weight 800 is reserved for the hero H1. Weight 500 is used for form labels and weight 600 for strong inline emphasis.
- **Negative tracking only on hero display.** `-0.02em` on `{typography.display-xl}` only; all other sizes use 0 or `-0.01em` letter-spacing.
- **Positive tracking on eyebrow.** `{typography.eyebrow}` uses +0.05em tracking for the section category label — the only element with positive letter-spacing.
- **All caps text uses `letter-spacing: 0.05em` and weight 600** for readability.

### Note on Font Substitutes
Inter is available from Google Fonts. No substitute is needed. For offline/self-hosted scenarios, system-ui is the best proxy.

## Layout

### Spacing System
- **Base unit**: 8px (0.5rem). All layout spacing snaps to multiples of 8px.
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- Section vertical padding: `{spacing.section}` (64px) on desktop, reduced to 48px on mobile.
- Card interior padding: `{spacing.lg}` (24px) on feature cards and blog cards; `{spacing.xl}` (32px) on the hero card.
- Button padding: 8px vertical · 24px horizontal.
- Form input padding: 8px vertical · 16px horizontal.

### Grid & Container
- **Max content width**: 1000px (`.container`). Centered with auto margins.
- **Card grids**: 3-column at desktop (min 280px card width), 2-column at tablet, 1-column below 768px. Implemented with CSS Grid `repeat(auto-fit, minmax(280px, 1fr))` and a 20px gap.
- **Hero content**: centered, max-width 600px. Single column with vertically stacked elements.
- **Service lists**: single-column list items, full-width.

### Whitespace Philosophy
Whitespace is the trust signal. Sections are separated by generous vertical padding (64px). Cards are spaced 24px apart. The hero has 70vh minimum height. The philosophy is "breathing room for medical content" — users should never feel rushed or crowded while reading about procedures and treatments.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, no border | Page sections, hero content, page backgrounds |
| 1 (card) | `{shadows.sm}` + 1px border | Feature cards, blog cards, service items, FAQ items |
| 2 (hovered card) | `{shadows.md}` + subtle transform | Card on hover — lifts +2px translateY |
| 3 (hero card) | `{shadows.lg}` + 1px border | Hero decorative card, CTA sections |
| 4 (focus ring) | `box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1)` | Focused input fields |
| 5 (CTA shadow) | `{shadows.card-hover}` | Primary button glow on hover — creates the main visual feedback |

### Decorative Depth
- **Subtle gradient** in the hero background (`linear-gradient(135deg, canvas → canvas-alt → #ede9fe)`) — this is the only decorative gradient and is specific to the hero section.
- **Decorative circles** (`.hero__circle`) — large blurred circles at 10% opacity in the hero background, positioned off-center. Purple gradient (#8b5cf6 → #a78bfa). These are the only decorative shapes.
- **No drop shadows on text.** Elevation is expressed through card shadows and surface color, never through text shadows.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 6px | Small chips, inline tags (rare) |
| `{rounded.md}` | 8px | Buttons, form inputs, service items |
| `{rounded.lg}` | 12px | Feature cards, blog cards, FAQ items, location cards |
| `{rounded.xl}` | 16px | Hero card, CTA section container |
| `{rounded.full}` | 9999px | Badges, pill labels, active nav link |

### Photography & Illustration Geometry
- **Doctor photos** (in about page and social links) use `{rounded.full}` — circular avatars.
- **Service-related images** on individual service pages use `{rounded.lg}` (12px).
- **No rounded imagery in the hero** — hero is purely typographic.
- All images are `max-width: 100%` with `height: auto`.

## Components

### Buttons

**`button-primary`** — Solid violet CTA. The default action across all pages.
- Background `{colors.primary}`, text `{colors.white}`, type `{typography.button}`, padding 8px 24px, rounded `{rounded.md}`.
- Hover: `{component.button-primary-hover}` — background darkens to `{colors.primary-hover}`, lifts 1px (`translateY(-1px)`), shadow intensifies to 15px/40px rgba(124, 58, 237, 0.4).
- Active: background `{colors.primary-active}`, transform reset to `translateY(0)`.

**`button-secondary`** — White button with violet border. Used for secondary CTAs ("All services", secondary hero action).
- Background `{colors.white}`, text `{colors.primary}`, type `{typography.button}`, padding 8px 24px, rounded `{rounded.md}`, 2px solid `{colors.border}`.

### Navigation

**`top-nav`** — Fixed sticky nav bar at the top of the page. Background `{colors.canvas}`, height 64px, bottom border 1px `{colors.border}`. Logo left, nav links center, phone CTA right. Links rendered in `{typography.body}` (14px).
- On mobile (below 768px): links collapse to hamburger menu.

**`nav-link`** — Standard nav link. Transparent background, `{colors.text}` text, padding 4px 12px.

**`nav-link-active`** — Active/current page indicator. Background `{colors.primary}`, text `{colors.white}`, rounded `{rounded.full}` (pill). Used to highlight the current section.

### Cards & Containers

**`hero-card`** — Border card in the hero section (decorative). White background, 1px `{colors.border}`, rounded `{rounded.xl}`, shadow `{shadows.lg}`, padding 32px. Contains doctor stats and credentials.

**`feature-card`** — Generic feature/benefit highlight tile used on the "About" section.
- Default: background `{colors.white}`, border 1px `{colors.border}`, rounded `{rounded.lg}`, shadow `{shadows.sm}`, padding 24px.
- Hovered: `{component.feature-card-hover}` — shadow upgrades to `{shadows.md}`, border brightens to `{colors.primary}`, card lifts 4px (`translateY(-4px)`).

**`service-item`** — Row in the services list. White background, 1px `{colors.border}`, rounded `{rounded.md}`, padding 12px 16px.
- Hovered: background shifts to `{colors.canvas}`, border shifts to `{colors.primary}`.

**`blog-card`** — Blog post preview card. White background, 1px `{colors.border}`, rounded `{rounded.lg}`, shadow `{shadows.sm}`, padding 24px. Contains title, date, excerpt.

**`faq-item`** — FAQ question block. White background, 1px `{colors.border}`, rounded `{rounded.lg}`, padding 16px 24px.

**`location-card`** — Address and contact card. Background `{colors.canvas-alt}`, border 1px `{colors.border}`, rounded `{rounded.lg}`, padding 24px.

**`cta-badge`** — Inline pill badge like "Врач-ортопед, стаж 30+ лет". Background `{colors.primary}`, text `{colors.white}`, type `{typography.caption}`, rounded `{rounded.full}`, padding 4px 16px.

**`cta-section`** — Full-width CTA banner. Violet background (`{colors.primary}`), white text, rounded `{rounded.xl}`, padding 48px 32px. Centered content: heading, subheading, and a white `button-secondary` (inverted: white bg, violet text).

### Inputs & Forms

**`text-input`** — Standard form input. Background `{colors.white}`, text `{colors.text}`, type `{typography.body-lg}` (16px), rounded `{rounded.md}`, padding 8px 16px, 1px solid `{colors.border}`.
- Focused: `{component.text-input-focused}` — border shifts to `{colors.primary}`, box-shadow adds 3px violet ring at 10% opacity.

### Footer

**`footer`** — Standard site footer. Background `{colors.canvas-alt}`, text `{colors.text-muted}`, type `{typography.body-sm}` (12px). Centered link columns with doctor name, copyright, and social links.

## Do's and Don'ts

### Do
- Use `{colors.primary}` (violet #7c3aed) for all interactive elements — buttons, links, badges, focus rings.
- Keep cards white on the purple-tinted canvas — the contrast defines the card hierarchy.
- Set body text at `{typography.body-lg}` (16px) or `{typography.body}` (14px) with 1.6 line-height.
- Use `{rounded.full}` (pill) ONLY for badges and active nav links — not for buttons.
- Add `translateY(-1px)` and shadow lift to interactive elements on hover.
- Use `{shadows.card-hover}` (violet-tinted shadow) on primary button hover — it's the main visual feedback.
- Stack sections vertically with clear H2 headings.
- Keep the hero centered with max-width 600px.

### Don't
- Don't introduce a second accent color — violet is the single interactive signal.
- Don't use dark mode — the light purple canvas is part of the brand; dark inversion breaks readability.
- Don't add drop shadows to text.
- Don't use pill-shaped buttons — buttons use `{rounded.md}` (8px). Pill shape is reserved for badges.
- Don't use carousels or horizontal scroll sections.
- Don't use pure black (`#000000`) anywhere — all dark text uses `{colors.text}` (#1e1b4b) or `{colors.text-muted}` (#4b5563).
- Don't add decorative gradients outside the hero section.
- Don't use `{rounded.xl}` (16px) — `{rounded.lg}` (12px) is the standard card radius.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1024px | Full 3-column card grids, expanded nav |
| Tablet | 768–1023px | 2-column card grids, nav wraps |
| Mobile | < 768px | Single-column everything, hamburger nav, stacked hero |
| Small mobile | < 480px | Tighter padding, smaller hero type |

### Touch Targets
- All interactive elements maintain ≥ 44px tap height on mobile.
- Buttons go `width: 100%` on mobile for easy tapping.
- Form inputs maintain ≥ 44px height.

### Collapsing Strategy
- **Top nav**: full inline links → hamburger below 768px. Logo stays left, phone CTA stays right.
- **Card grids**: 3-col → 2-col (768px) → 1-col (480px).
- **Hero**: 70vh → auto height on mobile. Title shrinks from `{typography.display-xl}` (36px) to `{typography.display-lg}` (30px).
- **CTA section**: padding tightens from 48px to 24px on mobile.

### Image Behavior
- All images responsive via `max-width: 100%; height: auto`.
- Doctor photos maintain circular crop (`{rounded.full}`) across all viewports.

## Iteration Guide

1. Add new components as separate `components:` entries with full token references.
2. When designing a new section, start with the H2 heading + body text pattern, then add a card grid below.
3. Cards always go on `{colors.white}` background with `{rounded.lg}` radius.
4. Run body copy at 16px / 1.6 line-height — this is the comfort zone for medical content.
5. Use the single violet accent sparingly: one primary action per section.
6. If a component needs elevation, use the shadow tokens — never add a new shadow.
7. Every new page should fit the content-block pattern: heading → body → cards/list.

## Known Gaps

- Dark mode is intentionally absent; the system does not ship a dark theme.
- Form validation and error styling follow standard patterns but are not extensively used on the marketing site (the contact form is the only form).
- The hero's decorative circles are CSS-only (gradient circles at 10% opacity) — no image assets needed.
- Some individual service pages use inline prices or badges; prices are deprecated per business requirement.
- The Inter font variable weights (400–800) are loaded from Google Fonts; self-hosted alternatives should provide the same weight range.
