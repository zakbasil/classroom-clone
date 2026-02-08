import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Question } from '@/types/classwork';

// Types matching database schema
export interface DbClass {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
  room: string | null;
  creator_id: string;
  cover_color: string;
  stream_code: string;
  created_at: string;
  updated_at: string;
}

export interface DbAssignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  points: number;
  due_date: string;
  topic: string | null;
  type: 'assignment' | 'quiz' | 'questions';
  quiz_id: string | null;
  question_set_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuiz {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  questions: Question[];
  total_points: number;
  due_date: string;
  require_fullscreen: boolean;
  time_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuestionSet {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  questions: Question[];
  total_points: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface DbMaterial {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  attachments: { name: string; type: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export interface DbAnnouncement {
  id: string;
  class_id: string;
  author_id: string;
  content: string;
  attachments: { name: string; type: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export interface DbEnrollment {
  id: string;
  user_id: string;
  class_id: string;
  created_at: string;
}

export interface DbQuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, string>;
  score: number;
  time_taken: number | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to generate stream code
function generateStreamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Classes
export async function fetchUserClasses(userId: string): Promise<DbClass[]> {
  // Get classes user created
  const { data: createdClasses, error: createdError } = await supabase
    .from('classes')
    .select('*')
    .eq('creator_id', userId);

  if (createdError) throw createdError;

  // Get classes user is enrolled in
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('user_id', userId);

  if (enrollError) throw enrollError;

  const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
  
  let enrolledClasses: DbClass[] = [];
  if (enrolledClassIds.length > 0) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .in('id', enrolledClassIds);
    
    if (error) throw error;
    enrolledClasses = data || [];
  }

  // Combine and dedupe
  const allClasses = [...(createdClasses || []), ...enrolledClasses];
  const uniqueClasses = allClasses.filter((c, i, arr) => 
    arr.findIndex(x => x.id === c.id) === i
  );
  
  return uniqueClasses as DbClass[];
}

export async function createClass(
  userId: string,
  name: string,
  section?: string,
  subject?: string,
  room?: string,
  coverColor: string = 'bg-primary'
): Promise<DbClass> {
  const streamCode = generateStreamCode();
  
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name,
      section,
      subject,
      room,
      creator_id: userId,
      cover_color: coverColor,
      stream_code: streamCode,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbClass;
}

export async function getClassByStreamCode(code: string): Promise<DbClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .ilike('stream_code', code)
    .maybeSingle();

  if (error) throw error;
  return data as DbClass | null;
}

export async function getClassById(classId: string): Promise<DbClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .maybeSingle();

  if (error) throw error;
  return data as DbClass | null;
}

// Enrollments
export async function joinClass(userId: string, classId: string): Promise<void> {
  const { error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, class_id: classId });

  if (error) throw error;
}

export async function isEnrolled(userId: string, classId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getClassEnrollments(classId: string): Promise<DbEnrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('class_id', classId);

  if (error) throw error;
  return data as DbEnrollment[];
}

// Profiles
export async function getProfilesByIds(userIds: string[]): Promise<DbProfile[]> {
  if (userIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds);

  if (error) throw error;
  return data as DbProfile[];
}

// Assignments
export async function getAssignmentsByClass(classId: string): Promise<DbAssignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbAssignment[];
}

// Quizzes
export async function getQuizzesByClass(classId: string): Promise<DbQuiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('class_id', classId);

  if (error) throw error;
  return (data || []).map(q => ({
    ...q,
    questions: q.questions as unknown as Question[],
  })) as DbQuiz[];
}

export async function getQuizById(quizId: string): Promise<DbQuiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    questions: data.questions as unknown as Question[],
  } as DbQuiz;
}

export async function createQuiz(
  classId: string,
  title: string,
  description: string | null,
  topic: string | null,
  questions: Question[],
  totalPoints: number,
  dueDate: string,
  requireFullscreen: boolean,
  timeLimit: number | null
): Promise<DbQuiz> {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert([{
      class_id: classId,
      title,
      description,
      topic,
      questions: JSON.parse(JSON.stringify(questions)) as Json,
      total_points: totalPoints,
      due_date: dueDate,
      require_fullscreen: requireFullscreen,
      time_limit: timeLimit,
    }])
    .select()
    .single();

  if (quizError) throw quizError;

  // Create corresponding assignment
  const { error: assignError } = await supabase
    .from('assignments')
    .insert({
      class_id: classId,
      title,
      description,
      points: totalPoints,
      due_date: dueDate,
      topic,
      type: 'quiz',
      quiz_id: quiz.id,
    });

  if (assignError) throw assignError;

  return {
    ...quiz,
    questions: quiz.questions as unknown as Question[],
  } as DbQuiz;
}

