# 11 — Testing React Components

## Learning Objectives

- Learn how to test React components with `@testing-library/react`
- Understand how to mock browser APIs (like Canvas) for testing
- Write tests that verify component behavior, not implementation

## Prerequisites

- Understanding of Vitest basics (see [04 — Testing with Vitest](04-testing-with-vitest.md))
- Familiarity with React components and hooks
- Completion of [05 — React Hooks in Depth](05-react-hooks-in-depth.md)

---

**Note:** This project currently has 23 unit tests covering the pure game logic in `tetris-logic.ts`, but does not include component tests for `TetrisGame.tsx`. This tutorial explains *how* you would write those tests.

## 1. The Testing Stack

The project has these testing dependencies installed:

```
vitest              — test runner
@testing-library/react     — render React components in tests
@testing-library/jest-dom  — DOM-specific matchers (toBeInTheDocument, etc.)
jsdom               — browser environment for Node.js
```

The Vitest config in `vite.config.ts` sets up:

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test-setup.ts',
}
```

The setup file imports jest-dom matchers:

```ts
import '@testing-library/jest-dom/vitest'
```

This enables matchers like `toBeInTheDocument()`, `toHaveTextContent()`, and `toHaveClass()`.

## 2. What to Test in a Component

For a game component like `TetrisGame.tsx`, the key behaviors to test are:

| Behavior | Test approach |
|---|---|
| Component renders without crashing | `render(<TetrisGame />)` |
| Title displays correctly | Check for text content |
| Buttons appear in idle state | Check for "Start Game" button |
| Buttons change after starting | Simulate click, check for "Pause" |
| History modal opens | Simulate button click, check modal visibility |
| Canvas element exists | Check for `<canvas>` in rendered output |

## 3. Basic Component Rendering Test

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TetrisGame from './TetrisGame'

describe('TetrisGame', () => {
  it('renders the game title', () => {
    render(<TetrisGame />)
    expect(screen.getByText('Tetris')).toBeInTheDocument()
  })

  it('renders a canvas element', () => {
    render(<TetrisGame />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '300')
    expect(canvas).toHaveAttribute('height', '600')
  })

  it('shows Start button in idle state', () => {
    render(<TetrisGame />)
    expect(screen.getByText('Start Game')).toBeInTheDocument()
  })
})
```

**What's happening:**

- `render(<TetrisGame />)` mounts the component in a jsdom environment.
- `screen.getByText('Tetris')` queries the rendered DOM for an element containing "Tetris".
- `.toBeInTheDocument()` is a jest-dom matcher that asserts the element exists in the DOM.

## 4. Testing User Interactions

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TetrisGame from './TetrisGame'

describe('TetrisGame interactions', () => {
  it('starts the game when Start is clicked', () => {
    render(<TetrisGame />)
    fireEvent.click(screen.getByText('Start Game'))
    // After starting, the Score label should be visible
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('shows Pause button after game starts', () => {
    render(<TetrisGame />)
    fireEvent.click(screen.getByText('Start Game'))
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('opens history modal when History button is clicked', () => {
    render(<TetrisGame />)
    fireEvent.click(screen.getByText('History'))
    expect(screen.getByText('No history')).toBeInTheDocument()
  })
})
```

**Key functions:**

- `fireEvent.click(element)` — simulates a mouse click.
- `screen.getByText('...')` — finds an element by its text content. Throws if not found (which fails the test).

**Note:** The game uses `useI18n()` which defaults to `'zh'` (Chinese) in the hook, but the tests here assume English text. To handle this, you would need to either:

1. **Mock `useI18n`** to return English translations.
2. **Set the default language** via a prop or context.
3. **Test with Chinese text** (`screen.getByText('开始游戏')`).

## 5. Mocking Canvas

For component tests, Canvas API calls need to be mocked because jsdom doesn't implement Canvas:

```ts
// In a test setup file
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => {
    // Return a minimal mock of CanvasRenderingContext2D
    return {
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      // ... other methods used by the code
    } as unknown as CanvasRenderingContext2D
  }
})
```

This prevents errors when the component tries to call canvas methods during rendering.

## 6. Keyboard Event Testing

```tsx
it('responds to keyboard input', () => {
  render(<TetrisGame />)
  fireEvent.click(screen.getByText('Start Game'))

  // Simulate pressing the left arrow key
  fireEvent.keyDown(window, { code: 'ArrowLeft' })

  // The game state changes (verified by checking canvas or state)
  // Since the canvas is mocked, we verify indirectly
  // by checking no errors were thrown
})
```

`fireEvent.keyDown(element, { code: 'ArrowLeft' })` dispatches a keyboard event with the specified `code` property.

## 7. Testing localStorage

The history functions use `localStorage`, which is mocked by jsdom. You can verify that history data is saved:

```ts
it('saves history to localStorage on game over', () => {
  render(<TetrisGame />)

  // Start the game
  fireEvent.click(screen.getByText('Start Game'))

  // Simulate game over (would need to manipulate game state)
  // Then check localStorage was written
  const history = JSON.parse(localStorage.getItem('tetris-history') || '[]')
  expect(history.length).toBeGreaterThan(0)
})
```

However, triggering a game over from UI interactions is difficult with the current architecture. A better approach would be to test `addHistory` directly (already covered in `tetris-logic.test.ts`).

## 8. What Not to Test

**Don't test implementation details** like internal state values or refs. Instead, test **observable behavior**:

| ❌ Don't test | ✅ Test instead |
|---|---|
| `gameRef.current.score` equals 0 | The score display shows "0" |
| `lockPiece` was called | The piece moves down |
| Canvas was drawn | The canvas element exists (visual output is verified separately) |
| Internal `stateRef` values | Button text changes based on game status |

## Key Concepts Summary

| Concept | Description |
|---|---|
| `render()` | Mounts a React component in jsdom for testing |
| `screen.getByText()` | Queries the DOM by text content |
| `fireEvent.click()` | Simulates user clicks |
| `fireEvent.keyDown()` | Simulates keyboard events |
| Canvas mocking | Required because jsdom has no Canvas implementation |
| Behavior vs implementation | Test what the user sees, not internal state |
| jest-dom matchers | `.toBeInTheDocument()`, `.toHaveTextContent()`, etc. |

This project's test suite (`tetris-logic.test.ts`) focuses on the pure game logic — 23 tests covering collision, rotation, line clearing, scoring, ghost projection, and history management. Component tests would be added following the patterns described in this tutorial.

## Next

You've reached the end of this tutorial series! Return to the [README](../README.md) for project overview and commands.
