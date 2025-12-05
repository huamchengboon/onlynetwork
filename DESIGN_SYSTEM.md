# Design System Documentation
## Technical Manual Design Language

This document describes the complete design system for the Cisco Packet Tracer implementation, following the "Technical Manual" design language guide.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Components](#components)
5. [Layout System](#layout-system)
6. [Usage Examples](#usage-examples)

---

## Design Philosophy

**"Engineering as Art"**

The design system celebrates the raw, structural beauty of software and hardware engineering. It draws inspiration from technical manuals, blueprints, and early computing aesthetics.

**Core Principles:**
- Form follows function, but form is rendered with exquisite technical detail
- Precision and clarity over decoration
- Blueprint aesthetic throughout
- Technical manual layout patterns

---

## Color Palette

The palette is strictly limited to high-contrast "Blueprint" colors.

| Color Name | Hex Code | CSS Variable | Usage |
|------------|----------|--------------|-------|
| Canvas White | `#FFFFFF` | `--c-canvas` | Main background |
| Blueprint Blue | `#4D6BFE` | `--c-blueprint` | Primary accent, headings, diagrams, lines |
| Ink Black | `#111111` | `--c-ink` | Body text (Serif) |
| Grid Gray | `#F0F0F0` | `--c-grid` | Background grids, subtle dividers |

**Additional Color Variations:**
- `--c-blueprint-hover`: Hover states
- `--c-blueprint-light`: Light backgrounds
- `--c-ink-light`: Secondary text
- `--c-ink-lighter`: Tertiary text

> **Note**: Avoid other colors. Use patterns (hatching) for semantic states if needed.

---

## Typography

### Headings (The "Digital" Voice)

**Font**: `Press Start 2P`  
**Color**: Blueprint Blue  
**Transform**: UPPERCASE  
**Letter Spacing**: 0.05em

```css
.heading-xl { font-size: 2rem; }
.heading-lg { font-size: 1.5rem; }
.heading-md { font-size: 1.25rem; }
.heading-sm { font-size: 1rem; }
```

### Body Text (The "Manual" Voice)

**Font**: `Times New Roman`, `Georgia`, `EB Garamond`  
**Color**: Ink Black  
**Line Height**: 1.6

```css
.text-body { font-size: 1rem; }
.text-body-sm { font-size: 0.875rem; }
```

### Subtitle / Tagline

**Font**: Same as body, but `font-style: italic`  
**Color**: Ink Black

```css
.text-subtitle { font-style: italic; }
```

### Labels & Technical Data (The "Machine" Voice)

**Font**: `Space Mono`, `Courier New`, `Roboto Mono`  
**Color**: Blueprint Blue  
**Transform**: UPPERCASE  
**Use SNAKE_CASE** for multi-word labels

```css
.text-label { font-size: 0.75rem; }
.text-tech { font-size: 0.875rem; }
```

### Drop Caps

The first letter of the opening paragraph is enlarged, spanning 2-3 lines.

```css
.text-dropcap::first-letter {
    font-size: 3.5em;
    float: left;
    line-height: 1;
    margin-right: 0.1em;
}
```

---

## Components

### Button

Sharp corners, blueprint blue outline, white fill. Hover inverts colors.

```tsx
import { Button } from '@/components/ui';

<Button variant="outline" size="md">
  CLICK ME
</Button>
```

**Variants:**
- `default`: Blue fill, white text
- `outline`: White fill, blue text (default)
- `ghost`: Transparent background
- `danger`: Red variant for destructive actions

**Sizes:**
- `sm`: Small
- `md`: Medium (default)
- `lg`: Large

### Input

Monospace font, thin blue border, underline focus state.

```tsx
import { Input } from '@/components/ui';

<Input
  label="DEVICE_NAME"
  placeholder="Enter device name"
  error={errors.name}
/>
```

### Card

Thin blue border, sharp corners. Supports figure IDs and legends.

```tsx
import { Card } from '@/components/ui';

<Card
  title="NETWORK TOPOLOGY"
  subtitle="A reference manual for network design"
  figureId="FIG_001"
  figureLegend="3.1 NETWORK DIAGRAM"
>
  Content here
</Card>
```

### Modal

Blueprint-styled modal with header, content, and footer sections.

```tsx
import { Modal, Button } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="CONFIGURE DEVICE"
  subtitle="Edit device settings"
  size="md"
  footer={
    <>
      <Button variant="outline" onClick={handleClose}>CANCEL</Button>
      <Button variant="default" onClick={handleSave}>SAVE</Button>
    </>
  }
>
  Modal content
</Modal>
```

### FigureLabel

Vertical labels for figure numbering (FIG_XXX format).

```tsx
import { FigureLabel } from '@/components/ui';

<FigureLabel id="001" position="left">
  NETWORK DIAGRAM
</FigureLabel>
```

---

## Layout System

### Two-Column Layout

Asymmetric layout: ~35-40% left (text), ~60-65% right (diagrams).

```tsx
import { TwoColumnLayout } from '@/components/ui';

<TwoColumnLayout
  left={<div>Text content</div>}
  right={<div>Technical illustration</div>}
/>
```

### Divider

Horizontal or vertical dividers in blueprint blue.

```tsx
import { Divider } from '@/components/ui';

<Divider variant="horizontal" />
<Divider variant="vertical" />
```

---

## Spacing

Consistent spacing scale using CSS variables:

- `--space-xs`: 0.25rem (4px)
- `--space-sm`: 0.5rem (8px)
- `--space-md`: 1rem (16px)
- `--space-lg`: 2rem (32px)
- `--space-xl`: 4rem (64px)

---

## Design Tokens

All design tokens are defined in `src/styles/design-tokens.css`:

- Colors
- Typography (fonts, sizes, line heights)
- Spacing
- Borders
- Shadows
- Transitions
- Layout
- Z-index

---

## Usage Examples

### Complete Page Layout

```tsx
import { TwoColumnLayout, Card, Divider, Button } from '@/components/ui';

function NetworkDiagramPage() {
  return (
    <div className="container">
      <h1 className="heading-xl">NETWORK TOPOLOGY</h1>
      <p className="text-subtitle">A reference manual for network design</p>
      
      <Divider variant="horizontal" />
      
      <TwoColumnLayout
        left={
          <div>
            <p className="text-body dropcap-container">
              This is the main content area with a drop cap.
            </p>
          </div>
        }
        right={
          <Card
            figureId="FIG_001"
            figureLegend="3.1 NETWORK DIAGRAM"
          >
            <div>Diagram content</div>
          </Card>
        }
      />
    </div>
  );
}
```

### Form Example

```tsx
import { Card, Input, Button } from '@/components/ui';

function DeviceConfigForm() {
  return (
    <Card title="DEVICE CONFIGURATION">
      <Input
        label="DEVICE_NAME"
        placeholder="Enter device name"
      />
      <Input
        label="IP_ADDRESS"
        placeholder="192.168.1.1"
        type="text"
      />
      <div className="flex gap-2 mt-4">
        <Button variant="outline">CANCEL</Button>
        <Button variant="default">SAVE</Button>
      </div>
    </Card>
  );
}
```

---

## File Structure

```
src/
├── styles/
│   ├── design-tokens.css    # All CSS variables
│   ├── typography.css       # Typography system
│   └── layout.css           # Layout utilities
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── FigureLabel.tsx
│       ├── Layout.tsx
│       └── index.ts         # Exports
```

---

## Checklist

When creating new components, ensure:

- [ ] Uses only the 4-color palette
- [ ] Sharp corners (border-radius: 0)
- [ ] Blueprint blue accents
- [ ] Appropriate typography (heading/body/label)
- [ ] Monospace for technical data
- [ ] Uppercase for labels
- [ ] Follows component structure rule
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Responsive where needed

---

## Resources

- [Design Language Guide](./design_language_guide.md)
- [Component Structure Rule](../user_rules)
- [Cisco Packet Tracer Plan](./CISCO_PACKET_TRACER_PLAN.md)