// Question Sets
export async function getQuestionSetsByClass(classId: string): Promise<DbQuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('class_id', classId);

  if (error) throw error;
  return (data || []).map(q => ({
    ...q,
    questions: q.questions as unknown as Question[],
  })) as DbQuestionSet[];
}

export async function getQuestionSetById(id: string): Promise<DbQuestionSet | null> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    questions: data.questions as unknown as Question[],
  } as DbQuestionSet;
}

export async function createQuestionSet(
  classId: string,
  title: string,
  description: string | null,
  topic: string | null,
  questions: Question[],
  totalPoints: number,
  dueDate: string
): Promise<DbQuestionSet> {
  const { data: qs, error: qsError } = await supabase
    .from('question_sets')
    .insert([{
      class_id: classId,
      title,
      description,
      topic,
      questions: JSON.parse(JSON.stringify(questions)) as Json,
      total_points: totalPoints,
      due_date: dueDate,
    }])
    .select()
    .single();

  if (qsError) throw qsError;

  // Create corresponding assignment
  const { error: assignError } = await supabase
    .from('assignments')
    .insert({
      class_id: classId,
      title,
      description,
      points: totalPoints,
      due_date: dueDate,
      topic,
      type: 'questions',
      question_set_id: qs.id,
    });

  if (assignError) throw assignError;

  return {
    ...qs,
    questions: qs.questions as unknown as Question[],
  } as DbQuestionSet;
}

// Materials
export async function getMaterialsByClass(classId: string): Promise<DbMaterial[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(m => ({
    ...m,
    attachments: m.attachments as { name: string; type: string; url: string }[],
  })) as DbMaterial[];
}

export async function createMaterial(
  classId: string,
  title: string,
  description: string | null,
  topic: string | null
): Promise<DbMaterial> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      class_id: classId,
      title,
      description,
      topic,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    attachments: data.attachments as { name: string; type: string; url: string }[],
  } as DbMaterial;
}

// Announcements
export async function getAnnouncementsByClass(classId: string): Promise<DbAnnouncement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(a => ({
    ...a,
    attachments: a.attachments as { name: string; type: string; url: string }[],
  })) as DbAnnouncement[];
}

export async function createAnnouncement(
  classId: string,
  authorId: string,
  content: string
): Promise<DbAnnouncement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      class_id: classId,
      author_id: authorId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    attachments: data.attachments as { name: string; type: string; url: string }[],
  } as DbAnnouncement;
}

// Quiz Submissions
export async function getQuizSubmissionsByQuiz(quizId: string): Promise<DbQuizSubmission[]> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false });

  if (error) throw error;
  return (data || []).map(s => ({
    ...s,
    answers: s.answers as Record<string, string>,
  })) as DbQuizSubmission[];
}

export async function getMyQuizSubmission(quizId: string, userId: string): Promise<DbQuizSubmission | null> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    answers: data.answers as Record<string, string>,
  } as DbQuizSubmission;
}

export async function upsertQuizSubmission(
  quizId: string,
  userId: string,
  answers: Record<string, string>,
  score: number,
  timeTaken: number | null,
  submitted: boolean
): Promise<DbQuizSubmission> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .upsert([{
      quiz_id: quizId,
      user_id: userId,
      answers: JSON.parse(JSON.stringify(answers)) as Json,
      score,
      time_taken: timeTaken,
      submitted_at: submitted ? new Date().toISOString() : null,
    }], {
      onConflict: 'quiz_id,user_id',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    answers: data.answers as Record<string, string>,
  } as DbQuizSubmission;
}

// Question Set Submissions
export async function getQuestionSetSubmissions(questionSetId: string) {
  const { data, error } = await supabase
    .from('question_set_submissions')
    .select('*')
    .eq('question_set_id', questionSetId);

  if (error) throw error;
  return data;
}

export async function upsertQuestionSetSubmission(
  questionSetId: string,
  userId: string,
  answers: Record<string, string>,
  timeTaken: number | null,
  submitted: boolean
) {
  const { data, error } = await supabase
    .from('question_set_submissions')
    .upsert([{
      question_set_id: questionSetId,
      user_id: userId,
      answers: JSON.parse(JSON.stringify(answers)) as Json,
      time_taken: timeTaken,
      submitted_at: submitted ? new Date().toISOString() : null,
    }], {
      onConflict: 'question_set_id,user_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
