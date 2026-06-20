# 05 — React Hooks in Depth

## Learning Objectives

- Understand how `useState`, `useRef`, `useCallback`, and `useEffect` work in practice
- Learn why `useRef` is needed to avoid stale closures in game loops
- Understand the `useReducer` pattern for force-rendering
- See how effects handle cleanup with `requestAnimationFrame` and event listeners

## Prerequisites

- Basic React knowledge (components, JSX)
- Understanding of closures in JavaScript
- Completed [03 — Pure Functions and Game Logic](03-pure-functions-and-game-logic.md)

---

Open `src/TetrisGame.tsx`. This is the main game component (493 lines). It uses four React hooks extensively.

## 1. `useState` — Component State

```ts
const [game, setGame] = useState<GameState>(initialState)
const [showHistory, setShowHistory] = useState(false)
```

- **`game`** holds the complete game state: board, current piece, next piece, score, level, lines, and status.
- **`showHistory`** controls whether the history modal is visible.

The `GameState` interface defines the shape:

```ts
interface GameState {
  board: number[][]
  currentPiece: Piece | null
  nextPiece: Piece | null
  score: number
  level: number
  lines: number
  status: GameStatus  // 'idle' | 'playing' | 'paused' | 'gameover'
}
```

`initialState` is a factory function that returns a fresh game state with an empty board and `status: 'idle'`.

## 2. `useRef` — Mutable Values That Survive Re-renders

Three distinct uses of `useRef`:

### a) DOM References

```ts
const canvasRef = useRef<HTMLCanvasElement>(null)
const previewRef = useRef<HTMLCanvasElement>(null)
```

These are attached to `<canvas>` elements via the `ref` attribute:

```tsx
<canvas ref={canvasRef} />
```

They provide direct access to the DOM nodes for Canvas 2D drawing.

### b) Mutable Game State Ref (Stale Closure Solution)

```ts
const gameRef = useRef(game)

useEffect(() => {
  gameRef.current = game
})
```

**Why is this needed?**

The game loop runs inside a `requestAnimationFrame` callback. Without `gameRef`, the loop would capture `game` from the closure at the time the effect ran, and would always see the **old** state. This is called a **stale closure**.

By synchronizing `gameRef.current = game` after every render, the game loop can always access the latest state via `gameRef.current`, even though the loop closure itself never re-runs.

```ts
// In the game loop — always reads latest state
const s = gameRef.current
```

The render path still reads from `game` (React state) directly, which triggers re-renders correctly.

### c) Animation Frame Handle

```ts
const animRef = useRef(0)
```

Stores the `requestAnimationFrame` ID so it can be cancelled in cleanup.

### d) Drop Timer

```ts
const lastDropRef = useRef(0)
```

Tracks the timestamp of the last drop to calculate when the next drop should occur. This is a performance timestamp, not a React value, so it doesn't need to trigger re-renders.

## 3. `useCallback` — Memoized Functions

Every game action is wrapped in `useCallback` with an empty dependency array:

```ts
const moveLeft = useCallback(() => {
  const s = gameRef.current
  if (s.status !== 'playing' || !s.currentPiece) return
  const moved = movePiece(s.currentPiece, -1, 0)
  if (!isCollision(s.board, moved)) {
    const next = { ...s, currentPiece: moved }
    gameRef.current = next
    setGame(next)
  }
}, [])
```

**Why `[]` deps?** Because `gameRef` is a ref object (stable identity) and `setGame` is stable (React guarantees this). The functions never need to be recreated because they always read the latest state through `gameRef.current`.

**Why is this important?**

1. The keyboard event handler effect depends on these functions. If they changed on every render, the effect would need to re-run and re-attach event listeners.
2. The game loop effect depends on `dropPiece` and `draw`. Stable references prevent unnecessary loop restarts.

The `dropPiece` and `lockPiece` callbacks have a dependency on each other:

```ts
const lockPiece = useCallback((piece: Piece) => { ... }, [])
const dropPiece = useCallback(() => { ... lockPiece(s.currentPiece) ... }, [lockPiece])
```

This is a valid pattern because `lockPiece` is stable (empty deps), so `dropPiece` is also effectively stable.

## 4. `useEffect` — Side Effects

### a) Game Loop

```ts
useEffect(() => {
  const loop = (time: number) => {
    const s = gameRef.current
    if (s.status === 'playing') {
      const interval = getDropInterval(s.level)
      if (time - lastDropRef.current >= interval) {
        dropPiece()
        lastDropRef.current = time
      }
    }
    draw()
    animRef.current = requestAnimationFrame(loop)
  }
  animRef.current = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(animRef.current)
}, [dropPiece, draw])
```

- **Cleanup function** (`cancelAnimationFrame`) is called when the component unmounts or when deps change. This prevents memory leaks.
- The loop runs on every frame but only executes game logic when `status === 'playing'`.
- `requestAnimationFrame` is preferred over `setInterval` because it syncs with the display refresh rate and pauses when the tab is inactive.

### b) Keyboard Events

```ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const s = gameRef.current
    switch (e.code) {
      case 'ArrowLeft':  e.preventDefault(); moveLeft(); break
      case 'ArrowRight': e.preventDefault(); moveRight(); break
      case 'ArrowDown':  e.preventDefault(); moveDown(); break
      case 'ArrowUp':    e.preventDefault(); rotate(); break
      case 'Space':
        e.preventDefault()
        if (s.status === 'playing' || s.status === 'paused') togglePause()
        break
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [moveLeft, moveRight, moveDown, rotate, togglePause])
```

- `e.preventDefault()` prevents the browser's default behavior (e.g., page scrolling) for game keys.
- `window.addEventListener` ensures keyboard events are captured regardless of focus.
- **Cleanup**: the event listener is removed when the component unmounts, preventing ghost listeners.

## 5. The `useRef` + `useState` Sync Pattern

This is a key architectural pattern in this project:

```
                    ┌──────────────────┐
                    │   React State    │ ←── Used by JSX rendering
                    │   (useState)     │
                    └────────┬─────────┘
                             │ sync after each render
                             ▼
                    ┌──────────────────┐
                    │   Ref Copy       │ ←── Used by game loop & callbacks
                    │   (useRef)       │
                    └──────────────────┘
```

- **Render path** reads `game` (React state) — triggers re-renders when state changes.
- **Game logic path** reads `gameRef.current` (ref) — always has latest data, no stale closures.
- **Sync**: `useEffect(() => { gameRef.current = game })` runs after every render.

This pattern avoids the complexity of having to list all state variables as effect dependencies, which would cause the game loop to restart on every state change.

## Key Concepts Summary

| Hook | Purpose in this project |
|---|---|
| `useState` | Game state and UI state (modal visibility) |
| `useRef` (DOM) | Canvas element references for drawing |
| `useRef` (mutable) | Stale closure prevention via `gameRef` |
| `useRef` (timers) | RAF handle, drop timestamp |
| `useCallback` | Stable function references for effects |
| `useEffect` | Game loop (rAF), keyboard events |
| Cleanup functions | Prevent memory leaks (cancel RAF, remove listeners) |
| Stale closure | Captured outdated state in async callbacks — solved by refs |

## Next

→ [06 — Canvas Rendering](06-canvas-rendering.md)
