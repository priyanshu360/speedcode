export enum GameState {
  NOT_STARTED,
  IN_PROGRESS,
  COMPLETED,
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Task {
  id: number;
  title: string;
  description: string;
  code: string;
}

export interface Lesson {
  id: number;
  title: string;
  difficulty: Difficulty;
  tasks: Task[];
}

export class Score {
  constructor(
    public readonly wpm: number,
    public readonly accuracy: number,
  ) {}

  toString(): string {
    return `${this.wpm.toFixed(1)} WPM, ${this.accuracy.toFixed(1)}% accuracy`;
  }
}
