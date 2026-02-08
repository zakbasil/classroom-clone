// Question types for assignments
export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'code';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: QuestionOption[]; // For multiple choice
  correctOptionId?: string; // For multiple choice
  codeLanguage?: string; // For code questions
}

export interface Quiz {
  id: string;
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  questions: Question[];
  totalPoints: number;
  dueDate: string;
  createdAt: string;
  requireFullscreen: boolean;
  timeLimit?: number; // in minutes
}

export interface QuestionSet {
  id: string;
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  questions: Question[];
  totalPoints: number;
  dueDate: string;
  createdAt: string;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, string>; // questionId -> answer
  startedAt: string;
  submittedAt?: string;
  timerStartedAt?: string; // When the timer started for this attempt
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
  selectedOptionId?: string; // For multiple choice
}
