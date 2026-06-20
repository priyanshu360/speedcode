import process from 'node:process';
import readline from 'node:readline';
import { TextGenerator } from './generator.js';
import { LessonRunner } from './lesson.js';
import { Difficulty, GameState } from './types.js';
import type { Lesson } from './types.js';
import { SyntaxColor, computeSyntaxColors } from './syntax.js';

const generator = new TextGenerator('src/lessons');

let runner: LessonRunner;
let text: string;
let lines: string[];
let revealedLines: number;
let syntaxColors: string[] = [];
const completedTaskRenders: string[] = [];

function visibleLength(): number {
  return lines.slice(0, revealedLines).join('\n').length;
}

function revealMore(): void {
  const cursorLine = text.slice(0, runner.game.session.typedText.length).split('\n').length - 1;
  if (cursorLine >= revealedLines - 3) {
    revealedLines = Math.min(revealedLines + 5, lines.length);
  }
}

function captureCompletedTask(): string {
  const task = runner.currentTask;
  if (!task) return '';
  const game = runner.game;
  const out: string[] = [];
  const code = task.code;

  out.push(`\x1b[90m${'─'.repeat(50)}\x1b[0m\n`);
  out.push(`\x1b[1m\u2714 Task ${runner.lesson.tasks.indexOf(task) + 1}: ${task.title}\x1b[0m`);
  out.push(`  \x1b[90m${game.getScore().toString()}\x1b[0m\n`);
  for (let i = 0; i < code.length; i++) {
    out.push(syntaxColors[i] ?? SyntaxColor.PLAIN);
    out.push(code.charAt(i));
  }
  out.push(SyntaxColor.RESET);
  return out.join('');
}

function renderHeader(): string {
  const out: string[] = [];
  out.push('\x1b[2J\x1b[H');
  out.push(`\x1b[1m${runner.lesson.title}\x1b[0m`);
  out.push(`  \x1b[36m${runner.progress}\x1b[0m`);
  out.push(`  \x1b[33m[${runner.lesson.difficulty}]\x1b[0m\n`);
  for (const cr of completedTaskRenders) {
    out.push(cr);
    out.push('\n');
  }
  return out.join('');
}

function renderLessonComplete(): void {
  const output: string[] = [];
  output.push(renderHeader());
  const score = runner.lessonScore;
  output.push(`\n\x1b[32mLesson Complete!\x1b[0m\n`);
  if (score) {
    output.push(`\nAverage: ${score.toString()}\n`);
  }
  output.push(`\n\x1b[90mPress Enter to exit\x1b[0m`);
  process.stdout.write(output.join(''));
}

function renderTaskComplete(): void {
  const output: string[] = [];
  output.push(renderHeader());
  if (completedTaskRenders.length > 0) {
    output.push(`\x1b[90m${'─'.repeat(50)}\x1b[0m\n\n`);
  }
  const task = runner.currentTask as Exclude<typeof runner.currentTask, undefined>;
  const game = runner.game;
  output.push(`\x1b[90m${task.description}\x1b[0m\n\n`);
  for (let i = 0; i < text.length; i++) {
    output.push(syntaxColors[i] ?? SyntaxColor.PLAIN);
    output.push(text.charAt(i));
  }
  output.push(SyntaxColor.RESET);
  output.push(`\n\n\x1b[32m\u2714 Complete!\x1b[0m  ${game.getScore().toString()}`);
  const remaining = runner.lesson.tasks.length - runner.lesson.tasks.indexOf(task) - 1;
  if (remaining > 0) {
    output.push(`\n\x1b[90mPress Enter for next task\x1b[0m`);
  } else {
    output.push(`\n\x1b[90mPress Enter to finish lesson\x1b[0m`);
  }
  process.stdout.write(output.join(''));
}

function renderActive(): void {
  const output: string[] = [];
  output.push(renderHeader());
  if (completedTaskRenders.length > 0) {
    output.push(`\x1b[90m${'─'.repeat(50)}\x1b[0m\n\n`);
  }
  const task = runner.currentTask as Exclude<typeof runner.currentTask, undefined>;
  const game = runner.game;
  output.push(`\x1b[90m${task.description}\x1b[0m\n\n`);

  const typed = game.session.typedText;
  const end = visibleLength();
  for (let i = 0; i < end; i++) {
    const color = syntaxColors[i] ?? SyntaxColor.PLAIN;
    if (i < typed.length) {
      if (typed[i] === text[i]) {
        output.push(color);
      } else {
        output.push('\x1b[41m\x1b[37m');
      }
    } else if (i === typed.length) {
      output.push(color);
      output.push('\x1b[7m');
    } else {
      output.push(color);
      output.push(SyntaxColor.PLAIN);
    }
    output.push(text.charAt(i));
    output.push(SyntaxColor.RESET);
  }
  if (revealedLines < lines.length) {
    output.push(`\x1b[90m\n\n... ${lines.length - revealedLines} more lines ...\x1b[0m`);
  }

  const liveWpm = game.getCurrentWPM();
  const liveAcc = game.getCurrentAccuracy();
  output.push(
    `\n\n\x1b[36m\u25b6 ${liveWpm.toFixed(1)} WPM\x1b[0m  \xb7  \x1b[32m${liveAcc.toFixed(1)}% accuracy\x1b[0m  \xb7  ${typed.length}/${text.length} chars`,
  );
  process.stdout.write(output.join(''));
}

function render(): void {
  if (runner.isLessonComplete) { renderLessonComplete(); return; }
  if (runner.game.state === GameState.COMPLETED) { renderTaskComplete(); return; }
  renderActive();
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
      completedTaskRenders.push(captureCompletedTask());
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

  revealMore();
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
