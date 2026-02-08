import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockClasses as initialClasses, mockAssignments as initialAssignments, mockAnnouncements, mockStudents, mockSubmissions, mockMaterials as initialMaterials, mockEnrollments as initialEnrollments } from '@/data/mockData';
import type { Quiz, QuestionSet, Question } from '@/types/classwork';
import type { SubmissionEntry } from '@/components/class/SubmissionsLeaderboard';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ClassData {
  id: string;
  name: string;
  section?: string;
  subject?: string;
  room?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  coverColor: string;
  streamCode: string;
  studentCount: number;
  upcomingAssignments: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  classId: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  createdAt: string;
  topic?: string;
  attachments?: { name: string; type: string; url: string }[];
  status?: 'assigned' | 'submitted' | 'graded' | 'late' | 'missing';
  type?: 'assignment' | 'quiz' | 'questions';
  quizId?: string;
  questionSetId?: string;
}

export interface Announcement {
  id: string;
  classId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  attachments?: { name: string; type: string; url: string }[];
  comments?: { id: string; authorName: string; content: string; createdAt: string }[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt?: string;
  status: 'assigned' | 'submitted' | 'graded' | 'late' | 'missing';
  grade?: number;
  feedback?: string;
  attachments?: { name: string; type: string; url: string }[];
}

export interface Material {
  id: string;
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  createdAt: string;
  attachments: { name: string; type: string; url: string }[];
}

interface CreateClassInput {
  name: string;
  section?: string;
  subject?: string;
  room?: string;
  coverColor: string;
}

interface CreateQuizInput {
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  questions: Question[];
  totalPoints: number;
  dueDate: string;
  dueTime?: string; // Time component of deadline
  requireFullscreen: boolean;
  timeLimit?: number; // Timer in minutes
}

interface CreateQuestionSetInput {
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  questions: Question[];
  totalPoints: number;
  dueDate: string;
}

interface CreateMaterialInput {
  classId: string;
  title: string;
  description?: string;
  topic?: string;
}

interface AppContextType {
  currentUser: User;
  classes: ClassData[];
  assignments: Assignment[];
  announcements: Announcement[];
  students: Student[];
  submissions: Submission[];
  materials: Material[];
  enrollments: Enrollment[];
  quizzes: Quiz[];
  questionSets: QuestionSet[];
  quizSubmissions: Record<string, SubmissionEntry[]>;
  questionSetSubmissions: Record<string, SubmissionEntry[]>;
  getClassById: (id: string) => ClassData | undefined;
  getAssignmentsByClass: (classId: string) => Assignment[];
  getAnnouncementsByClass: (classId: string) => Announcement[];
  getStudentsByClass: (classId: string) => Student[];
  getSubmissionsByAssignment: (assignmentId: string) => Submission[];
  getMaterialsByClass: (classId: string) => Material[];
  getQuizzesByClass: (classId: string) => Quiz[];
  getQuestionSetsByClass: (classId: string) => QuestionSet[];
  getQuizById: (quizId: string) => Quiz | undefined;
  getQuestionSetById: (questionSetId: string) => QuestionSet | undefined;
  getQuizSubmissions: (quizId: string) => SubmissionEntry[];
  getQuestionSetSubmissions: (questionSetId: string) => SubmissionEntry[];
  getUserClasses: () => ClassData[];
  getClassByStreamCode: (code: string) => ClassData | undefined;
  joinClass: (streamCode: string) => { success: boolean; message: string };
  createClass: (input: CreateClassInput) => { success: boolean; message: string; classData?: ClassData };
  addQuiz: (input: CreateQuizInput) => void;
  addQuestionSet: (input: CreateQuestionSetInput) => void;
  addMaterial: (input: CreateMaterialInput) => void;
  submitQuizAttempt: (quizId: string, answers: Record<string, string>) => void;
  submitQuestionSetAttempt: (questionSetId: string, answers: Record<string, string>) => void;
  isEnrolledInClass: (classId: string) => boolean;
  isCreatorOfClass: (classId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const currentUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@school.edu',
  avatar: undefined,
};

function generateStreamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassData[]>(initialClasses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<Record<string, SubmissionEntry[]>>({});
  const [questionSetSubmissions, setQuestionSetSubmissions] = useState<Record<string, SubmissionEntry[]>>({});

  const getClassById = (id: string) => classes.find((c) => c.id === id);
  
  const getAssignmentsByClass = (classId: string) => 
    assignments.filter((a) => a.classId === classId);
  
  const getAnnouncementsByClass = (classId: string) => 
    mockAnnouncements.filter((a) => a.classId === classId);
  
  const getStudentsByClass = (_classId: string) => mockStudents;
  
  const getSubmissionsByAssignment = (assignmentId: string) => 
    mockSubmissions.filter((s) => s.assignmentId === assignmentId);
  
  const getMaterialsByClass = (classId: string) => 
    materials.filter((m) => m.classId === classId);

  const getQuizzesByClass = (classId: string) => 
    quizzes.filter((q) => q.classId === classId);

  const getQuestionSetsByClass = (classId: string) => 
    questionSets.filter((q) => q.classId === classId);

  const getQuizById = (quizId: string) => quizzes.find((q) => q.id === quizId);

  const getQuestionSetById = (questionSetId: string) => questionSets.find((q) => q.id === questionSetId);

  const getQuizSubmissions = (quizId: string) => quizSubmissions[quizId] || [];

  const getQuestionSetSubmissions = (questionSetId: string) => questionSetSubmissions[questionSetId] || [];

  const isCreatorOfClass = (classId: string) => {
    const classData = getClassById(classId);
    return classData?.creatorId === currentUser.id;
  };

  const isEnrolledInClass = (classId: string) => {
    return enrollments.some(e => e.userId === currentUser.id && e.classId === classId);
  };

  const getUserClasses = () => {
    // Get classes user created
    const createdClasses = classes.filter(c => c.creatorId === currentUser.id);
    
    // Get classes user is enrolled in
    const enrolledClassIds = enrollments
      .filter(e => e.userId === currentUser.id)
      .map(e => e.classId);
    const enrolledClasses = classes.filter(c => enrolledClassIds.includes(c.id) && c.creatorId !== currentUser.id);
    
    return [...createdClasses, ...enrolledClasses];
  };

  const getClassByStreamCode = (code: string) => {
    return classes.find(c => c.streamCode.toLowerCase() === code.toLowerCase());
  };

  const joinClass = (streamCode: string): { success: boolean; message: string } => {
    const classToJoin = getClassByStreamCode(streamCode);
    
    if (!classToJoin) {
      return { success: false, message: 'Invalid stream code. Please check and try again.' };
    }
    
    if (isEnrolledInClass(classToJoin.id)) {
      return { success: false, message: 'You are already enrolled in this class.' };
    }
    
    if (classToJoin.creatorId === currentUser.id) {
      return { success: false, message: 'You cannot join a class you created.' };
    }
    
    const newEnrollment: Enrollment = {
      id: `enroll-${Date.now()}`,
      userId: currentUser.id,
      classId: classToJoin.id,
    };
    
    setEnrollments(prev => [...prev, newEnrollment]);
    return { success: true, message: `Successfully joined "${classToJoin.name}"!` };
  };

  const createClass = (input: CreateClassInput): { success: boolean; message: string; classData?: ClassData } => {
    const streamCode = generateStreamCode();
    
    const newClass: ClassData = {
      id: `class-${Date.now()}`,
      name: input.name,
      section: input.section,
      subject: input.subject,
      room: input.room,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      coverColor: input.coverColor,
      streamCode,
      studentCount: 0,
      upcomingAssignments: 0,
    };
    
    setClasses(prev => [...prev, newClass]);
    
    return { 
      success: true, 
      message: `Class "${input.name}" created! Stream code: ${streamCode}`,
      classData: newClass 
    };
  };

  const addQuiz = (input: CreateQuizInput) => {
    // Combine date and time for full deadline
    let fullDeadline = input.dueDate;
    if (input.dueTime) {
      fullDeadline = `${input.dueDate}T${input.dueTime}:00`;
    }

    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      classId: input.classId,
      title: input.title,
      description: input.description,
      topic: input.topic,
      questions: input.questions,
      totalPoints: input.totalPoints,
      dueDate: fullDeadline,
      createdAt: new Date().toISOString().split('T')[0],
      requireFullscreen: input.requireFullscreen,
      timeLimit: input.timeLimit,
    };
    setQuizzes(prev => [...prev, quiz]);

    // Add to assignments list
    const assignment: Assignment = {
      id: `assign-quiz-${Date.now()}`,
      classId: input.classId,
      title: input.title,
      description: input.description || '',
      points: input.totalPoints,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      topic: input.topic,
      type: 'quiz',
      quizId: quiz.id,
      status: 'assigned',
    };
    setAssignments(prev => [...prev, assignment]);
  };

