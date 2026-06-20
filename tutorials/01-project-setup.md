# 01 — Project Setup

## Learning Objectives

- Understand how a Vite + React + TypeScript project is scaffolded
- Learn the role of each configuration file in the project
- Be able to run the development server and build the project

## Prerequisites

- Basic familiarity with the command line
- Node.js (v18 or later) and npm installed on your machine

---

## Step 1: Scaffolding the Project

Our project was created using Vite's official scaffolding command:

`ash
npm create vite@latest tetris-game -- --template react-ts
`

This generates a minimal but fully functional React + TypeScript project. Let's walk through each file that was generated.

## Step 2: Understanding the Configuration Files

### package.json

Open package.json at the project root. This is the manifest for your project.

**Key sections:**

- **	ype: "module"** — tells Node.js that all .js files in the project use ES Module syntax (import/export) rather than CommonJS (equire/module.exports).
- **scripts** — four commands are defined:
  - dev — starts the Vite dev server with hot module replacement (HMR)
  - uild — runs TypeScript type-checking (	sc -b) followed by Vite bundling
  - lint — runs ESLint across the entire project
  - preview — serves the production build locally for verification
- **dependencies** — only eact and eact-dom at runtime. Everything else is a dev dependency.
- **devDependencies** — includes Vite, TypeScript, ESLint, Vitest, and their respective plugins and type definitions.

### ite.config.ts

Open ite.config.ts. This file configures both Vite (the bundler) and Vitest (the test runner) in a single place.

`	s
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
`

- plugins: [react()] — enables JSX transform and React Fast Refresh during development.
- The 	est block is Vitest-specific:
  - globals: true — allows using describe, it, expect without importing them in test files.
  - environment: 'jsdom' — provides a browser-like DOM in Node.js for testing React components.
  - setupFiles — points to a script that runs before each test file.

### 	sconfig.json, 	sconfig.app.json, 	sconfig.node.json

TypeScript configuration is split across three files:

- **	sconfig.json** — the root config that references the other two.
- **	sconfig.app.json** — configures TypeScript for the application source code (src/).
- **	sconfig.node.json** — configures TypeScript for Node-side files like ite.config.ts.

Open 	sconfig.app.json. Notable settings:

`json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true
  },
  "include": ["src"]
}
`

Key settings explained:

- **	arget: "es2023"** — TypeScript will assume the runtime supports all ES2023 features. Vite handles transpilation for older browsers anyway.
- **lib: ["ES2023", "DOM"]** — includes type definitions for ES2023 standard library and browser DOM APIs (like localStorage, CanvasRenderingContext2D).
- **moduleResolution: "bundler"** — tells TypeScript to use a resolution algorithm compatible with bundlers like Vite.
- **erbatimModuleSyntax: true** — TypeScript will preserve the exact module syntax in output. This means you must use import type for type-only imports.
- **erasableSyntaxOnly: true** — only allows TypeScript syntax that can be cleanly erased (no enum, no 
amespace). This is a TypeScript 6 feature.
- **
oEmit: true** — TypeScript only type-checks; it does not produce output files. Vite handles all transpilation and bundling.
- **jsx: "react-jsx"** — uses the React 17+ JSX transform, meaning you don't need import React from 'react' in every file.
- **
oUnusedLocals and 
oUnusedParameters** — catch dead code at compile time.

### index.html

Open index.html. This is the entry point of the application. Unlike a traditional React app where index.html lives in a public/ folder, Vite places it at the root.

`html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tetris-game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

- <div id="root"> — the DOM element where React mounts the application.
- <script type="module" src="/src/main.tsx"> — Vite processes this as an ES module entry point. It automatically resolves .tsx extensions and handles TypeScript transpilation.

## Step 3: The Source Entry Point

Open src/main.tsx:

`	sx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

- createRoot — the React 19 API for mounting. It replaces the older ReactDOM.render.
- StrictMode — a development-only wrapper that double-invokes effects and state updaters to help catch bugs.
- The ! (non-null assertion) tells TypeScript that getElementById('root') will not return 
ull.

## Step 4: Running the Project

`ash
npm install      # already done in the scaffolded project
npm run dev      # starts dev server on http://localhost:5173
npm run build    # production build → outputs to dist/
`

## Key Concepts Summary

| Concept | Explanation |
|---|---|
| Vite | A fast build tool that uses native ES modules in development and Rollup for production bundling |
| tsconfig | TypeScript compiler options — controls type-checking strictness, module resolution, and JSX handling |
| verbatimModuleSyntax | Requires explicit import type for type-only imports, ensuring bundlers can safely tree-shake |
| HMR | Hot Module Replacement — updates modules in the browser without a full page reload |
| ESM | ES Modules — the standard JavaScript module system using import/export |

## Next

→ [02 — TypeScript Crash Course](02-typescript-crash-course.md)
