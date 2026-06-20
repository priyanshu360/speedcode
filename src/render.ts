import { SyntaxColor } from './syntax.js';
import type { LessonRunner } from './lesson.js';

function renderHeader(runner: LessonRunner, completedTaskRenders: string[]): string {
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

export function visibleLength(lines: string[], revealedLines: number): number {
  return lines.slice(0, revealedLines).join('\n').length;
}

export function revealMore(
  text: string,
  typedText: string,
  currentRevealed: number,
  totalLines: number,
): number {
  const cursorLine = text.slice(0, typedText.length).split('\n').length - 1;
  if (cursorLine >= currentRevealed - 3) {
    return Math.min(currentRevealed + 5, totalLines);
  }
  return currentRevealed;
}

export function captureCompletedTask(runner: LessonRunner, syntaxColors: string[]): string {
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

export function renderLessonComplete(runner: LessonRunner, completedTaskRenders: string[]): void {
  const output: string[] = [];
  output.push(renderHeader(runner, completedTaskRenders));
  const score = runner.lessonScore;
  output.push(`\n\x1b[32mLesson Complete!\x1b[0m\n`);
  if (score) {
    output.push(`\nAverage: ${score.toString()}\n`);
  }
  output.push(`\n\x1b[90mPress Enter to exit\x1b[0m`);
  process.stdout.write(output.join(''));
}

export function renderTaskComplete(
  runner: LessonRunner,
  text: string,
  syntaxColors: string[],
  completedTaskRenders: string[],
): void {
  const output: string[] = [];
  output.push(renderHeader(runner, completedTaskRenders));
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

export function renderActive(
  runner: LessonRunner,
  text: string,
  lines: string[],
  revealedLines: number,
  syntaxColors: string[],
  completedTaskRenders: string[],
): void {
  const output: string[] = [];
  output.push(renderHeader(runner, completedTaskRenders));
  if (completedTaskRenders.length > 0) {
    output.push(`\x1b[90m${'─'.repeat(50)}\x1b[0m\n\n`);
  }
  const task = runner.currentTask as Exclude<typeof runner.currentTask, undefined>;
  const game = runner.game;
  output.push(`\x1b[90m${task.description}\x1b[0m\n\n`);

  const typed = game.session.typedText;
  const end = visibleLength(lines, revealedLines);
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
