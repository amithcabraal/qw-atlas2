import { Question } from '../types';

export function getRandomQuestions(questions: Question[], count: number = 5): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function clearGameState() {
  localStorage.removeItem('lastGame');
}
