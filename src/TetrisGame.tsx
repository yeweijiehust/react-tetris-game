import { useState, useRef, useCallback, useEffect } from 'react'
import {
  createBoard,
  createPiece,
  randomPieceType,
  rotatePiece,
  movePiece,
  isCollision,
  placePiece,
  clearLines,
  calculateScore,
  getGhostY,
  getDropInterval,
  addHistory,
  getHistory,
  clearHistory as clearHistoryStorage,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  PIECE_TYPES,
  type HistoryRecord,
  type Piece,
} from './tetris-logic'
import { useI18n } from './i18n'

type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'

interface GameState {
  board: number[][]
  currentPiece: Piece | null
  nextPiece: Piece | null
  score: number
  level: number
  lines: number
  status: GameStatus
}

const COLORS: Record<number, string> = {
  1: '#00f0f0',
  2: '#f0f000',
  3: '#a000f0',
  4: '#00f000',
  5: '#f00000',
  6: '#0000f0',
  7: '#f0a000',
}

const CANVAS_W = BOARD_WIDTH * CELL_SIZE
const CANVAS_H = BOARD_HEIGHT * CELL_SIZE
const PREVIEW_SIZE = 4 * CELL_SIZE

function initialState(): GameState {
  return {
    board: createBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    status: 'idle',
  }
}

