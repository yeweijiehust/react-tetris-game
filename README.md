# Tetris Game

A classic Tetris game built with React, TypeScript, Canvas, and Vite.

## Features

- **Canvas rendering** — Smooth 60fps game board (300×600px, 10×20 grid)
- **Keyboard controls** — Arrow keys to move/rotate, Space to pause/resume
- **7 standard tetrominoes** — I, O, T, S, Z, J, L with clockwise rotation
- **Ghost piece** — Semi-transparent preview showing landing position
- **Line clearing & scoring** — 100/300/500/800 points per 1/2/3/4 lines, level scales every 10 lines
- **Next piece preview** — Shows upcoming piece
- **History records** — Last 10 games saved to localStorage
- **Bilingual UI** — Toggle between Chinese and English

## Tech Stack

- **React 19** — UI components and state management
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Canvas API** — Game rendering
- **Vitest** — Unit testing (23 tests)

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Controls

| Key | Action |
|---|---|
| ← → | Move left/right |
| ↑ | Rotate clockwise |
| ↓ | Soft drop |
| Space | Pause / Resume |

## Commands

```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run preview     # Preview production build
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
```

## Project Structure

```
src/
├── tetris-logic.ts       # Pure game logic (collision, rotation, line clear, history)
├── tetris-logic.test.ts  # Unit tests (23 tests)
├── TetrisGame.tsx        # Main game component (Canvas + UI + Modal)
├── i18n.ts               # Chinese/English translations
├── App.tsx               # Entry point
├── App.css               # Layout styles
├── test-setup.ts         # Vitest setup
└── main.tsx              # React root
```

## License

MIT
