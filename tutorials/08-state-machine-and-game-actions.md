# 08 — State Machine and Game Actions

## Learning Objectives

- Understand the game's four-state state machine
- Learn how piece locking, line clearing, and game over detection work together
- Understand the flow from piece placement to game over

## Prerequisites

- Familiarity with the game loop (see [07 — Game Loop and Keyboard](07-game-loop-and-keyboard.md))
- Understanding of the pure functions from [03 — Pure Functions and Game Logic](03-pure-functions-and-game-logic.md)

---

Open `src/TetrisGame.tsx`. The game state machine is the central organizing concept of the component.

## 1. The Four States

```ts
type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'
```

```
            ┌─────────┐
            │  idle   │
            └────┬────┘
                 │ startGame()
                 ▼
            ┌─────────┐
     ┌──────│ playing │──────┐
     │      └─────────┘      │
     │ togglePause()    lockPiece()
     │          │       detects
     ▼          ▼       collision
┌─────────┐    on spawn
│ paused  │
└─────────┘          ┌──────────┐
                     │ gameover │
                     └──────────┘
```

Transitions:
- `idle` → `playing`: Player clicks "Start Game"
- `playing` → `paused`: Player presses Space or clicks "Pause"
- `paused` → `playing`: Player presses Space or clicks "Resume"
- `playing` → `gameover`: New piece collides immediately on spawn
- `gameover` → `playing`: Player clicks "Start" or "Restart" (calls `startGame()`)
- `paused` → `playing`: Restart also works from paused state

## 2. Game Actions That Modify State

### `startGame()`

```ts
const startGame = useCallback(() => {
  const board = createBoard()
  const current = createPiece(randomPieceType())
  const next = createPiece(randomPieceType())
  const newState: GameState = {
    board, currentPiece: current, nextPiece: next,
    score: 0, level: 1, lines: 0, status: 'playing',
  }
  gameRef.current = newState
  setGame(newState)
  lastDropRef.current = performance.now()
}, [])
```

This resets everything: fresh board, random first and next pieces, zero score, level 1. It also resets the drop timer so the first drop doesn't happen instantly.

### `togglePause()`

```ts
const togglePause = useCallback(() => {
  const s = gameRef.current
  if (s.status === 'playing') {
    setGame({ ...s, status: 'paused' })
  } else if (s.status === 'paused') {
    setGame({ ...s, status: 'playing' })
    lastDropRef.current = performance.now()
  }
}, [])
```

Toggles between `playing` and `paused`. Resets the drop timer on resume to prevent an immediate drop.

### `moveLeft()` / `moveRight()` / `moveDown()` / `rotate()`

These all follow the same pattern:

```ts
const moveLeft = useCallback(() => {
  const s = gameRef.current
  if (s.status !== 'playing' || !s.currentPiece) return
  const moved = movePiece(s.currentPiece, -1, 0)
  if (!isCollision(s.board, moved)) {
    gameRef.current = { ...s, currentPiece: moved }
    setGame({ ...s, currentPiece: moved })
  }
}, [])
```

1. Guard: only proceed if `status === 'playing'` and a piece exists.
2. Compute the new position/rotation.
3. Check for collision.
4. If valid, update state.

## 3. The `lockPiece` Action Chain — This is the Core

```ts
const lockPiece = useCallback((piece: Piece) => {
  const s = gameRef.current

  // 1. Place piece on board
  const newBoard = placePiece(s.board, piece)

  // 2. Clear completed lines
  const { board: clearedBoard, linesCleared } = clearLines(newBoard)

  // 3. Update score, level, lines
  const newLines = s.lines + linesCleared
  const newLevel = Math.floor(newLines / 10) + 1
  const newScore = s.score + calculateScore(linesCleared, s.level)

  // 4. Spawn next piece
  const newCurrent = s.nextPiece!
  const newNext = createPiece(randomPieceType())

  // 5. Check game over
  if (isCollision(clearedBoard, newCurrent)) {
    addHistory({ score: newScore, lines: newLines, level: newLevel, duration: 0 })
    gameRef.current = {
      ...s, board: clearedBoard, currentPiece: newCurrent,
      score: newScore, lines: newLines, level: newLevel,
      status: 'gameover',
    }
    setGame({ ... })
    return
  }

  // 6. Normal case — continue playing
  gameRef.current = {
    ...s, board: clearedBoard, currentPiece: newCurrent,
    nextPiece: newNext, score: newScore, lines: newLines, level: newLevel,
  }
  setGame({ ... })
}, [])
```

Let's trace through the action chain step by step:

### Step 1: Place the piece

`placePiece(s.board, piece)` writes the piece's values into the board array. The old board is not mutated — a new array is returned.

### Step 2: Clear lines

`clearLines(newBoard)` filters out full rows. For example, if 2 rows were completed:

```
Before (bottom 3 rows):   After:
[A][A][A][A][A]          [ ][ ][ ][ ][ ]  ← empty row added
[1][1][1][1][1]  full    [A][A][A][A][A]  ← remaining row shifted down
[1][1][1][1][1]  full
```

### Step 3: Update score

`calculateScore(2, level)` returns `300 * level`. If level is 3, that's 900 points.

The level increases every 10 lines: `Math.floor(newLines / 10) + 1`.

### Step 4: Spawn next piece

The "next piece" becomes the current piece. A new random piece is generated for the next preview.

```ts
const newCurrent = s.nextPiece!     // the ! asserts non-null
const newNext = createPiece(randomPieceType())
```

### Step 5: Game over check

This is the critical moment. After spawning the new piece at the top of the board, we check if it overlaps with existing blocks:

```ts
if (isCollision(clearedBoard, newCurrent)) {
  // Game over — no room for the new piece
}
```

If the spawn position is blocked, the game ends. The final score is saved to history via `addHistory`.

### Step 6: Normal continuation

If there's room, the game continues with the new current piece and updated scores.

## 4. The `dropPiece` Entry Point

```ts
const dropPiece = useCallback(() => {
  const s = gameRef.current
  if (s.status !== 'playing' || !s.currentPiece) return

  const moved = movePiece(s.currentPiece, 0, 1)
  if (!isCollision(s.board, moved)) {
    gameRef.current = { ...s, currentPiece: moved }
    setGame({ ...s, currentPiece: moved })
    return
  }

  // Collision → lock the piece
  lockPiece(s.currentPiece)
}, [lockPiece])
```

This is called by the game loop's drop timer. It first tries to move the piece down. If it can't, it calls `lockPiece`.

## 5. Button Rendering Based on State

```tsx
{(game.status === 'idle' || game.status === 'gameover') && (
  <button className="game-btn primary" onClick={startGame}>
    {t('start')}
  </button>
)}
{(game.status === 'playing' || game.status === 'paused') && (
  <button className="game-btn primary" onClick={togglePause}>
    {game.status === 'playing' ? t('pause') : t('resume')}
  </button>
)}
<button className="game-btn" onClick={startGame}>
  {t('restart')}
</button>
```

- The "Start" button appears only when `idle` or `gameover`.
- The "Pause/Resume" button appears only when `playing` or `paused`.
- The "Restart" button is always visible, calling `startGame()` regardless of current state.

## Key Concepts Summary

| Concept | Description |
|---|---|
| State machine | Four states: idle → playing ↔ paused → gameover |
| lockPiece | Places piece, clears lines, spawns next, checks game over |
| Game over detection | New piece collides immediately on spawn |
| Button visibility | Conditionally rendered based on `game.status` |
| Restart | `startGame()` from any state resets everything |

## Next

→ [09 — Internationalization](09-internationalization.md)
