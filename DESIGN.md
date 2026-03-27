# Design System: High-End Editorial Guidelines

## 1. Overview & Creative North Star: "The Digital Atelier"
This design system is built to transcend the "template" feel of standard e-commerce. Our Creative North Star is **"The Digital Atelier"**—an experience that mirrors the quiet confidence of a high-end physical boutique. 

We achieve a premium feel through **intentional asymmetry** and **tonal depth** rather than structural lines. By utilizing large scale typography (Manrope) against a breathable, neutral canvas, we create an editorial rhythm. The layout should feel like a curated lookbook where white space is not "empty," but a functional element that gives the products room to breathe.

## 2. Color & Surface Architecture
The palette is a sophisticated suite of neutrals designed to recede, ensuring the photography remains the focal point.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning. We do not use "boxes" to contain content. 
- **Transitions:** Define boundaries solely through background color shifts. For example, a `surface-container-low` (#f3f4f1) product grid should sit directly on a `background` (#faf9f7) page with no line between them.
- **Nesting:** Treat the UI as physical layers. A `surface-container-lowest` (#ffffff) card should be placed on a `surface-container` (#edeeeb) background to create a "lifted" feel without a shadow.

### Signature Textures & Glassmorphism
To move beyond "flat" design, use the following:
- **The Glass Rule:** Floating elements (like navigation bars or quick-add modals) must use `surface` (#faf9f7) at 80% opacity with a `24px` backdrop-blur.
- **Subtle Gradients:** For main CTAs, use a linear gradient from `primary` (#5f5e5e) to `primary_dim` (#535252) at a 135-degree angle to provide a soft, satin-like finish.

## 3. Typography: Editorial Authority
We use a high-contrast scale to establish a clear hierarchy between inspiration and information.

| Level | Token | Font | Size | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope (Bold) | 3.5rem | Hero headlines, seasonal campaigns. |
| **Headline** | `headline-md` | Manrope (Medium) | 1.75rem | Category titles, "The Collection" headers. |
| **Title** | `title-lg` | Inter (Semi-Bold) | 1.375rem | Product names in detail views. |
| **Body** | `body-md` | Inter (Regular) | 0.875rem | Product descriptions, editorial copy. |
| **Label** | `label-md` | Inter (Medium) | 0.75rem | All-caps navigation, utility links. |

**Editorial Note:** Use `display-lg` with tight letter-spacing (-0.02em) for a modern, high-fashion impact. Body text should have generous line-height (1.6) to maintain the minimalist aesthetic.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often too "heavy" for a luxury brand. We use **Tonal Layering** to convey hierarchy.

- **The Layering Principle:** Stack `surface-container` tiers. 
    - Base: `surface`
    - Section: `surface-container-low`
    - Card/Interaction: `surface-container-lowest`
- **Ambient Shadows:** When a shadow is required (e.g., a floating cart), use a highly diffused blur: `0px 20px 40px rgba(47, 51, 49, 0.06)`. The color is a tinted version of `on_surface` to mimic natural light.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#afb3b0) at **15% opacity**. Never use a 100% opaque border.

## 5. Components

### Buttons
- **Primary:** Background `primary` (#5f5e5e), Text `on_primary` (#faf7f6). 0.25rem (sm) corner radius. Height: 3.5rem (`10` spacing).
- **Secondary:** Background `primary_container` (#e5e2e1), Text `on_primary_container` (#525151). 
- **Tertiary:** No background. Text `on_surface` with a `2px` underline using `surface_tint`.

### Input Fields
- **Styling:** No "box" borders. Use a `surface-container-highest` (#e0e3e0) bottom-only border.
- **States:** On focus, the bottom border transitions to `primary`. Labels should use `label-md` and always stay visible (floating).

### Cards & Product Grids
- **Constraint:** Forbid the use of divider lines. 
- **Spacing:** Use `spacing-8` (2.75rem) between product cards.
- **Interaction:** On hover, the image should subtly scale (1.02x) with a `600ms` ease-out transition.

### The "Curated" Chip
- **Styling:** Use `secondary_container` (#f0e0d3) with `on_secondary_container` text. These should be pills (`rounded-full`) used for "New Arrival" or "Limited Edition" tags.

## 6. Do’s and Don'ts

### Do:
- **Do** use asymmetric layouts. Align a headline to the left but place the sub-text 2 columns to the right to create "white space tension."
- **Do** use `spacing-20` (7rem) or `spacing-24` (8.5rem) for vertical padding between major homepage sections.
- **Do** use `on_surface_variant` (#5c605d) for secondary information to maintain a soft visual contrast.

### Don't:
- **Don't** use pure black (#000000) for text. Use `on_background` (#2f3331) for a softer, premium feel.
- **Don't** use standard "drop shadows" on images. Let the high-quality photography sit flat on the `surface` layers.
- **Don't** crowd the UI. If a section feels busy, increase the spacing by two increments on our scale.