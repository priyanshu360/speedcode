# speedcode

A terminal typing tutor that teaches TypeScript through progressive lessons. Type real code with syntax highlighting, live stats, and auto-scrolling — all in your terminal.

## Install

```bash
git clone https://github.com/<your>/speedcode.git
cd speedcode
npm install
```

## Usage

```bash
# Interactive lesson menu (no args)
npm run dev

# Pick a lesson by name
npm run dev -- --lesson interfaces

# Random lesson by difficulty
npm run dev -- --difficulty easy
```

### Controls

| Key | Action |
|-----|--------|
| Type | Enter characters (code to match the task) |
| Backspace | Delete last character |
| Tab | Insert 2 spaces |
| Enter | Newline / confirm task complete |
| Ctrl+C | Exit |

### Features

- **Syntax highlighting** — keywords, strings, numbers, types, and builtins colored as you type
- **Live stats** — real-time WPM and accuracy shown at the bottom of the screen
- **Task accumulation** — completed tasks remain visible below the current one
- **Auto-scroll** — viewport advances as you reach the bottom
- **Interactive menu** — numbered lesson picker when no `--lesson` or `--difficulty` is provided

## Scripts

```bash
npm run dev      # Run the typing tutor
npm run lint     # ESLint check
npm run format   # Prettier format
npm run typecheck # tsc --noEmit
```

## Lessons

| Lesson | Difficulty | Tasks | What you'll learn |
|--------|-----------|-------|-------------------|
| Variables & Types | easy | 6 | annotations, unions, aliases, literals |
| Interfaces | easy | 7 | define, optional, readonly, methods, extends |
| Functions | easy | 6 | params, return, arrow, optional, rest |
| Arrays & Iteration | easy | 6 | map, filter, reduce, find, for-of |
| Classes | medium | 7 | constructor, methods, access, extends |
| Async JavaScript | medium | 6 | promises, async/await, error handling, Promise.all |
| Generics | hard | 6 | identity, constraints, generic class, mapped types |
| Utility Types | hard | 6 | Partial, Pick, Omit, Record, ReturnType, Awaited |
