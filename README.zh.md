# 俄罗斯方块

一款基于 React + TypeScript + Canvas + Vite 构建的经典俄罗斯方块游戏。

## 功能特性

- **Canvas 渲染** — 60fps 流畅游戏画面（300×600px，10×20 网格）
- **键盘控制** — 方向键移动/旋转，空格暂停/继续
- **7 种标准方块** — I、O、T、S、Z、J、L，支持顺时针旋转
- **幽灵方块** — 半透明预览显示方块落点位置
- **消行计分** — 消 1/2/3/4 行分别得 100/300/500/800 分，每 10 行升一级
- **下一个方块预览** — 显示即将落下的方块
- **历史记录** — 最近 10 局记录保存至 localStorage
- **中英文切换** — 一键切换界面语言

## 技术栈

- **React 19** — UI 组件与状态管理
- **TypeScript** — 类型安全
- **Vite** — 构建工具与开发服务器
- **Canvas API** — 游戏画面渲染
- **Vitest** — 单元测试（23 个测试用例）

## 快速开始

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

## 操作说明

| 按键 | 功能 |
|---|---|
| ← → | 左右移动 |
| ↑ | 顺时针旋转 |
| ↓ | 加速下落 |
| 空格 | 暂停 / 继续 |

## 命令

```bash
npm run dev         # 启动开发服务器
npm run build       # 生产构建
npm run preview     # 预览生产构建
npm test            # 运行测试
npm run test:watch  # 监听模式运行测试
npm run lint        # 运行 ESLint
```

## 项目结构

```
src/
├── tetris-logic.ts       # 纯游戏逻辑（碰撞检测、旋转、消行、历史记录）
├── tetris-logic.test.ts  # 单元测试（23 个测试用例）
├── TetrisGame.tsx        # 游戏主组件（Canvas + UI + 弹窗）
├── i18n.ts               # 中英文翻译
├── App.tsx               # 入口文件
├── App.css               # 布局样式
├── test-setup.ts         # Vitest 配置
└── main.tsx              # React 根节点
```

## 许可

MIT
