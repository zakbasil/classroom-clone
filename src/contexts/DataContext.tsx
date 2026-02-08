import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as db from '@/lib/database';
import type { Question } from '@/types/classwork';

// Types matching the existing app interface
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

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  createdAt: string;
  topic?: string;
  type?: 'assignment' | 'quiz' | 'questions';
  quizId?: string;
  questionSetId?: string;
  status?: string;
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
  timeLimit?: number;
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

export interface Material {
  id: string;
  classId: string;
  title: string;
  description?: string;
  topic?: string;
  createdAt: string;
  attachments: { name: string; type: string; url: string }[];
}

export interface Announcement {
  id: string;
  classId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  attachments?: { name: string; type: string; url: string }[];
}

export interface SubmissionEntry {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  score: number;
  totalPoints: number;
  status: 'submitted' | 'graded' | 'pending';
  timeTaken?: number;
}

interface DataContextType {
  // State
  classes: ClassData[];
  isLoading: boolean;
  error: string | null;
  
  // Class operations
  refreshClasses: () => Promise<void>;
  createClass: (name: string, section?: string, subject?: string, room?: string, coverColor?: string) => Promise<ClassData>;
  joinClass: (streamCode: string) => Promise<{ success: boolean; message: string }>;
  getClassById: (classId: string) => ClassData | undefined;
  isCreatorOfClass: (classId: string) => boolean;
  
  // Assignment operations
  getAssignmentsByClass: (classId: string) => Promise<Assignment[]>;
  
  // Quiz operations
  getQuizById: (quizId: string) => Promise<Quiz | null>;
  createQuiz: (
    classId: string,
    title: string,
    description: string | undefined,
    topic: string | undefined,
    questions: Question[],
    totalPoints: number,
    dueDate: string,
    requireFullscreen: boolean,
    timeLimit?: number
  ) => Promise<Quiz>;
  getQuizSubmissions: (quizId: string) => Promise<SubmissionEntry[]>;
  submitQuizAttempt: (quizId: string, answers: Record<string, string>, score: number, timeTaken?: number) => Promise<void>;
  
  // Question set operations
  getQuestionSetById: (id: string) => Promise<QuestionSet | null>;
  createQuestionSet: (
    classId: string,
    title: string,
    description: string | undefined,
    topic: string | undefined,
    questions: Question[],
    totalPoints: number,
    dueDate: string
  ) => Promise<QuestionSet>;
  
  // Material operations
  getMaterialsByClass: (classId: string) => Promise<Material[]>;
  createMaterial: (classId: string, title: string, description?: string, topic?: string) => Promise<Material>;
  
  // Announcement operations
  getAnnouncementsByClass: (classId: string) => Promise<Announcement[]>;
  createAnnouncement: (classId: string, content: string) => Promise<Announcement>;
  
