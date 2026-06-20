import { Game } from './game.js';
import { GameState, Score } from './types.js';
import type { Lesson, Task } from './types.js';

export class LessonRunner {
  private tasks: Task[];
  private currentTaskIndex = 0;
  private currentGame: Game | null = null;
  private taskScores: Score[] = [];

  constructor(public readonly lesson: Lesson) {
    this.tasks = lesson.tasks;
  }

  get currentTask(): Task | undefined {
    return this.tasks[this.currentTaskIndex];
  }

  get game(): Game {
    if (!this.currentGame) throw new Error('No active game');
    return this.currentGame;
  }

  get isLessonComplete(): boolean {
    return this.currentTaskIndex >= this.tasks.length;
  }

  get progress(): string {
    return `Task ${this.currentTaskIndex + 1}/${this.tasks.length}`;
  }

  get lessonScore(): Score | null {
    if (this.taskScores.length === 0) return null;
    const avgWpm = this.taskScores.reduce((s, sc) => s + sc.wpm, 0) / this.taskScores.length;
    const avgAcc = this.taskScores.reduce((s, sc) => s + sc.accuracy, 0) / this.taskScores.length;
    return new Score(avgWpm, avgAcc);
  }

  startCurrentTask(): void {
    const task = this.currentTask;
    if (!task) throw new Error('No current task');
    this.currentGame = new Game(task.code);
    this.currentGame.start();
  }

  finishCurrentTask(): void {
    if (this.currentGame?.state === GameState.COMPLETED) {
      this.taskScores.push(this.currentGame.getScore());
    }
  }

  advance(): boolean {
    this.finishCurrentTask();
    this.currentTaskIndex++;
    if (this.isLessonComplete) return false;
    this.startCurrentTask();
    return true;
  }
}
