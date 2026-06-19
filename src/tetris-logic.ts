export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Piece {
  type: PieceType
  shape: number[][]
  pos: { x: number; y: number }
}

export interface HistoryRecord {
  id: string
  score: number
  lines: number
  level: number
  date: string
  duration: number
}

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const CELL_SIZE = 30

export const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

const SHAPES: Record<PieceType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
}

export function createBoard(): number[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
}

export function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
}

export function createPiece(type: PieceType): Piece {
  const shape = SHAPES[type].map(r => [...r])
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2)
  return { type, shape, pos: { x, y: 0 } }
}

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

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, pos: { x: piece.pos.x + dx, y: piece.pos.y + dy } }
}

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

export function clearLines(board: number[][]): { board: number[][]; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => !cell))
  const linesCleared = BOARD_HEIGHT - newBoard.length
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0))
  }
  return { board: newBoard, linesCleared }
}

export function calculateScore(linesCleared: number, level: number): number {
  const points = [0, 100, 300, 500, 800]
  return (points[linesCleared] ?? 0) * level
}

export function getGhostY(board: number[][], piece: Piece): number {
  let ghostY = piece.pos.y
  while (!isCollision(board, movePiece(piece, 0, ghostY - piece.pos.y + 1))) {
    ghostY++
  }
  return ghostY
}

export function getDropInterval(level: number): number {
  return Math.max(50, 1000 - (level - 1) * 80)
}

const HISTORY_KEY = 'tetris-history'
const MAX_HISTORY = 10

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

export function getHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}
