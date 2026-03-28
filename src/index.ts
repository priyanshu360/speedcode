import process from 'node:process';
import { TextGenerator } from './generator.js';
import { LessonRunner } from './lesson.js';
import { Difficulty, GameState } from './types.js';

const generator = new TextGenerator('src/lessons');

let runner: LessonRunner;
let text: string;
let lines: string[];
let revealedLines: number;

function visibleLength(): number {
	return lines.slice(0, revealedLines).join('\n').length;
}

function revealMore(): void {
	const cursorLine = text.slice(0, runner.game.session.typedText.length).split('\n').length - 1;
	if (cursorLine >= revealedLines - 3) {
		revealedLines = Math.min(revealedLines + 5, lines.length);
	}
}

function render(): void {
	const output: string[] = [];

	output.push('\x1b[2J\x1b[H');

	if (runner.isLessonComplete) {
		const score = runner.lessonScore;
		output.push(`\x1b[1m${runner.lesson.title}\x1b[0m — \x1b[32mLesson Complete!\x1b[0m\n`);
		if (score) {
			output.push(`\nAverage: ${score.toString()}\n`);
		}
		output.push(`\n\x1b[90mPress Enter to exit\x1b[0m`);
		process.stdout.write(output.join(''));
		return;
	}

	const task = runner.currentTask!;
	const game = runner.game;

	output.push(`\x1b[1m${runner.lesson.title}\x1b[0m`);
	output.push(`  \x1b[36m${runner.progress}\x1b[0m`);
	output.push(`  \x1b[33m[${runner.lesson.difficulty}]\x1b[0m\n`);
	output.push(`\x1b[90m${task.description}\x1b[0m\n\n`);

	if (game.state === GameState.COMPLETED) {
		for (const ch of text) {
			output.push('\x1b[32m');
			output.push(ch);
		}
		output.push('\x1b[0m');
		output.push(`\n\n\x1b[32m\u2714 Complete!\x1b[0m  ${game.getScore().toString()}`);
		const remaining = runner.lesson.tasks.length - runner.lesson.tasks.indexOf(task) - 1;
		if (remaining > 0) {
			output.push(`\n\x1b[90mPress Enter for next task\x1b[0m`);
		} else {
			output.push(`\n\x1b[90mPress Enter to finish lesson\x1b[0m`);
		}
		process.stdout.write(output.join(''));
		return;
	}

	const typed = game.session.typedText;
	const end = visibleLength();

	for (let i = 0; i < end; i++) {
		if (i < typed.length) {
			if (typed[i] === text[i]) {
				output.push('\x1b[32m');
			} else {
				output.push('\x1b[41m\x1b[37m');
			}
		} else if (i === typed.length) {
			output.push('\x1b[7m');
		} else {
			output.push('\x1b[37m');
		}
		output.push(text[i]!);
		output.push('\x1b[0m');
	}

	if (revealedLines < lines.length) {
		output.push(`\x1b[90m\n\n... ${lines.length - revealedLines} more lines ...\x1b[0m`);
	}

	output.push(`\n\nCharacters: ${typed.length}/${text.length}`);
	process.stdout.write(output.join(''));
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
			const hasMore = runner.advance();
			if (hasMore) {
				text = runner.currentTask!.code;
				lines = text.split('\n');
				revealedLines = Math.min(20, lines.length);
				render();
			} else {
				render();
			}
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

function main() {
	const args = process.argv.slice(2);
	let lessonName: string | undefined;
	let difficulty: Difficulty | undefined;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--lesson' && i + 1 < args.length) {
			lessonName = args[++i];
		} else if (args[i] === '--difficulty' && i + 1 < args.length) {
			const val = args[++i];
			if (val !== Difficulty.EASY && val !== Difficulty.MEDIUM && val !== Difficulty.HARD) {
				console.error(`Error: invalid difficulty "${val}". Must be easy, medium, or hard.\n`);
				console.error(usage());
				process.exit(1);
			}
			difficulty = val as Difficulty;
		}
	}

	if (!lessonName && !difficulty) {
		console.error('Error: provide either --lesson or --difficulty\n');
		console.error(usage());
		process.exit(1);
	}

	let lesson;
	if (lessonName) {
		lesson = generator.getLessonByTitle(lessonName);
		if (!lesson) {
			const available = generator['lessons'].map(l => `  - ${l.title}`).join('\n');
			console.error(`Error: lesson "${lessonName}" not found.\n\nAvailable lessons:\n${available}\n`);
			console.error(usage());
			process.exit(1);
		}
	} else {
		lesson = generator.getRandomLesson(difficulty);
		if (!lesson) {
			console.error(`Error: no lessons found for difficulty "${difficulty}".\n`);
			console.error(usage());
			process.exit(1);
		}
	}

	runner = new LessonRunner(lesson);
	text = runner.currentTask!.code;
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

try {
	main();
} catch (err) {
	cleanup();
	console.error(err);
	process.exit(1);
}