export default function TetrisGame() {
  const { lang, t, toggleLang } = useI18n()
  const [game, setGame] = useState<GameState>(initialState)
  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const lastDropRef = useRef(0)
  const [showHistory, setShowHistory] = useState(false)

  const lockPiece = useCallback((piece: Piece) => {
    const s = gameRef.current
    const newBoard = placePiece(s.board, piece)
    const { board: clearedBoard, linesCleared } = clearLines(newBoard)

    const newLines = s.lines + linesCleared
    const newLevel = Math.floor(newLines / 10) + 1
    const newScore = s.score + calculateScore(linesCleared, s.level)

    const newCurrent = s.nextPiece!
    const newNext = createPiece(randomPieceType())

    if (isCollision(clearedBoard, newCurrent)) {
      addHistory({ score: newScore, lines: newLines, level: newLevel, duration: 0 })
      const next = {
        ...s,
        board: clearedBoard,
        currentPiece: newCurrent,
        score: newScore,
        lines: newLines,
        level: newLevel,
        status: 'gameover' as GameStatus,
      }
      gameRef.current = next
      setGame(next)
      return
    }

    const next = {
      ...s,
      board: clearedBoard,
      currentPiece: newCurrent,
      nextPiece: newNext,
      score: newScore,
      lines: newLines,
      level: newLevel,
    }
    gameRef.current = next
    setGame(next)
  }, [])

  const startGame = useCallback(() => {
    const board = createBoard()
    const current = createPiece(randomPieceType())
    const next = createPiece(randomPieceType())
    const newState: GameState = {
      board,
      currentPiece: current,
      nextPiece: next,
      score: 0,
      level: 1,
      lines: 0,
      status: 'playing',
    }
    gameRef.current = newState
    setGame(newState)
    lastDropRef.current = performance.now()
  }, [])

  const togglePause = useCallback(() => {
    const s = gameRef.current
    if (s.status === 'playing') {
      const next = { ...s, status: 'paused' as GameStatus }
      gameRef.current = next
      setGame(next)
    } else if (s.status === 'paused') {
      const next = { ...s, status: 'playing' as GameStatus }
      gameRef.current = next
      setGame(next)
      lastDropRef.current = performance.now()
    }
  }, [])

  const dropPiece = useCallback(() => {
    const s = gameRef.current
    if (s.status !== 'playing' || !s.currentPiece) return
    const moved = movePiece(s.currentPiece, 0, 1)
    if (!isCollision(s.board, moved)) {
      const next = { ...s, currentPiece: moved }
      gameRef.current = next
      setGame(next)
      return
    }
    lockPiece(s.currentPiece)
  }, [lockPiece])

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

  const moveRight = useCallback(() => {
    const s = gameRef.current
    if (s.status !== 'playing' || !s.currentPiece) return
    const moved = movePiece(s.currentPiece, 1, 0)
    if (!isCollision(s.board, moved)) {
      const next = { ...s, currentPiece: moved }
      gameRef.current = next
      setGame(next)
    }
  }, [])

  const moveDown = useCallback(() => {
    const s = gameRef.current
    if (s.status !== 'playing' || !s.currentPiece) return
    const moved = movePiece(s.currentPiece, 0, 1)
    if (!isCollision(s.board, moved)) {
      const next = { ...s, currentPiece: moved }
      gameRef.current = next
      setGame(next)
    }
  }, [])

  const rotate = useCallback(() => {
    const s = gameRef.current
    if (s.status !== 'playing' || !s.currentPiece) return
    const rotated = rotatePiece(s.currentPiece)
    if (!isCollision(s.board, rotated)) {
      const next = { ...s, currentPiece: rotated }
      gameRef.current = next
      setGame(next)
    }
  }, [])

  const drawCell = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    ghost = false,
  ) => {
    const px = x * CELL_SIZE
    const py = y * CELL_SIZE
    if (ghost) {
      ctx.fillStyle = color + '30'
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      ctx.strokeStyle = color + '60'
      ctx.lineWidth = 1
      ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
    } else {
      ctx.fillStyle = color
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, 4)
      ctx.fillRect(px + 1, py + 1, 4, CELL_SIZE - 2)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(px + 1, py + CELL_SIZE - 5, CELL_SIZE - 2, 4)
      ctx.fillRect(px + CELL_SIZE - 5, py + 1, 4, CELL_SIZE - 2)
    }
  }, [])

  const drawPiece = useCallback((
    ctx: CanvasRenderingContext2D,
    piece: Piece,
    ghost: boolean,
  ) => {
    const colorIndex = PIECE_TYPES.indexOf(piece.type) + 1
    const color = COLORS[colorIndex]
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          drawCell(ctx, piece.pos.x + c, piece.pos.y + r, color, ghost)
        }
      }
    }
  }, [drawCell])

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const s = gameRef.current

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

    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        if (s.board[r][c]) {
          drawCell(ctx, c, r, COLORS[s.board[r][c]])
        }
      }
    }

    if (s.currentPiece) {
      const ghostY = getGhostY(s.board, s.currentPiece)
      const ghostPiece = movePiece(s.currentPiece, 0, ghostY - s.currentPiece.pos.y)
      drawPiece(ctx, ghostPiece, true)
      drawPiece(ctx, s.currentPiece, false)
    }

    if (s.status === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 28px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2)
    }

    if (s.status === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 28px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(t('pause').toUpperCase(), CANVAS_W / 2, CANVAS_H / 2)
    }

    const pctx = previewRef.current?.getContext('2d')
    if (pctx && s.nextPiece) {
      pctx.fillStyle = '#0f0f1a'
      pctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
      const colorIndex = PIECE_TYPES.indexOf(s.nextPiece.type) + 1
      const color = COLORS[colorIndex]
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
  }, [drawCell, drawPiece, t])

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

  const history = getHistory()

  return (
    <div className="tetris-container">
      <div className="tetris-header">
        <h1 className="tetris-title">{t('title')}</h1>
        <button className="lang-btn" onClick={toggleLang}>
          {lang === 'zh' ? 'English' : '中文'}
        </button>
      </div>

      <div className="tetris-main">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="tetris-canvas"
        />

        <div className="tetris-sidebar">
          <div className="tetris-info">
            <div className="info-row">
              <span className="info-label">{t('score')}</span>
              <span className="info-value">{game.score}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('level')}</span>
              <span className="info-value">{game.level}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('lines')}</span>
              <span className="info-value">{game.lines}</span>
            </div>
          </div>

          <div className="tetris-next">
            <span className="next-label">{t('next')}</span>
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="next-canvas"
            />
          </div>

          <div className="tetris-buttons">
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
            <button className="game-btn" onClick={() => setShowHistory(true)}>
              {t('history')}
            </button>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('history')}</h2>
              <button className="close-btn" onClick={() => setShowHistory(false)}>
                ✕
              </button>
            </div>

            {history.length === 0 ? (
              <p className="empty-history">{t('noHistory')}</p>
            ) : (
              <>
                <div className="history-list">
                  {history.map((h: HistoryRecord) => (
                    <div key={h.id} className="history-item">
                      <span className="history-score">
                        {h.score} {t('scoreLabel')}
                      </span>
                      <span className="history-detail">
                        {t('level')} {h.level} &middot; {h.lines} {t('lines')}
                      </span>
                      <span className="history-date">
                        {new Date(h.date).toLocaleDateString(
                          lang === 'zh' ? 'zh-CN' : 'en-US',
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className="game-btn clear-btn"
                  onClick={() => {
                    clearHistoryStorage()
                    setGame(g => ({ ...g }))
                  }}
                >
                  {t('clearHistory')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
