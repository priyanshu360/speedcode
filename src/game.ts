import { GameState, Score } from './types.js';
import { TypingSession } from './session.js';

export class Game {
  private startTime: number = 0;
  private endTime: number = 0;
  readonly session: TypingSession;
  state: GameState;

  constructor(text: string) {
    this.session = new TypingSession(text);
    this.state = GameState.NOT_STARTED;
  }

  start(): void {
    if (this.state !== GameState.NOT_STARTED) {
      throw new Error('Game already started');
    }
    this.startTime = Date.now();
    this.state = GameState.IN_PROGRESS;
  }

  end(): void {
    if (this.state !== GameState.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }
    this.endTime = Date.now();
    this.state = GameState.COMPLETED;
  }

  type(ch: string): void {
    if (this.state !== GameState.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }
    this.session.addCharacter(ch);
    if (this.session.isComplete()) {
      this.end();
    }
  }

  backspace(): void {
    if (this.state !== GameState.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }
    this.session.removeCharacter();
  }

  calculateWPM(): number {
    if (this.state !== GameState.COMPLETED) {
      throw new Error('Game is not completed');
    }
    const timeInMinutes = (this.endTime - this.startTime) / (1000 * 60);
    if (timeInMinutes <= 0) {
      return 0;
    }
    return this.session.typedText.length / 5 / timeInMinutes;
  }

  calculateAccuracy(): number {
    return this.session.getAccuracy();
  }

  getCurrentWPM(): number {
    if (this.state !== GameState.IN_PROGRESS) {
      return 0;
    }
    const elapsed = Date.now() - this.startTime;
    const timeInMinutes = elapsed / (1000 * 60);
    if (timeInMinutes <= 0) {
      return 0;
    }
    return this.session.typedText.length / 5 / timeInMinutes;
  }

  getCurrentAccuracy(): number {
    return this.session.getAccuracy();
  }

  getScore(): Score {
    return new Score(this.calculateWPM(), this.calculateAccuracy());
  }
}
