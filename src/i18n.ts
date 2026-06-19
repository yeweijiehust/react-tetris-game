import { useState, useCallback } from 'react'

type Lang = 'zh' | 'en'

const messages: Record<Lang, Record<string, string>> = {
  zh: {
    title: '俄罗斯方块',
    start: '开始游戏',
    restart: '重新开始',
    pause: '暂停',
    resume: '继续',
    history: '历史记录',
    score: '分数',
    level: '等级',
    lines: '行数',
    next: '下一个',
    gameOver: '游戏结束',
    noHistory: '暂无历史记录',
    clearHistory: '清空记录',
    date: '时间',
    close: '关闭',
    scoreLabel: '分',
  },
  en: {
    title: 'Tetris',
    start: 'Start Game',
    restart: 'Restart',
    pause: 'Pause',
    resume: 'Resume',
    history: 'History',
    score: 'Score',
    level: 'Level',
    lines: 'Lines',
    next: 'Next',
    gameOver: 'Game Over',
    noHistory: 'No history',
    clearHistory: 'Clear',
    date: 'Date',
    close: 'Close',
    scoreLabel: 'pts',
  },
}

export function useI18n(defaultLang: Lang = 'zh') {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const t = useCallback((key: string) => messages[lang][key] ?? key, [lang])
  const toggleLang = useCallback(() => setLang(l => (l === 'zh' ? 'en' : 'zh')), [])
  return { lang, t, toggleLang }
}
