import process from 'node:process';
import readline from 'node:readline';
import { TextGenerator } from './generator.js';
import { LessonRunner } from './lesson.js';
import { Difficulty, GameState } from './types.js';
import type { Lesson } from './types.js';
import { computeSyntaxColors } from './syntax.js';
import {
  renderActive,
  renderTaskComplete,
  renderLessonComplete,
  captureCompletedTask,
  revealMore,
} from './render.js';

const generator = new TextGenerator('src/lessons');

let runner: LessonRunner;
let text: string;
let lines: string[];
let revealedLines: number;
let syntaxColors: string[] = [];
const completedTaskRenders: string[] = [];

function render(): void {
  if (runner.isLessonComplete) { renderLessonComplete(runner, completedTaskRenders); return; }
  if (runner.game.state === GameState.COMPLETED) { renderTaskComplete(runner, text, syntaxColors, completedTaskRenders); return; }
  renderActive(runner, text, lines, revealedLines, syntaxColors, completedTaskRenders);
}

function onKeypress(chunk: Buffer): void {
  const byte = chunk[0];

  if (byte === 3) {
    cleanup();
    process.exit(0);
  }

  if (runner.isLessonComplete) {
    if (byte === 0x0d || byte === 0x0a) {
      cleanup();
      process.exit(0);
    }
    return;
  }

  const game = runner.game;

  if (game.state === GameState.COMPLETED) {
    if (byte === 0x0d || byte === 0x0a) {
      completedTaskRenders.push(captureCompletedTask(runner, syntaxColors));
      const hasMore = runner.advance();
      if (hasMore) {
        text = (runner.currentTask as Exclude<typeof runner.currentTask, undefined>).code;
        syntaxColors = computeSyntaxColors(text);
        lines = text.split('\n');
        revealedLines = Math.min(20, lines.length);
      }
      render();
    }
    return;
  }

  if (byte === 0x7f || byte === 0x08) {
    game.backspace();
  } else if (byte === 0x09) {
    game.type('  ');
  } else if (byte === 0x0d || byte === 0x0a) {
    game.type('\n');
  } else {
    const ch = chunk.toString('utf8');
    if (ch.length === 1 && ch >= ' ' && ch <= '~') {
      game.type(ch);
    }
  }

  revealedLines = revealMore(text, game.session.typedText, revealedLines, lines.length);
  render();
}

function cleanup() {
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write('\x1b[?25h');
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.destroy();
}

function usage(): string {
  return `Usage: npm run dev -- [options]

Options:
  --lesson <name>      Pick a specific lesson by title
  --difficulty <level> Pick a random lesson by difficulty (easy | medium | hard)

Examples:
  npm run dev -- --lesson interfaces
  npm run dev -- --difficulty easy
`;
}

function showMenu(): Promise<Lesson> {
  const lessons = generator.getAllLessonsOrdered();

  console.log('\n\x1b[1mSelect a lesson:\x1b[0m\n');
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    if (!l) continue;
    const color = l.difficulty === Difficulty.EASY ? '\x1b[32m' : l.difficulty === Difficulty.MEDIUM ? '\x1b[33m' : '\x1b[31m';
    console.log(`  \x1b[36m${i + 1}.\x1b[0m ${l.title}  ${color}[${l.difficulty}]\x1b[0m`);
  }
  console.log(`  \x1b[36m0.\x1b[0m Exit\n`);

  return new Promise<Lesson>((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\x1b[90mEnter lesson number:\x1b[0m ', (answer) => {
      rl.close();
      const num = parseInt(answer.trim(), 10);
      if (isNaN(num) || num < 1 || num > lessons.length) {
        console.log('Exiting.');
        process.exit(0);
      }
      const chosen = lessons[num - 1];
      if (!chosen) {
        console.log('Exiting.');
        process.exit(0);
      }
      resolve(chosen);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let lessonName: string | undefined;
  let difficulty: Difficulty | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lesson' && i + 1 < args.length) {
      lessonName = args[++i];
    } else if (args[i] === '--difficulty' && i + 1 < args.length) {
      const val = args[++i] as string;
      if (val !== 'easy' && val !== 'medium' && val !== 'hard') {
        console.error(`Error: invalid difficulty "${val}". Must be easy, medium, or hard.\n`);
        console.error(usage());
        process.exit(1);
      }
      difficulty = val as Difficulty;
    }
  }

  let lesson;
  if (lessonName) {
    lesson = generator.getLessonByTitle(lessonName);
    if (!lesson) {
      const available = generator
        .getLessonTitles()
        .map((t) => `  - ${t}`)
        .join('\n');
      console.error(`Error: lesson "${lessonName}" not found.\n\nAvailable lessons:\n${available}\n`);
      console.error(usage());
      process.exit(1);
    }
  } else if (difficulty) {
    lesson = generator.getRandomLesson(difficulty);
    if (!lesson) {
      console.error(`Error: no lessons found for difficulty "${difficulty}".\n`);
      console.error(usage());
      process.exit(1);
    }
  } else {
    lesson = await showMenu();
  }

  runner = new LessonRunner(lesson);
  text = (runner.currentTask as Exclude<typeof runner.currentTask, undefined>).code;
  syntaxColors = computeSyntaxColors(text);
  lines = text.split('\n');
  revealedLines = Math.min(20, lines.length);
  runner.startCurrentTask();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdout.write('\x1b[?25l');

  render();

  process.stdin.on('data', onKeypress);
}

main().catch((err: unknown) => {
  cleanup();
  console.error(err);
  process.exit(1);
});
