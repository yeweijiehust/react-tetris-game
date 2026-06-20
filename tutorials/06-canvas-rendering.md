# 06 — Canvas Rendering

## Learning Objectives

- Learn the Canvas 2D drawing API: `fillRect`, `strokeRect`, `fillText`
- Understand how the game board, grid, pieces, and ghost are rendered
- Learn how to create visual depth with highlights and shadows
- Understand the dual-canvas architecture (main board + next piece preview)

## Prerequisites

- Familiarity with React refs (see [05 — React Hooks in Depth](05-react-hooks-in-depth.md))
- Basic understanding of coordinate systems (x, y)

---

## 1. Canvas Setup

The main game canvas is defined in JSX:

```tsx
<canvas
  ref={canvasRef}
  width={CANVAS_W}   // 300 (BOARD_WIDTH * CELL_SIZE)
  height={CANVAS_H}  // 600 (BOARD_HEIGHT * CELL_SIZE)
  className="tetris-canvas"
/>
```

The `width` and `height` attributes set the **internal resolution** of the canvas (not CSS size). `CANVAS_W = 10 × 30 = 300` and `CANVAS_H = 20 × 30 = 600`.

## 2. The Drawing Pipeline

The `draw` function in `TetrisGame.tsx` (line ~174) runs every animation frame and follows a fixed order:

1. Clear the canvas (fill with background color)
2. Draw grid lines
3. Draw placed pieces (from the board array)
4. Draw ghost piece (semi-transparent)
5. Draw current piece
6. Draw overlays (game over or pause text)

This order ensures correct layering: ghost is below the current piece, overlays are on top.

## 3. Drawing the Background and Grid

```ts
ctx.fillStyle = '#0f0f1a'
ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

ctx.strokeStyle = '#1a1a33'
ctx.lineWidth = 0.5
for (let x = 1; x < BOARD_WIDTH; x++) {
  ctx.beginPath()
  ctx.moveTo(x * CELL_SIZE, 0)
  ctx.lineTo(x * CELL_SIZE, CANVAS_H)
  ctx.stroke()
}
for (let y = 1; y < BOARD_HEIGHT; y++) {
  ctx.beginPath()
  ctx.moveTo(0, y * CELL_SIZE)
  ctx.lineTo(CANVAS_W, y * CELL_SIZE)
  ctx.stroke()
}
```

**Why draw grid lines manually?** The canvas does not have a built-in grid. We draw thin vertical and horizontal lines at each cell boundary. The lines start at index `1` because the outer border is handled by CSS.

`beginPath()` starts a new path, `moveTo(x, y)` sets the starting point, `lineTo(x, y)` draws to the destination, and `stroke()` renders the path.

## 4. Drawing Placed Pieces

```ts
for (let r = 0; r < BOARD_HEIGHT; r++) {
  for (let c = 0; c < BOARD_WIDTH; c++) {
    if (s.board[r][c]) {
      drawCell(ctx, c, r, COLORS[s.board[r][c]])
    }
  }
}
```

The `COLORS` map converts the stored index (1–7) to a color:

```ts
const COLORS: Record<number, string> = {
  1: '#00f0f0',  // I — cyan
  2: '#f0f000',  // O — yellow
  3: '#a000f0',  // T — purple
  4: '#00f000',  // S — green
  5: '#f00000',  // Z — red
  6: '#0000f0',  // J — blue
  7: '#f0a000',  // L — orange
}
```

## 5. The `drawCell` Function — Adding Depth

```ts
const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, ghost = false) => {
  const px = x * CELL_SIZE  // pixel position
  const py = y * CELL_SIZE

  if (ghost) {
    ctx.fillStyle = color + '30'  // 30 = 19% opacity hex
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
    ctx.strokeStyle = color + '60'
    ctx.lineWidth = 1
    ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
  } else {
    ctx.fillStyle = color
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)

    // Top-left highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, 4)
    ctx.fillRect(px + 1, py + 1, 4, CELL_SIZE - 2)

    // Bottom-right shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(px + 1, py + CELL_SIZE - 5, CELL_SIZE - 2, 4)
    ctx.fillRect(px + CELL_SIZE - 5, py + 1, 4, CELL_SIZE - 2)
  }
}
```