  const addQuestionSet = (input: CreateQuestionSetInput) => {
    const questionSet: QuestionSet = {
      id: `qs-${Date.now()}`,
      classId: input.classId,
      title: input.title,
      description: input.description,
      topic: input.topic,
      questions: input.questions,
      totalPoints: input.totalPoints,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuestionSets(prev => [...prev, questionSet]);

    // Add to assignments list
    const assignment: Assignment = {
      id: `assign-qs-${Date.now()}`,
      classId: input.classId,
      title: input.title,
      description: input.description || '',
      points: input.totalPoints,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      topic: input.topic,
      type: 'questions',
      questionSetId: questionSet.id,
      status: 'assigned',
    };
    setAssignments(prev => [...prev, assignment]);
  };

  const addMaterial = (input: CreateMaterialInput) => {
    const material: Material = {
      id: `mat-${Date.now()}`,
      classId: input.classId,
      title: input.title,
      description: input.description,
      topic: input.topic,
      createdAt: new Date().toISOString().split('T')[0],
      attachments: [],
    };
    setMaterials(prev => [...prev, material]);
  };

  const submitQuizAttempt = (quizId: string, answers: Record<string, string>) => {
    const quiz = getQuizById(quizId);
    if (!quiz) return;

    // Calculate score
    let score = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        score += q.points;
      }
    });

