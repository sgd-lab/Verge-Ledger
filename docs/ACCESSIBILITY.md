# Accessibility Statement and Conformance Guide

**Version**: 0.1.0  
**Target Conformance**: WCAG 2.2 Level AA — target, not yet verified. Automated axe checks are written (see OQ-9) but have not yet run in a browser, so no conformance claim is made yet.

Verge Ledger is committed to digital inclusion. The application is designed to be fully usable by parish clerks, local volunteers, and residents using assistive technologies, keyboard-only navigation, and high-contrast mobile displays in direct sunlight.

---

## 1. Conformance Principles

### Principle 1: Perceivable

- **Non-Color Reliance**: Status badges, tier indicators, and map lines never convey information through color alone. Map lines utilize both distinct colors and distinct stroke dash patterns (e.g., solid lines for Promising verges, dashed lines for Ordinary verges).
- **Contrast Ratios**: All text elements meet or exceed the WCAG 2.2 AA minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text and UI components.
- **Sunlight Readability**: High-contrast dark text on clean light surfaces optimized for outdoor mobile use.

### Principle 2: Operable

- **Touch Target Sizes**: All interactive controls (buttons, checkboxes, dropdown triggers, and map touch markers) have a minimum touch target size of **44 x 44 CSS pixels**.
- **Keyboard Navigation**: All interactive workflows can be operated entirely via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, and arrow keys).
- **Skip Links**: An accessible skip link (`#main-content`) is present at the top of every page layout to allow keyboard users to bypass navigation headers.
- **Non-Map Alternative Coordinate Entry (`ACC-1`)**: Users who cannot interact with the Leaflet map interface can input start/end coordinates or segment length manually using accessible form fields.

### Principle 3: Understandable

- **Plain English (Reading Age ~12)**: Technical ecological terminology is defined in a single sentence at the point of use.
- **Explicit Form Labels and Error Messaging**: All form inputs feature permanently visible `<label>` elements and accessible `aria-describedby` error associations.

### Principle 4: Robust

- **Valid Semantic HTML5**: Standard landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`) and standard form controls.
- **Assistive Technology Compatibility**: ARIA attributes (`aria-expanded`, `aria-live`, `aria-selected`) are kept minimal and strictly compliant with WAI-ARIA 1.2 patterns.

---

## 2. Automated & Manual Verification Protocol

### Automated Audits in CI

- Playwright test suites execute automated accessibility audits using `@axe-core/playwright`.
- CI builds fail if any **serious** or **critical** accessibility violations are detected on primary routes (`/`, `/survey`, `/advisor`, `/simulator`, `/councils`, `/evidence-pack`).

### Manual Keyboard & Screen Reader Checklist

- [ ] Skip link appears on first tab and moves focus directly to main content.
- [ ] Visible focus ring (`outline: 2px solid #...`, `outline-offset: 2px`) is never suppressed without an accessible replacement.
- [ ] Single-page survey form allows full traversal and review without mouse interaction.
- [ ] Dropdowns and accordions announce expanded/collapsed states correctly to screen readers.
- [ ] Modal dialogs trap focus and close on `Escape`.
