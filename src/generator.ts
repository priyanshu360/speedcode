import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Difficulty } from './types.js';
import type { Lesson } from './types.js';

export class TextGenerator {
  private lessons: Lesson[] = [];

  constructor(dirPath: string) {
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const data = readFileSync(join(dirPath, file), 'utf-8');
      const lesson = JSON.parse(data) as Lesson;
      this.lessons.push(lesson);
    }
  }

  getLessonByTitle(title: string): Lesson | undefined {
    const lower = title.toLowerCase();
    const exact = this.lessons.find((l) => l.title.toLowerCase() === lower);
    if (exact) return exact;
    const starts = this.lessons.find((l) => l.title.toLowerCase().startsWith(lower));
    if (starts) return starts;
    return this.lessons.find((l) => l.title.toLowerCase().includes(lower));
  }

  getLessonTitles(): string[] {
    return this.lessons.map((l) => l.title);
  }

  getRandomLesson(difficulty?: Difficulty): Lesson | undefined {
    const filtered = difficulty ? this.lessons.filter((l) => l.difficulty === difficulty) : this.lessons;
    if (filtered.length === 0) return undefined;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  getAllLessonsOrdered(): Lesson[] {
    const order: Record<string, number> = {
      [Difficulty.EASY]: 0,
      [Difficulty.MEDIUM]: 1,
      [Difficulty.HARD]: 2,
    };
    return [...this.lessons].sort((a, b) => {
      const d = (order[a.difficulty] ?? 0) - (order[b.difficulty] ?? 0);
      return d !== 0 ? d : a.id - b.id;
    });
  }
}
