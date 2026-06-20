# 03 — Pure Functions and Game Logic

## Learning Objectives

- Understand how a Tetris board is represented in code
- Learn collision detection algorithms
- Understand SRS (Super Rotation System) piece rotation
- Implement line clearing and scoring logic
- Understand the ghost piece projection algorithm

## Prerequisites

- Understanding of TypeScript types and arrays (see [02 — TypeScript Crash Course](02-typescript-crash-course.md))
- Familiarity with basic Tetris rules

---

Open `src/tetris-logic.ts`. This file contains all the pure game logic — no React, no DOM, no side effects (except `localStorage` in the history functions). This separation makes the logic easy to test.

## 1. Board Representation

```ts
export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const CELL_SIZE = 30

export function createBoard(): number[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
}
```

The board is a 2D array of numbers: `board[row][col]`.

- `0` means the cell is empty.
- `1`–`7` represent the seven piece types (I, O, T, S, Z, J, L). The value corresponds to `PIECE_TYPES.indexOf(piece.type) + 1`.

**Why index + 1?** Because `0` is reserved for "empty", so the first piece type (I) gets `1`, the second (O) gets `2`, and so on.

## 2. Piece Shapes

```ts
const SHAPES: Record<PieceType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  // ...
}
```

Each piece type is stored as a matrix of 1s (filled) and 0s (empty). Pieces use the minimum bounding box:

- **I piece**: 4×4 matrix
- **O piece**: 2×2 matrix
- **T, S, Z, J, L**: 3×3 matrices

The `1` values represent the actual blocks of the piece. The `0` values are empty padding that makes rotation mathematically consistent.

### Creating a Piece

```ts
export function createPiece(type: PieceType): Piece {
  const shape = SHAPES[type].map(r => [...r])  // deep copy
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2)  // center horizontally
  return { type, shape, pos: { x, y: 0 } }
}
```

The piece starts at the top of the board (`y: 0`) and is centered horizontally. The `map(r => [...r])` creates a fresh copy of the shape so mutating the piece doesn't affect the original `SHAPES` constant.

## 3. Movement

```ts
export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, pos: { x: piece.pos.x + dx, y: piece.pos.y + dy } }
}
```

This returns a **new** piece at the new position without mutating the original. `dx` = change in x, `dy` = change in y. Positive `dy` moves the piece downward.

## 4. Rotation (SRS Clockwise)

```ts
export function rotatePiece(piece: Piece): Piece {
  const n = piece.shape.length
  const newShape: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      newShape[c][n - 1 - r] = piece.shape[r][c]
    }
  }
  return { ...piece, shape: newShape }
}
```

This implements a 90-degree clockwise rotation using matrix transposition. For an N×N matrix:

- The element at `[r][c]` moves to `[c][N-1-r]`.
- This is equivalent to: transpose the matrix, then reverse each row.

The Super Rotation System (SRS) is the standard Tetris rotation system. This implementation is a simplified version (no wall kicks), but it correctly rotates all 7 piece types.

## 5. Collision Detection

```ts
export function isCollision(board: number[][], piece: Piece): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue
      const bx = piece.pos.x + c
      const by = piece.pos.y + r
      if (bx < 0 || bx >= BOARD_WIDTH || by >= BOARD_HEIGHT) return true
      if (by < 0) continue
      if (board[by][bx]) return true
    }
  }
  return false
}
```

This function checks three types of collision:

1. **Wall collision**: `bx < 0` (left wall) or `bx >= BOARD_WIDTH` (right wall).
2. **Floor collision**: `by >= BOARD_HEIGHT` (below the bottom).
3. **Piece collision**: `board[by][bx]` is non-zero (another piece is already there).

The `if (by < 0) continue;` handles the case where the piece is partially above the visible board, which happens when a new piece spawns.

## 6. Placing a Piece

```ts
export function placePiece(board: number[][], piece: Piece): number[][] {
  const newBoard = board.map(r => [...r])
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue
      const bx = piece.pos.x + c
      const by = piece.pos.y + r
      if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
        newBoard[by][bx] = PIECE_TYPES.indexOf(piece.type) + 1
      }
    }
  }
  return newBoard
}
```

This "burns" the piece into the board by copying the piece's shape values into the board array. The color index is stored so the renderer knows which color to draw.

## 7. Line Clearing

```ts
export function clearLines(board: number[][]): { board: number[][]; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => !cell))
  const linesCleared = BOARD_HEIGHT - newBoard.length
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0))
  }
  return { board: newBoard, linesCleared }
}
```

The algorithm:

1. `filter` keeps only rows with at least one empty cell — this removes full rows.
2. `BOARD_HEIGHT - newBoard.length` counts how many rows were removed.
3. `unshift` prepends empty rows at the top to restore the board height.

This is elegant because `filter` naturally handles multiple simultaneous line clears.

## 8. Scoring

```ts
export function calculateScore(linesCleared: number, level: number): number {
  const points = [0, 100, 300, 500, 800]
  return (points[linesCleared] ?? 0) * level
}
```

| Lines cleared | Base points |
|---|---|
| 1 (Single) | 100 |
| 2 (Double) | 300 |
| 3 (Triple) | 500 |
| 4 (Tetris) | 800 |

The score is multiplied by the current level, incentivizing players to survive longer.

## 9. Ghost Piece Projection

```ts
export function getGhostY(board: number[][], piece: Piece): number {
  let ghostY = piece.pos.y
  while (!isCollision(board, movePiece(piece, 0, ghostY - piece.pos.y + 1))) {
    ghostY++
  }
  return ghostY
}
```

The ghost piece shows where the current piece will land. The algorithm starts at the piece's current Y, moves it down step by step until collision, and returns the last valid Y.

## 10. History with localStorage

```ts
export function addHistory(record: Omit<HistoryRecord, 'id' | 'date'>): void {
  const history = getHistory()
  const newRecord: HistoryRecord = {
    ...record,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
  }
  history.unshift(newRecord)
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}
```

- `getHistory()` reads and parses the stored JSON array (returns `[]` if parsing fails).
- Each record gets a unique `id` (timestamp + random suffix encoded in base-36) and an ISO `date`.
- `unshift` adds the newest record to the front.
- Truncating `history.length = MAX_HISTORY` removes the oldest records.

## Key Concepts Summary

| Concept | Implementation |
|---|---|
| Board | `number[][]` — 20 rows × 10 columns, 0 = empty, 1–7 = piece types |
| Collision detection | Iterate piece shape cells, check board bounds and occupied cells |
| Rotation | Matrix transpose + column reverse (clockwise 90°) |
| Line clear | Filter out full rows, prepend empty rows at top |
| Scoring | Base points × level, with increasing rewards per line |
| Ghost piece | Drop piece virtually until collision, return last valid Y |
| Persistence | localStorage with JSON serialization, max 10 records |

## Next

→ [04 — Testing with Vitest](04-testing-with-vitest.md)
