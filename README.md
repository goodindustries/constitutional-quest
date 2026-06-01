# The Constitutional Quest 🇺🇸💎

A faith-building, kid-friendly treasure-hunt game that teaches the **Declaration of Independence**, the **Constitution**, and how religious freedom enabled the **Restoration of the Church** — built for Family Home Evening, aligned with the First Presidency's invitation to teach the significance of America's founding documents.

**▶️ Play it live:** https://constitutional-quest-lds.netlify.app

## The three quests

1. **The Founding Treasure** (💎 gems) — find truths in the Declaration & Constitution. *"What happened?"*
2. **The Restoration Key** (📜 scrolls) — read the actual scripture words (D&C 101, 98; Mosiah 29; Alma 46; JS-History). *"Why did God care?"*
3. **The Covenant Crown** (👑) — living-prophet teachings on why religious freedom matters now. *"What is freedom for?"*

## Features

- 1–4 players, take turns together, pick an LDS-symbol avatar
- Tap-to-answer (no typing) with scrambled choices — works for little kids
- A "why it matters" doctrinal chain + false-path teaching on every question
- America 250 finale (July 4, 2026) with verified prophet quotes
- Canvas-rendered share cards, fully responsive, runs as a single `index.html`

## Develop

It's one static `index.html` — open it in a browser, that's it. Tests use Puppeteer:

```bash
npm install
node test.mjs                 # runs the full 3-level playthrough headless
```

Pushes to `main` auto-deploy to Netlify via GitHub Actions.

## About

Built by **Reif Tauati** ([thegoodproject.net](https://thegoodproject.net)) for his family's FHE, with a little help from Claude. PRs and ideas welcome. 🙂

*"And for this purpose have I established the Constitution of this land, by the hands of wise men whom I raised up unto this very purpose." — D&C 101:80*
