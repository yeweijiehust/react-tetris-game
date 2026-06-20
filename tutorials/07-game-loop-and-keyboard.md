# 07 — Game Loop and Keyboard Controls

## Learning Objectives

- Understand how `requestAnimationFrame` drives the game loop
- Learn how drop timing works with level-based intervals
- Understand keyboard event handling for real-time controls
- Learn why `e.preventDefault()` is needed for game keys

## Prerequisites

- Understanding of `useEffect` and refs (see [05 — React Hooks in Depth](05-react-hooks-in-depth.md))
- Familiarity with Canvas rendering (see [06 — Canvas Rendering](06-canvas-rendering.md))

---

## 1. Why `requestAnimationFrame`?

The game loop in `TetrisGame.tsx` uses `requestAnimationFrame` (rAF):

```ts
useEffect(() => {
  const loop = (time: number) => {
    // ... game logic and drawing ...
    animRef.current = requestAnimationFrame(loop)
  }
  animRef.current = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(animRef.current)
}, [dropPiece, draw])
```

**Why not `setInterval`?**

| | `setInterval` | `requestAnimationFrame` |
|---|---|---|
| Timing | Fixed interval, regardless of frame rate | Syncs with display refresh rate (usually 60fps) |
| Tab behavior | Continues running in background | Pauses when tab is inactive |
| Precision | Drifts over time | Provides high-precision timestamp |
| Battery | Wakes CPU unnecessarily | Optimized by browser |

**`requestAnimationFrame` passes a `time` parameter** (a `DOMHighResTimeStamp` in milliseconds) which is used for drop interval calculations.

## 2. The Drop Timer

```ts
const lastDropRef = useRef(0)  // timestamp of the last drop

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
```

**How it works:**

1. `lastDropRef.current` stores the timestamp when the last drop occurred.
2. On each frame, we check how much time has elapsed: `time - lastDropRef.current`.
3. If the elapsed time exceeds the current level's interval, we call `dropPiece()` and reset the timer.
4. The draw function runs every frame regardless of whether a drop occurred.

This is more precise than `setInterval` because it uses the rAF timestamp rather than counting callbacks.

## 3. Level-Based Speed

```ts
export function getDropInterval(level: number): number {
  return Math.max(50, 1000 - (level - 1) * 80)
}
```

- Level 1: `1000ms` (1 second between drops)
- Level 5: `1000 - 4 * 80 = 680ms`
- Level 10: `1000 - 9 * 80 = 280ms`
- Level 13 and above: `50ms` (minimum, clamped by `Math.max`)

The level increases every 10 lines cleared:

```ts
const newLevel = Math.floor(newLines / 10) + 1
```

## 4. The Drop Action

```ts
const dropPiece = useCallback(() => {
  const s = gameRef.current
  if (s.status !== 'playing' || !s.currentPiece) return

  const moved = movePiece(s.currentPiece, 0, 1)  // one step down
  if (!isCollision(s.board, moved)) {
    // Can move down — update state
    const next = { ...s, currentPiece: moved }
    gameRef.current = next
    setGame(next)
    return
  }

  // Cannot move down — lock the piece
  lockPiece(s.currentPiece)
}, [lockPiece])
```

This is the **soft drop** — one cell per tick. If the piece can move down, it moves. If not, it locks.

## 5. Hard Drop (Not Implemented)

This project does not implement a hard drop key. In standard Tetris, a hard drop instantly places the piece at the ghost position. The `hardDrop` function would look like:

```ts
function hardDrop() {
  const s = gameRef.current
  const ghostY = getGhostY(s.board, s.currentPiece)
  const dropped = movePiece(s.currentPiece, 0, ghostY - s.currentPiece.pos.y)
  lockPiece(dropped)
}
```

## 6. Keyboard Event Handling

```ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const s = gameRef.current
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault()
        moveLeft()
        break
      case 'ArrowRight':
        e.preventDefault()
        moveRight()
        break
      case 'ArrowDown':
        e.preventDefault()
        moveDown()
        break
      case 'ArrowUp':
        e.preventDefault()
        rotate()
        break
      case 'Space':
        e.preventDefault()
        if (s.status === 'playing' || s.status === 'paused') {
          togglePause()
        }
        break
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [moveLeft, moveRight, moveDown, rotate, togglePause])
```

### Why `e.preventDefault()`?

Arrow keys and Space have default browser behaviors:

- **Arrow keys** scroll the page.
- **Space** scrolls down by one page.

`preventDefault()` stops these behaviors, ensuring the game responds to keys without the page jumping.

### Why `e.code` Instead of `e.key`?

- `e.code` returns the physical key on the keyboard (e.g., `'ArrowLeft'` for both left arrow keys).
- `e.key` returns the character produced (which changes with keyboard layout and modifier keys).

For games, `e.code` is preferred because it maps to physical position, not character.

### Why `window.addEventListener` Instead of `onKeyDown` Prop?

Attaching the listener to `window` ensures key events are captured regardless of which element has focus. Adding it via `addEventListener` (rather than an `onKeyDown` prop on a div) gives cleaner separation and avoids React's synthetic event system for performance.

## 7. Pausing Resets the Drop Timer

When the game resumes from pause, `lastDropRef.current` is reset to `performance.now()`:

```ts
const togglePause = useCallback(() => {
  const s = gameRef.current
  if (s.status === 'playing') {
    setGame({ ...s, status: 'paused' })
  } else if (s.status === 'paused') {
    setGame({ ...s, status: 'playing' })
    lastDropRef.current = performance.now()  // prevent immediate drop
  }
}, [])
```

Without this reset, the accumulated pause time would cause an immediate drop when resuming.

## Key Concepts Summary

| Concept | Description |
|---|---|
| `requestAnimationFrame` | Browser API for frame-synced animations, pauses when tab is inactive |
| Drop interval | Calculated from level: `Math.max(50, 1000 - (level-1) * 80)` |
| `e.preventDefault()` | Prevents browser default behavior for game keys |
| `e.code` vs `e.key` | `e.code` maps to physical key position, preferred for games |
| Window listener | Ensures key capture regardless of focus |
| Timer reset on resume | Prevents accumulated pause time from causing instant drops |

## Next

→ [08 — State Machine and Game Actions](08-state-machine-and-game-actions.md)
