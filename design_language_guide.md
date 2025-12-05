# Design Language Guide: "The Technical Manual"

## 1. Design Philosophy
**"Engineering as Art"**
This design language celebrates the raw, structural beauty of software and hardware engineering. It draws inspiration from technical manuals, blueprints, and early computing aesthetics. It is precise, informative, and unashamedly technical.

*   **Keywords**: Blueprint, Structural, Retro-Technical, Precision, Schematic.
*   **Core Principle**: Form follows function, but form is rendered with exquisite technical detail.

---

## 2. Color Palette
The palette is strictly limited to high-contrast "Blueprint" colors.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Canvas White** | `#FFFFFF` | Main background. |
| **Blueprint Blue** | `#4D6BFE` | Primary accent, headings, diagrams, lines. |
| **Ink Black** | `#111111` | Body text (Serif). |
| **Grid Gray** | `#F0F0F0` | Background grids, subtle dividers. |

> [!NOTE]
> Avoid other colors. Use patterns (hatching) for semantic states if needed.

---

## 3. Typography

### A. Headings (The "Digital" Voice)
*   **Style**: Pixelated, 8-bit, Blocky.
*   **Font**: `Press Start 2P`, `VT323`.
*   **Color**: **Blueprint Blue**.
*   **Transform**: `UPPERCASE`.

### B. Body Text (The "Manual" Voice)
*   **Style**: Classic Serif. Academic feel.
*   **Font**: `Times New Roman`, `Georgia`, `EB Garamond`.
*   **Color**: **Ink Black**.
*   **Line Height**: `1.6`.

### C. Subtitle / Tagline
*   **Style**: **Italic Serif**.
*   **Font**: Same as body, but `font-style: italic`.
*   **Color**: **Ink Black**.
*   **Usage**: Descriptive text beneath the main title (e.g., "A reference manual for...").

### D. Labels & Technical Data (The "Machine" Voice)
*   **Style**: Monospace / OCR.
*   **Font**: `Courier New`, `Roboto Mono`, `Space Mono`.
*   **Color**: **Blueprint Blue**.
*   **Transform**: `UPPERCASE`, use `SNAKE_CASE` for multi-word labels (e.g., `HD_NOTCH`, `WRITE_PROTECT_TAB`).

### E. Drop Caps
*   **Usage**: The **first letter** of the opening paragraph is enlarged.
*   **Style**: Span 2-3 lines, same Serif font as body text.
*   **Example CSS**:
    ```css
    p:first-of-type::first-letter {
      font-size: 3.5em;
      float: left;
      line-height: 1;
      margin-right: 0.1em;
    }
    ```

---

## 4. Graphic & Imagery Style

### Line Art
*   Use thin, **consistent stroke weights** (1-2px). No variable widths.
*   All strokes in **Blueprint Blue**.

### Isometric & Exploded Views
*   Prefer **isometric projections** (no perspective distortion).
*   Use **"exploded" diagrams** to show internal components.

### Fill Patterns
| Pattern | Usage |
| :--- | :--- |
| **Checkerboard** | Active areas, grids, electrodes. (Blue & White squares) |
| **Gradient Fill** | 3D surfaces, depth visualization (e.g., Gaussian blur graph). |
| **Solid Blue Fill** | Key components to highlight (e.g., magnetic disk). |
| **No Fill (Outline Only)** | Default for most shapes. |

### Annotation Lines
*   Use **dashed lines** (`- - -`) for leader lines pointing to labels.
*   Lines should be horizontal or at 45° angles (no arbitrary curves).

---

## 5. Figure Numbering & Legends

### Figure IDs (`FIG_XXX`)
*   **Position**: Vertically along the **left edge** of each figure.
*   **Format**: `FIG_001`, `FIG_002`, etc. (3-digit, zero-padded).
*   **Font**: Monospace, Blueprint Blue, rotated 90° counter-clockwise (`writing-mode: vertical-rl; transform: rotate(180deg);`).

### Right-Margin Legend
*   **Position**: Vertically along the **right edge** of the page/figure.
*   **Content**: A short title describing the figure (e.g., `3.5 FLOPPY DISK`).
*   **Style**: Monospace, uppercase, Blueprint Blue, rotated 90° clockwise.

---

## 6. Layout & Spacing

### Asymmetric Two-Column Layout
*   **Left Column (~35-40%)**: Text content (body, explanations).
*   **Right Column (~60-65%)**: Large technical illustrations.
*   This creates a "manual page" feel where diagrams dominate.

### Horizontal Divider
*   A **thin blue line** separates the header from the main content.
*   Use `border-top: 1px solid var(--c-blueprint);`.

### Vertical Labels on Margins
*   Figure IDs on the left, legends on the right (see Section 5).

### Whitespace
*   Generous, but structured around a grid.

---

## 7. UI Components

### Buttons
*   **Shape**: Rectangular, **sharp corners** (`border-radius: 0`).
*   **Default**: Blue outline, white fill, blue text.
*   **Hover**: Inverted (Blue fill, white text).

### Inputs
*   **Style**: Underline only, or thin blue border rectangle.
*   **Font**: Monospace.

### Cards / Containers
*   **Border**: Thin (1px) Blue line.
*   **Decoration**: Small squares in corners or chamfered (45°) corners.

---

## 8. Example CSS Variables
```css
:root {
  /* Colors */
  --c-canvas: #FFFFFF;
  --c-blueprint: #4D6BFE;
  --c-ink: #111111;
  --c-grid: #F0F0F0;

  /* Typography */
  --f-heading: 'Press Start 2P', cursive;
  --f-body: 'Times New Roman', serif;
  --f-tech: 'Space Mono', monospace;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;
}
```

---

## 9. Quick Reference Checklist for Developers

- [ ] Use the 4-color palette only.
- [ ] Headings: Pixelated font, uppercase, Blueprint Blue.
- [ ] Body: Serif font, Ink Black, line-height 1.6.
- [ ] Labels: Monospace, uppercase, `SNAKE_CASE`.
- [ ] First paragraph: Use a **Drop Cap**.
- [ ] Subtitles: Italic Serif.
- [ ] Diagrams: Isometric, Blueprint Blue outlines, dashed annotation lines.
- [ ] Figure numbering: `FIG_XXX` on left margin (vertical).
- [ ] Right-margin legend: Vertical title describing the figure.
- [ ] Layout: Asymmetric 2-column (text left, diagram right).
- [ ] Divider: Thin blue line under the header.