**Why `px + 1, CELL_SIZE - 2`?** Drawing with a 1px inset creates a small gap between cells, visually separating them.

**Ghost rendering** uses hex alpha notation (`#RRGGBBAA`), which is supported in modern browsers. The ghost is semi-transparent and has only a border outline instead of filled color.

**Highlights and shadows** create a 3D "beveled" effect:
- White overlay on top and left edges simulates light from above-left.
- Dark overlay on bottom and right edges simulates shadow.
- This makes each block look slightly raised.

## 6. Drawing the Current Piece and Ghost

```ts
if (s.currentPiece) {
  const ghostY = getGhostY(s.board, s.currentPiece)
  const ghostPiece = movePiece(s.currentPiece, 0, ghostY - s.currentPiece.pos.y)
  drawPiece(ctx, ghostPiece, true)  // ghost = true (semi-transparent)
  drawPiece(ctx, s.currentPiece, false)  // ghost = false (solid)
}
```

The ghost is drawn **first** so it appears below the current piece.

The `drawPiece` function iterates over the piece matrix:

```ts
const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, ghost: boolean) => {
  const colorIndex = PIECE_TYPES.indexOf(piece.type) + 1
  const color = COLORS[colorIndex]
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        drawCell(ctx, piece.pos.x + c, piece.pos.y + r, color, ghost)
      }
    }
  }
}
```

## 7. Overlays (Pause / Game Over)

```ts
if (s.status === 'gameover') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)  // dark overlay
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2)  // centered text
}
```

- A semi-transparent black overlay is drawn over the entire canvas.
- Text is centered using `textAlign = 'center'` and positioned at `CANVAS_W / 2, CANVAS_H / 2`.
- The pause overlay follows the same pattern with localized text via `t('pause')`.

## 8. Next Piece Preview Canvas

A second, smaller canvas displays the upcoming piece:

```tsx
<canvas ref={previewRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="next-canvas" />
```

Where `PREVIEW_SIZE = 4 * CELL_SIZE = 120px` (large enough to fit a 4×4 I piece).

In the draw function:

```ts
const pctx = previewRef.current?.getContext('2d')
if (pctx && s.nextPiece) {
  pctx.fillStyle = '#0f0f1a'
  pctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

  const shape = s.nextPiece.shape
  const rows = shape.length
  const cols = shape[0].length
  const offsetX = (PREVIEW_SIZE - cols * CELL_SIZE) / 2
  const offsetY = (PREVIEW_SIZE - rows * CELL_SIZE) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) {
        const px = offsetX + c * CELL_SIZE
        const py = offsetY + r * CELL_SIZE
        pctx.fillStyle = color
        pctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
    }
  }
}
```

The offsets center the piece within the preview canvas. For example, a 2×2 O piece gets `offsetX = (120 - 60) / 2 = 30`.

## Key Concepts Summary

| Concept | Description |
|---|---|
| Canvas resolution | Set via `width`/`height` attributes, not CSS |
| Layering order | Background → Grid → Board → Ghost → Current piece → Overlays |
| `fillRect(x, y, w, h)` | Draws a filled rectangle at pixel position |
| `strokeRect(x, y, w, h)` | Draws a rectangle outline |
| Hex alpha | `#RRGGBBAA` for semi-transparent colors |
| Highlight/shadow | Small white/dark rectangles create 3D bevel effect |
| Text rendering | `font`, `textAlign`, `fillText` for overlays |
| Dual canvases | Main game board + separate preview for next piece |

## Next

→ [07 — Game Loop and Keyboard Controls](07-game-loop-and-keyboard.md)