  // People operations
  getClassMembers: (classId: string) => Promise<{ id: string; name: string; email: string; avatar?: string; isCreator: boolean }[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache for profiles
  const [profileCache, setProfileCache] = useState<Record<string, db.DbProfile>>({});

  const fetchProfilesForIds = useCallback(async (userIds: string[]) => {
    const uncachedIds = userIds.filter(id => !profileCache[id]);
    if (uncachedIds.length === 0) return;
    
    const profiles = await db.getProfilesByIds(uncachedIds);
    const newCache = { ...profileCache };
    profiles.forEach(p => {
      newCache[p.user_id] = p;
    });
    setProfileCache(newCache);
  }, [profileCache]);

  // Convert DB class to app ClassData
  const toClassData = useCallback(async (dbClass: db.DbClass): Promise<ClassData> => {
    // Get creator profile
    if (!profileCache[dbClass.creator_id]) {
      await fetchProfilesForIds([dbClass.creator_id]);
    }
    const creatorProfile = profileCache[dbClass.creator_id];
    
    // Get enrollments count
    const enrollments = await db.getClassEnrollments(dbClass.id);
    
    // Get assignments count (due in future)
    const assignments = await db.getAssignmentsByClass(dbClass.id);
    const upcomingCount = assignments.filter(a => new Date(a.due_date) > new Date()).length;

    return {
      id: dbClass.id,
      name: dbClass.name,
      section: dbClass.section || undefined,
      subject: dbClass.subject || undefined,
      room: dbClass.room || undefined,
      creatorId: dbClass.creator_id,
      creatorName: creatorProfile?.name || 'Unknown',
      creatorAvatar: creatorProfile?.avatar_url || undefined,
      coverColor: dbClass.cover_color,
      streamCode: dbClass.stream_code,
      studentCount: enrollments.length,
      upcomingAssignments: upcomingCount,
    };
  }, [profileCache, fetchProfilesForIds]);

  const refreshClasses = useCallback(async () => {
    if (!user) {
      setClasses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const dbClasses = await db.fetchUserClasses(user.id);
      
      // Fetch all creator profiles first
      const creatorIds = [...new Set(dbClasses.map(c => c.creator_id))];
      await fetchProfilesForIds(creatorIds);
      
      const classData = await Promise.all(dbClasses.map(toClassData));
      setClasses(classData);
    } catch (e) {
      console.error('Error fetching classes:', e);
      setError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [user, toClassData, fetchProfilesForIds]);

  useEffect(() => {
    refreshClasses();
  }, [user?.id]);

  const createClass = async (
    name: string,
    section?: string,
    subject?: string,
    room?: string,
    coverColor: string = 'bg-primary'
  ): Promise<ClassData> => {
    if (!user) throw new Error('Not authenticated');
    
    const dbClass = await db.createClass(user.id, name, section, subject, room, coverColor);
    const classData = await toClassData(dbClass);
    setClasses(prev => [...prev, classData]);
    return classData;
  };

  const joinClass = async (streamCode: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };
    
    try {
      const classToJoin = await db.getClassByStreamCode(streamCode);
      
      if (!classToJoin) {
        return { success: false, message: 'Invalid stream code. Please check and try again.' };
      }
      
      if (classToJoin.creator_id === user.id) {
        return { success: false, message: 'You cannot join a class you created.' };
      }
      
      const alreadyEnrolled = await db.isEnrolled(user.id, classToJoin.id);
      if (alreadyEnrolled) {
        return { success: false, message: 'You are already enrolled in this class.' };
      }
      
      await db.joinClass(user.id, classToJoin.id);
      await refreshClasses();
      
      return { success: true, message: `Successfully joined "${classToJoin.name}"!` };
    } catch (e) {
      console.error('Error joining class:', e);
      return { success: false, message: 'Failed to join class. Please try again.' };
    }
  };

  const getClassById = (classId: string): ClassData | undefined => {
    return classes.find(c => c.id === classId);
  };

  const isCreatorOfClass = (classId: string): boolean => {
    const classData = getClassById(classId);
    return classData?.creatorId === user?.id;
  };

  const getAssignmentsByClass = async (classId: string): Promise<Assignment[]> => {
    const dbAssignments = await db.getAssignmentsByClass(classId);
    return dbAssignments.map(a => ({
      id: a.id,
      classId: a.class_id,
      title: a.title,
      description: a.description || '',
      points: a.points,
      dueDate: a.due_date,
      createdAt: a.created_at,
      topic: a.topic || undefined,
      type: a.type as 'assignment' | 'quiz' | 'questions',
      quizId: a.quiz_id || undefined,
      questionSetId: a.question_set_id || undefined,
    }));
  };

  const getQuizById = async (quizId: string): Promise<Quiz | null> => {
    const dbQuiz = await db.getQuizById(quizId);
    if (!dbQuiz) return null;
    
    return {
      id: dbQuiz.id,
      classId: dbQuiz.class_id,
      title: dbQuiz.title,
      description: dbQuiz.description || undefined,
      topic: dbQuiz.topic || undefined,
      questions: dbQuiz.questions,
      totalPoints: dbQuiz.total_points,
      dueDate: dbQuiz.due_date,
      createdAt: dbQuiz.created_at,
      requireFullscreen: dbQuiz.require_fullscreen,
      timeLimit: dbQuiz.time_limit || undefined,
    };
  };

  const createQuizFn = async (
    classId: string,
    title: string,
    description: string | undefined,
    topic: string | undefined,
    questions: Question[],
    totalPoints: number,
    dueDate: string,
    requireFullscreen: boolean,
    timeLimit?: number
  ): Promise<Quiz> => {
    const dbQuiz = await db.createQuiz(
      classId,
      title,
      description || null,
      topic || null,
      questions,
      totalPoints,
      dueDate,
      requireFullscreen,
      timeLimit || null
    );
    
    return {
      id: dbQuiz.id,
      classId: dbQuiz.class_id,
      title: dbQuiz.title,
      description: dbQuiz.description || undefined,
      topic: dbQuiz.topic || undefined,
      questions: dbQuiz.questions,
      totalPoints: dbQuiz.total_points,
      dueDate: dbQuiz.due_date,
      createdAt: dbQuiz.created_at,
      requireFullscreen: dbQuiz.require_fullscreen,
      timeLimit: dbQuiz.time_limit || undefined,
    };
  };

  const getQuizSubmissions = async (quizId: string): Promise<SubmissionEntry[]> => {
    const dbSubmissions = await db.getQuizSubmissionsByQuiz(quizId);
    const quiz = await db.getQuizById(quizId);
    
    // Get profiles for all submitters
    const userIds = dbSubmissions.map(s => s.user_id);
    await fetchProfilesForIds(userIds);
    
    return dbSubmissions.map(s => ({
      id: s.id,
      studentId: s.user_id,
      studentName: profileCache[s.user_id]?.name || 'Unknown',
      submittedAt: s.submitted_at || s.started_at,
      score: s.score,
      totalPoints: quiz?.total_points || 0,
      status: s.submitted_at ? 'submitted' : 'pending',
      timeTaken: s.time_taken || undefined,
    }));
  };

  const submitQuizAttempt = async (
    quizId: string,
    answers: Record<string, string>,
    score: number,
    timeTaken?: number
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');
    await db.upsertQuizSubmission(quizId, user.id, answers, score, timeTaken || null, true);
  };

  const getQuestionSetById = async (id: string): Promise<QuestionSet | null> => {
    const dbQs = await db.getQuestionSetById(id);
    if (!dbQs) return null;
    
    return {
      id: dbQs.id,
      classId: dbQs.class_id,
      title: dbQs.title,
      description: dbQs.description || undefined,
      topic: dbQs.topic || undefined,
      questions: dbQs.questions,
      totalPoints: dbQs.total_points,
      dueDate: dbQs.due_date,
      createdAt: dbQs.created_at,
    };
  };

  const createQuestionSetFn = async (
    classId: string,
    title: string,
    description: string | undefined,
    topic: string | undefined,
    questions: Question[],
    totalPoints: number,
    dueDate: string
  ): Promise<QuestionSet> => {
    const dbQs = await db.createQuestionSet(
      classId,
      title,
      description || null,
      topic || null,
      questions,
      totalPoints,
      dueDate
    );
    
    return {
      id: dbQs.id,
      classId: dbQs.class_id,
      title: dbQs.title,
      description: dbQs.description || undefined,
      topic: dbQs.topic || undefined,
      questions: dbQs.questions,
      totalPoints: dbQs.total_points,
      dueDate: dbQs.due_date,
      createdAt: dbQs.created_at,
    };
  };

  const getMaterialsByClass = async (classId: string): Promise<Material[]> => {
    const dbMaterials = await db.getMaterialsByClass(classId);
    return dbMaterials.map(m => ({
      id: m.id,
      classId: m.class_id,
      title: m.title,
      description: m.description || undefined,
      topic: m.topic || undefined,
      createdAt: m.created_at,
      attachments: m.attachments,
    }));
  };

  const createMaterialFn = async (
    classId: string,
    title: string,
    description?: string,
    topic?: string
  ): Promise<Material> => {
    const dbMaterial = await db.createMaterial(classId, title, description || null, topic || null);
    return {
      id: dbMaterial.id,
      classId: dbMaterial.class_id,
      title: dbMaterial.title,
      description: dbMaterial.description || undefined,
      topic: dbMaterial.topic || undefined,
      createdAt: dbMaterial.created_at,
      attachments: dbMaterial.attachments,
    };
  };

  const getAnnouncementsByClass = async (classId: string): Promise<Announcement[]> => {
    const dbAnnouncements = await db.getAnnouncementsByClass(classId);
    
    // Get profiles for all authors
    const authorIds = dbAnnouncements.map(a => a.author_id);
    await fetchProfilesForIds(authorIds);
    
    return dbAnnouncements.map(a => ({
      id: a.id,
      classId: a.class_id,
      authorId: a.author_id,
      authorName: profileCache[a.author_id]?.name || 'Unknown',
      authorAvatar: profileCache[a.author_id]?.avatar_url || undefined,
      content: a.content,
      createdAt: a.created_at,
      attachments: a.attachments,
    }));
  };

  const createAnnouncementFn = async (classId: string, content: string): Promise<Announcement> => {
    if (!user) throw new Error('Not authenticated');
    
    const dbAnnouncement = await db.createAnnouncement(classId, user.id, content);
    
    return {
      id: dbAnnouncement.id,
      classId: dbAnnouncement.class_id,
      authorId: dbAnnouncement.author_id,
      authorName: profile?.name || 'Unknown',
      authorAvatar: profile?.avatar_url || undefined,
      content: dbAnnouncement.content,
      createdAt: dbAnnouncement.created_at,
      attachments: dbAnnouncement.attachments,
    };
  };

  const getClassMembers = async (classId: string): Promise<{ id: string; name: string; email: string; avatar?: string; isCreator: boolean }[]> => {
    const classData = getClassById(classId);
    if (!classData) return [];
    
    const enrollments = await db.getClassEnrollments(classId);
    const memberIds = [classData.creatorId, ...enrollments.map(e => e.user_id)];
    
    await fetchProfilesForIds(memberIds);
    
    return memberIds.map(id => ({
      id,
      name: profileCache[id]?.name || 'Unknown',
      email: profileCache[id]?.email || '',
      avatar: profileCache[id]?.avatar_url || undefined,
      isCreator: id === classData.creatorId,
    }));
  };

  return (
    <DataContext.Provider
      value={{
        classes,
        isLoading,
        error,
        refreshClasses,
        createClass,
        joinClass,
        getClassById,
        isCreatorOfClass,
        getAssignmentsByClass,
        getQuizById,
        createQuiz: createQuizFn,
        getQuizSubmissions,
        submitQuizAttempt,
        getQuestionSetById,
        createQuestionSet: createQuestionSetFn,
        getMaterialsByClass,
        createMaterial: createMaterialFn,
        getAnnouncementsByClass,
        createAnnouncement: createAnnouncementFn,
        getClassMembers,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
