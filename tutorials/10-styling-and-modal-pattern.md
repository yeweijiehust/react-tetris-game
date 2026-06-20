# 10 — Styling and Modal Pattern

## Learning Objectives

- Understand how CSS custom properties enable theming
- Learn the Flexbox layout used for the game UI
- Understand the modal overlay pattern for the history dialog
- See how CSS variables integrate with the dark theme

## Prerequisites

- Basic CSS knowledge (selectors, properties)
- Understanding of Flexbox fundamentals

---

## 1. CSS Custom Properties for Theming

Open `src/index.css`. The root element defines CSS custom properties (variables) that are used throughout the application:

```css
:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --shadow: rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;
}
```

**Why custom properties?**

- **Consistency**: One source of truth for colors, fonts, and spacing.
- **Theming**: Override variables in a media query to support dark mode.
- **Maintainability**: Change one value to update the entire UI.

### Dark Mode via Media Query

```css
@media (prefers-color-scheme: dark) {
  :root {
    --text: #9ca3af;
    --text-h: #f3f4f6;
    --bg: #16171d;
    --border: #2e303a;
    --code-bg: #1f2028;
    --accent: #c084fc;
    /* ... */
  }
}
```

This automatically switches colors based on the user's OS-level preference. `prefers-color-scheme` is a CSS media feature that detects light or dark mode.

## 2. Flexbox Layout

Open `src/App.css`. The main layout uses Flexbox:

```css
.tetris-main {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
```

This creates a horizontal layout with the canvas on the left and the sidebar on the right.

### The Sidebar Stack

The sidebar uses nested flex containers:

```css
.tetris-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 160px;
}
```

Contents stack vertically: score info → next piece preview → buttons.

### Info Rows

```css
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
```

`justify-content: space-between` pushes the label to the left and the value to the right, creating a clean two-column look.

### Buttons

```css
.tetris-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

Buttons stack vertically with 8px gaps.

### Primary Button Style

```css
.game-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}

.game-btn.primary:hover {
  filter: brightness(1.1);
}
```

The primary button uses the accent color as background with white text. `filter: brightness(1.1)` lightens the button on hover without needing a separate hover color variable.

## 3. The Modal Pattern

The history dialog uses a classic modal overlay pattern:

### HTML Structure

```tsx
{showHistory && (
  <div className="modal-overlay" onClick={() => setShowHistory(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{t('history')}</h2>
        <button className="close-btn" onClick={() => setShowHistory(false)}>✕</button>
      </div>
      {/* ... history list ... */}
    </div>
  </div>
)}
```

### CSS

```css
.modal-overlay {
  position: fixed;
  inset: 0;             /* covers entire viewport */
  background: rgba(0, 0, 0, 0.6);  /* semi-transparent backdrop */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;          /* ensures modal is above everything */
}

.modal-content {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  min-width: 340px;
  max-width: 460px;
  max-height: 80vh;
  overflow-y: auto;      /* scrollable if content overflows */
  box-shadow: var(--shadow);
}
```

**How the modal works:**

1. The overlay covers the entire viewport with `position: fixed; inset: 0`.
2. The overlay's `onClick` closes the modal (click outside the content area).
3. The content's `onClick` calls `e.stopPropagation()` to prevent the overlay click from firing when clicking inside the content.
4. `z-index: 100` ensures the modal is above all other elements.
5. `overflow-y: auto` with `max-height: 80vh` allows scrolling for many history records.

## 4. The History Item Layout

```css
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  gap: 8px;
}

.history-score {
  color: var(--accent);
  font-weight: 600;
  font-family: var(--mono);
  font-size: 16px;
}
```

Each history row uses flexbox to lay out three pieces of information:

| Element | Content | Style |
|---|---|---|
| `.history-score` | Score value | Accent color, monospace font |
| `.history-detail` | Level & lines | Normal text color |
| `.history-date` | Date string | Small, nowrap |

## 5. Canvas Border and Shadow

```css
.tetris-canvas {
  border: 2px solid var(--border);
  border-radius: 4px;
  display: block;
}
```

The canvas gets a subtle border matching the theme. `display: block` removes the default inline gap below canvas elements.

## Key Concepts Summary

| Concept | Description |
|---|---|
| CSS custom properties | Variables like `--accent`, `--bg` for consistent theming |
| `prefers-color-scheme` | Media query that detects OS-level dark mode preference |
| Flexbox layout | Horizontal main layout (`display: flex`), vertical sidebar (`flex-direction: column`) |
| Modal overlay | `position: fixed; inset: 0` with click-outside-to-close behavior |
| `e.stopPropagation()` | Prevents overlay click when clicking modal content |
| `z-index: 100` | Ensures modal stacks above all content |
| `filter: brightness()` | Simple hover effect without extra color variables |

## Next

→ [11 — Testing React Components](11-testing-react-components.md)