    const submission: SubmissionEntry = {
      id: `sub-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString(),
      score,
      totalPoints: quiz.totalPoints,
      status: 'submitted',
      timeTaken: Math.floor(Math.random() * 20) + 5, // Mock time
    };

    setQuizSubmissions(prev => ({
      ...prev,
      [quizId]: [...(prev[quizId] || []), submission],
    }));
  };

  const submitQuestionSetAttempt = (questionSetId: string, _answers: Record<string, string>) => {
    const questionSet = getQuestionSetById(questionSetId);
    if (!questionSet) return;

    // For question sets, score is pending grading
    const submission: SubmissionEntry = {
      id: `sub-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString(),
      score: 0,
      totalPoints: questionSet.totalPoints,
      status: 'pending',
      timeTaken: Math.floor(Math.random() * 30) + 10,
    };

    setQuestionSetSubmissions(prev => ({
      ...prev,
      [questionSetId]: [...(prev[questionSetId] || []), submission],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        classes,
        assignments,
        announcements: mockAnnouncements,
        students: mockStudents,
        submissions: mockSubmissions,
        materials,
        enrollments,
        quizzes,
        questionSets,
        quizSubmissions,
        questionSetSubmissions,
        getClassById,
        getAssignmentsByClass,
        getAnnouncementsByClass,
        getStudentsByClass,
        getSubmissionsByAssignment,
        getMaterialsByClass,
        getQuizzesByClass,
        getQuestionSetsByClass,
        getQuizById,
        getQuestionSetById,
        getQuizSubmissions,
        getQuestionSetSubmissions,
        getUserClasses,
        getClassByStreamCode,
        joinClass,
        createClass,
        addQuiz,
        addQuestionSet,
        addMaterial,
        submitQuizAttempt,
        submitQuestionSetAttempt,
        isEnrolledInClass,
        isCreatorOfClass,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
