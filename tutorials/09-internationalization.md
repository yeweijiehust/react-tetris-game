# 09 — Internationalization

## Learning Objectives

- Understand how custom React hooks encapsulate cross-cutting concerns
- Learn a lightweight i18n pattern without external libraries
- Compare the hook approach with React Context for i18n

## Prerequisites

- Understanding of custom hooks (see [05 — React Hooks in Depth](05-react-hooks-in-depth.md))
- Basic JavaScript object manipulation

---

Open `src/i18n.ts`. This file implements a custom `useI18n` hook that provides translation without any external library.

## 1. The Data Structure

```ts
type Lang = 'zh' | 'en'

const messages: Record<Lang, Record<string, string>> = {
  zh: {
    title: '俄罗斯方块',
    start: '开始游戏',
    pause: '暂停',
    score: '分数',
    level: '等级',
    lines: '行数',
    next: '下一个',
    gameOver: '游戏结束',
    history: '历史记录',
    noHistory: '暂无历史记录',
    close: '关闭',
    scoreLabel: '分',
    // ...
  },
  en: {
    title: 'Tetris',
    start: 'Start Game',
    pause: 'Pause',
    score: 'Score',
    level: 'Level',
    lines: 'Lines',
    next: 'Next',
    gameOver: 'Game Over',
    history: 'History',
    noHistory: 'No history',
    close: 'Close',
    scoreLabel: 'pts',
    // ...
  },
}
```

This is a nested `Record`: the outer key is the language, the inner key is the message ID, and the value is the translated string. TypeScript ensures that both languages have the same keys.

## 2. The Hook

```ts
export function useI18n(defaultLang: Lang = 'zh') {
  const [lang, setLang] = useState<Lang>(defaultLang)

  const t = useCallback((key: string) => messages[lang][key] ?? key, [lang])

  const toggleLang = useCallback(
    () => setLang(l => (l === 'zh' ? 'en' : 'zh')),
    [],
  )

  return { lang, t, toggleLang }
}
```

### `lang` State

Stores the current language. `useState<Lang>` ensures only `'zh'` or `'en'` can be assigned.

### `t(key)` — The Translation Function

```ts
const t = useCallback((key: string) => messages[lang][key] ?? key, [lang])
```

- `messages[lang][key]` looks up the translation.
- `?? key` provides a **fallback**: if the key doesn't exist in the dictionary, the key itself is displayed. This prevents blank UI for missing translations.
- `useCallback` with `[lang]` dependency ensures a new `t` function is created only when the language changes. This is important because `t` is used in the `draw` function's dependency array.

### `toggleLang()` — Language Switch

```tsx
<button className="lang-btn" onClick={toggleLang}>
  {lang === 'zh' ? 'English' : '中文'}
</button>
```

Toggles between languages. The button text itself is not translated — it always shows the opposite language name so the user knows what they'll switch to.

## 3. Usage in the Component

```tsx
const { lang, t, toggleLang } = useI18n()

// In JSX:
<span className="info-label">{t('score')}</span>
<span className="info-value">{game.score}</span>

// In Canvas:
ctx.fillText(t('pause').toUpperCase(), CANVAS_W / 2, CANVAS_H / 2)
```

The `t` function returns the translated string for the current language.

## 4. Fallback Behavior

If a key is missing from the `messages` dictionary, `t(key)` returns the key itself. For example, `t('nonexistent')` returns `'nonexistent'`.

This is useful during development — you can add new UI strings and see the key names directly, then add translations later.

## 5. Why Not React Context?

An alternative approach is React Context:

```tsx
const I18nContext = createContext({ t: (key: string) => key })

function App() {
  const i18n = useI18n()
  return (
    <I18nContext.Provider value={i18n}>
      <TetrisGame />
    </I18nContext.Provider>
  )
}
```

**When to use Context:**

- Multiple components need translations (the hook approach requires each component to call `useI18n()`).
- Deep component trees where prop drilling would be painful.

**When the hook approach is sufficient:**

- Only one component (the game) needs translations.
- Simpler setup, no wrapper components, easier to understand.
- Better performance (no context re-renders for unrelated state changes).

For this project, the hook approach is the right choice.

## 6. How the Button Shows the Language

```tsx
<button className="lang-btn" onClick={toggleLang}>
  {lang === 'zh' ? 'English' : '中文'}
</button>
```

This is a clever UX pattern: the button always shows the language you'll switch **to**, not the current language. For example, when viewing Chinese UI, the button says "English".

## Key Concepts Summary

| Concept | Description |
|---|---|
| Custom hook | `useI18n` encapsulates all i18n logic |
| Dictionary pattern | `Record<Lang, Record<string, string>>` with nested keys |
| Fallback | `?? key` displays the key itself if translation is missing |
| `useCallback` with dep | `t` is recreated only when `lang` changes |
| Hook vs Context | Hook is simpler for single-component usage |

## Next

→ [10 — Styling and Modal Pattern](10-styling-and-modal-pattern.md)
