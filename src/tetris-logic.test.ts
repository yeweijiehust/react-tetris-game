import { describe, it, expect, beforeEach } from 'vitest'
import {
  createBoard,
  createPiece,
  rotatePiece,
  movePiece,
  isCollision,
  placePiece,
  clearLines,
  calculateScore,
  getGhostY,
  getHistory,
  addHistory,
  clearHistory,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  type PieceType,
} from './tetris-logic'

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

  it('detects left wall collision', () => {
    const board = createBoard()
    const piece = createPiece('T')
    const moved = movePiece(piece, -10, 0)
    expect(isCollision(board, moved)).toBe(true)
  })

  it('detects right wall collision', () => {
    const board = createBoard()
    const piece = createPiece('O')
    const moved = movePiece(piece, 10, 0)
    expect(isCollision(board, moved)).toBe(true)
  })

  it('detects floor collision', () => {
    const board = createBoard()
    const piece = createPiece('I')
    const moved = movePiece(piece, 0, BOARD_HEIGHT)
    expect(isCollision(board, moved)).toBe(true)
  })

  it('detects collision with placed piece', () => {
    const board = createBoard()
    board[5][5] = 1
    const piece = createPiece('O')
    const withPos = { ...piece, pos: { x: 4, y: 4 } }
    expect(isCollision(board, withPos)).toBe(true)
  })

  it('allows valid position', () => {
    const board = createBoard()
    const piece = createPiece('T')
    expect(isCollision(board, piece)).toBe(false)
  })

  it('places piece on board', () => {
    const board = createBoard()
    const piece = createPiece('O')
    const placed = placePiece(board, piece)
    const hasNonZero = placed.some(r => r.some(c => c !== 0))
    expect(hasNonZero).toBe(true)
  })

  it('clears full lines and shifts board', () => {
    const board = createBoard()
    const fullRow = Array(BOARD_WIDTH).fill(1)
    board[BOARD_HEIGHT - 1] = [...fullRow]
    board[BOARD_HEIGHT - 2] = [...fullRow]
    const result = clearLines(board)
    expect(result.linesCleared).toBe(2)
    expect(result.board[BOARD_HEIGHT - 1].every(c => c === 0)).toBe(true)
    expect(result.board[BOARD_HEIGHT - 2].every(c => c === 0)).toBe(true)
  })

  it('does not clear incomplete lines', () => {
    const board = createBoard()
    board[BOARD_HEIGHT - 1] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    const result = clearLines(board)
    expect(result.linesCleared).toBe(0)
  })
})

describe('pieces', () => {
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

  it('creates all 7 piece types', () => {
    for (const type of types) {
      const piece = createPiece(type)
      expect(piece.type).toBe(type)
      expect(piece.shape.length).toBeGreaterThan(0)
      expect(piece.shape[0].length).toBeGreaterThan(0)
    }
  })

  it('rotates T piece clockwise', () => {
    const piece = createPiece('T')
    const rotated = rotatePiece(piece)
    expect(rotated.shape[0][1]).toBe(1)
    expect(rotated.shape[1][1]).toBe(1)
    expect(rotated.shape[1][2]).toBe(1)
    expect(rotated.shape[2][1]).toBe(1)
  })

  it('moves piece by given offset', () => {
    const piece = createPiece('T')
    const moved = movePiece(piece, 2, 3)
    expect(moved.pos.x).toBe(piece.pos.x + 2)
    expect(moved.pos.y).toBe(piece.pos.y + 3)
  })

  it('4 rotations return to original shape', () => {
    const piece = createPiece('S')
    let p = piece
    for (let i = 0; i < 4; i++) p = rotatePiece(p)
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        expect(p.shape[r][c]).toBe(piece.shape[r][c])
      }
    }
  })
})

describe('score', () => {
  it('single line at level 1', () => {
    expect(calculateScore(1, 1)).toBe(100)
  })

  it('double line', () => {
    expect(calculateScore(2, 1)).toBe(300)
  })

  it('triple line', () => {
    expect(calculateScore(3, 1)).toBe(500)
  })

  it('tetris (4 lines)', () => {
    expect(calculateScore(4, 1)).toBe(800)
  })

  it('scales with level', () => {
    expect(calculateScore(1, 3)).toBe(300)
    expect(calculateScore(4, 5)).toBe(4000)
  })
})

describe('ghost', () => {
  it('returns ghost position at or below current position', () => {
    const board = createBoard()
    const piece = createPiece('I')
    const ghostY = getGhostY(board, piece)
    expect(ghostY).toBeGreaterThanOrEqual(piece.pos.y)
  })

  it('ghost stops above placed piece', () => {
    const board = createBoard()
    for (let c = 0; c < BOARD_WIDTH; c++) {
      board[BOARD_HEIGHT - 3][c] = 1
    }
    const piece = createPiece('I')
    const ghostY = getGhostY(board, piece)
    expect(ghostY).toBe(BOARD_HEIGHT - 5)
  })
})

describe('history', () => {
  it('stores and retrieves history', () => {
    addHistory({ score: 100, lines: 2, level: 1, duration: 30 })
    addHistory({ score: 500, lines: 10, level: 3, duration: 60 })
    const history = getHistory()
    expect(history.length).toBe(2)
    expect(history[0].score).toBe(500)
    expect(history[1].score).toBe(100)
  })

  it('limits to 10 records', () => {
    for (let i = 0; i < 15; i++) {
      addHistory({ score: i * 100, lines: i, level: 1, duration: 10 })
    }
    expect(getHistory().length).toBe(10)
    expect(getHistory()[9].score).toBe(500)
  })

  it('clears all history', () => {
    addHistory({ score: 100, lines: 2, level: 1, duration: 30 })
    clearHistory()
    expect(getHistory()).toEqual([])
  })
})
