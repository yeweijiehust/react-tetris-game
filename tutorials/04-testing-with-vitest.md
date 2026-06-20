# 04 — Testing with Vitest

## Learning Objectives

- Understand how Vitest is configured in a Vite project
- Learn BDD-style test structure with `describe`/`it`/`expect`
- Write unit tests for pure game logic functions
- Understand how to test localStorage interactions

## Prerequisites

- Familiarity with the game logic from [03 — Pure Functions and Game Logic](03-pure-functions-and-game-logic.md)
- Basic understanding of package.json scripts

---

## 1. How Vitest is Configured

Open `vite.config.ts`. The `test` block configures Vitest:

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test-setup.ts',
}
```

- **`globals: true`** — makes test functions like `describe`, `it`, `expect` globally available without imports.
- **`environment: 'jsdom'`** — provides a browser-like DOM in Node.js. This is essential for testing code that uses `document`, `window`, or `localStorage`. The `jsdom` package implements DOM APIs in pure JavaScript.
- **`setupFiles`** — runs `./src/test-setup.ts` before each test file:

```ts
import '@testing-library/jest-dom/vitest'
```

This imports custom DOM matchers (like `toBeInTheDocument`) and makes them available in the Vitest environment.

The `npm test` script in `package.json` runs `vitest run` (single run, no watch).

## 2. Test File Structure

Open `src/tetris-logic.test.ts`. Every test file follows this structure:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createBoard, ... } from './tetris-logic'

beforeEach(() => {
  localStorage.clear()
})

describe('board', () => {
  it('creates empty board with correct dimensions', () => {
    const board = createBoard()
    expect(board.length).toBe(BOARD_HEIGHT)
    expect(board[0].length).toBe(BOARD_WIDTH)
    expect(board.every(r => r.every(c => c === 0))).toBe(true)
  })
})
```

- `describe(name, fn)` — groups related tests. Provides structure and readable output.
- `it(name, fn)` — defines a single test case. The name should describe the expected behavior.
- `expect(value)` — returns an assertion object with matchers like `.toBe()`, `.toEqual()`, `.toBeGreaterThan()`.
- `beforeEach(fn)` — runs before each test. Here it clears `localStorage` to ensure tests don't interfere.

## 3. Writing Assertions

### Basic Equality

```ts
expect(board.length).toBe(BOARD_HEIGHT)
```

- `.toBe(value)` — uses `Object.is` for comparison. Best for primitives.
- `.toEqual(value)` — deep equality check for objects and arrays.

### Boolean Assertions

```ts
expect(isCollision(board, moved)).toBe(true)
```

### Numeric Comparison

```ts
expect(calculateScore(4, 5)).toBe(4000)  // 800 * 5
```

### Array State After Operations

```ts
it('clears full lines and shifts board', () => {
  // ... set up board with 2 full rows ...
  const result = clearLines(board)
  expect(result.linesCleared).toBe(2)
  expect(result.board[BOARD_HEIGHT - 1].every(c => c === 0)).toBe(true)
})
```

## 4. Testing Pure Functions

The game logic functions are **pure** — they take inputs and return outputs without side effects. This makes them trivially testable:

- No mocking needed for most tests.
- Each test sets up inputs, calls the function, and checks the output.
- Deterministic: same inputs always produce same outputs.

The only exception is the history functions, which interact with `localStorage`. The `jsdom` environment provides a mock `localStorage` implementation, and the `beforeEach` hook clears it between tests:

```ts
it('limits to 10 records', () => {
  for (let i = 0; i < 15; i++) {
    addHistory({ score: i * 100, lines: i, level: 1, duration: 10 })
  }
  expect(getHistory().length).toBe(10)
  expect(getHistory()[9].score).toBe(500)
})
```

## 5. Testing Iterative Logic (Ghost Piece)

```ts
it('ghost stops above placed piece', () => {
  const board = createBoard()
  for (let c = 0; c < BOARD_WIDTH; c++) {
    board[BOARD_HEIGHT - 3][c] = 1
  }
  const piece = createPiece('I')
  const ghostY = getGhostY(board, piece)
  expect(ghostY).toBe(BOARD_HEIGHT - 5)
})
```

This test fills row 17 and verifies the I piece ghost stops at row 15 — 2 rows above the obstacle.

## 6. Running Tests

```bash
npm test              # single run
npx vitest            # watch mode (re-runs on file changes)
npx vitest --ui       # launches the Vitest UI dashboard
```

Output:

```
 ✓ src/tetris-logic.test.ts (23 tests)

 Test Files  1 passed (1)
      Tests  23 passed (23)
```

## Key Concepts Summary

| Concept | Description |
|---|---|
| Vitest | Fast test runner integrated with Vite, compatible with Jest's API |
| jsdom | JavaScript implementation of browser DOM APIs for Node.js |
| `describe`/`it`/`expect` | BDD-style test structure |
| `beforeEach` | Setup hook that runs before each test |
| Pure function testing | No mocking needed — set inputs, call function, check outputs |

## Next

→ [05 — React Hooks in Depth](05-react-hooks-in-depth.md)
