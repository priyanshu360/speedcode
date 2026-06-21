# speedcode

A terminal typing tutor that teaches TypeScript through progressive lessons. Type real code with inline comments that explain each concept as you go.

## Install

```bash
git clone https://github.com/<your>/speedcode.git
cd speedcode
npm install
```

## Usage

```bash
# Pick a lesson by name
npm run dev -- --lesson interfaces

# Filter by difficulty (easy | medium | hard)
npm run dev -- --difficulty easy

# Partial names work too
npm run dev -- --lesson async
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
