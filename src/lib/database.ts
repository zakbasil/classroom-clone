import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api';
import type { Question } from '@/types/classwork';

// Re-export types used by DataContext (snake_case for DB-shaped responses where needed)
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

export interface ClassDataFromApi {
  id: string;
  name: string;
  section?: string | null;
  subject?: string | null;
  room?: string | null;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  coverColor: string;
  streamCode: string;
  studentCount: number;
  upcomingAssignments: number;
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
  paper_pdf_url: string | null;
  is_paper_based: boolean;
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

export interface DbQuestionSetSubmission {
  id: string;
  question_set_id: string;
  user_id: string;
  answers_json: string;
  score: number | null;
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

// --- Classes (API returns camelCase) ---

export async function fetchUserClasses(_userId: string): Promise<ClassDataFromApi[]> {
  const list = await apiGet<ClassDataFromApi[]>('/api/classes');
  return list ?? [];
}

export async function createClass(
  _userId: string,
  name: string,
  section?: string,
  subject?: string,
  room?: string,
  coverColor: string = 'bg-primary'
): Promise<ClassDataFromApi> {
  return apiPost<ClassDataFromApi>('/api/classes', {
    name,
    section: section ?? null,
    subject: subject ?? null,
    room: room ?? null,
    coverColor: coverColor || undefined,
  });
}

export async function getClassByStreamCode(code: string): Promise<{ id: string; name: string; creator_id: string } | null> {
  try {
    const c = await apiGet<ClassDataFromApi>(`/api/classes/by-code/${encodeURIComponent(code)}`, true);
    return c ? { id: c.id, name: c.name, creator_id: c.creatorId } : null;
  } catch {
    return null;
  }
}

export async function getClassById(classId: string): Promise<DbClass | null> {
  try {
    const c = await apiGet<ClassDataFromApi>(`/api/classes/${classId}`);
    return c
      ? {
          id: c.id,
          name: c.name,
          section: c.section ?? null,
          subject: c.subject ?? null,
          room: c.room ?? null,
          creator_id: c.creatorId,
          cover_color: c.coverColor,
          stream_code: c.streamCode,
          created_at: '',
          updated_at: '',
        }
      : null;
  } catch {
    return null;
  }
}

export async function joinClass(streamCode: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/api/classes/join', { streamCode });
}

export async function isEnrolled(_userId: string, _classId: string): Promise<boolean> {
  return false;
}

export async function getClassEnrollments(classId: string): Promise<{ user_id: string }[]> {
  const profiles = await apiGet<{ userId: string }[]>(`/api/enrollments/class/${classId}`);
  return (profiles ?? []).map((p) => ({ user_id: p.userId }));
}

/** Returns class members (creator + enrolled) with profile info for People tab. */
export async function getClassMemberProfiles(classId: string): Promise<Array<{ userId: string; name: string; email: string; avatarUrl?: string | null }>> {
  const list = await apiGet<Array<{ userId: string; name: string; email: string; avatarUrl?: string | null }>>(`/api/enrollments/class/${classId}`);
  return list ?? [];
}

// --- Profiles ---

export async function getProfilesByIds(userIds: string[]): Promise<DbProfile[]> {
  if (userIds.length === 0) return [];
  const list = await apiPost<{ userId: string; name: string; email: string; avatarUrl?: string | null }[]>(
    '/api/profiles/by-ids',
    userIds
  );
  return (list ?? []).map((p) => ({
    id: p.userId,
    user_id: p.userId,
    name: p.name,
    email: p.email,
    avatar_url: p.avatarUrl ?? null,
    created_at: '',
    updated_at: '',
  }));
}

// --- Assignments ---

export async function getAssignmentsByClass(classId: string): Promise<DbAssignment[]> {
  const list = await apiGet<Array<Record<string, unknown>>>(`/api/assignments/class/${classId}`);
  return (list ?? []).map((a) => ({
    id: String(a.id),
    class_id: String(a.classId),
    title: String(a.title),
    description: a.description != null ? String(a.description) : null,
    points: Number(a.points),
    due_date: String(a.dueDate),
    created_at: String(a.createdAt),
    topic: a.topic != null ? String(a.topic) : null,
    type: (a.type as DbAssignment['type']) ?? 'assignment',
    quiz_id: a.quizId != null ? String(a.quizId) : null,
    question_set_id: a.questionSetId != null ? String(a.questionSetId) : null,
    updated_at: String(a.createdAt),
  }));
}

// --- Quizzes ---

export async function getQuizById(quizId: string): Promise<DbQuiz | null> {
  try {
    const q = await apiGet<{
      id: string;
      classId: string;
      title: string;
      description?: string | null;
      topic?: string | null;
      questions: Question[];
      totalPoints: number;
      dueDate: string;
      createdAt: string;
      requireFullscreen: boolean;
      timeLimit?: number | null;
    }>(`/api/quizzes/${quizId}`);
    if (!q) return null;
    return {
      id: q.id,
      class_id: q.classId,
      title: q.title,
      description: q.description ?? null,
      topic: q.topic ?? null,
      questions: q.questions,
      total_points: q.totalPoints,
      due_date: q.dueDate,
      require_fullscreen: q.requireFullscreen,
      time_limit: q.timeLimit ?? null,
      created_at: q.createdAt,
      updated_at: q.createdAt,
    };
  } catch {
    return null;
  }
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
  timeLimit: number | null,
  paperPdfUrl: string | null,
  isPaperBased: boolean
): Promise<DbQuiz> {
  const q = await apiPost<{
    id: string;
    classId: string;
    title: string;
    description?: string | null;
    topic?: string | null;
    questions: Question[];
    totalPoints: number;
    dueDate: string;
    createdAt: string;
    requireFullscreen: boolean;
    timeLimit?: number | null;
    paperPdfUrl?: string | null;
    isPaperBased?: boolean;
  }>('/api/quizzes', {
    classId,
    title,
    description: description ?? undefined,
    topic: topic ?? undefined,
    questions,
    totalPoints,
    dueDate,
    requireFullscreen,
    timeLimit: timeLimit ?? undefined,
    paperPdfUrl: paperPdfUrl ?? undefined,
    isPaperBased: isPaperBased ?? false,
  });
  return {
    id: q.id,
    class_id: q.classId,
    title: q.title,
    description: q.description ?? null,
    topic: q.topic ?? null,
    questions: q.questions,
    total_points: q.totalPoints,
    due_date: q.dueDate,
    require_fullscreen: q.requireFullscreen,
    time_limit: q.timeLimit ?? null,
    paper_pdf_url: q.paperPdfUrl ?? null,
    is_paper_based: q.isPaperBased ?? false,
    created_at: q.createdAt,
    updated_at: q.createdAt,
  };
}

export async function getQuizSubmissionsByQuiz(quizId: string): Promise<DbQuizSubmission[]> {
  const list = await apiGet<Array<{ id: string; studentId: string; submittedAt: string; score: number; totalPoints: number; status: string; timeTaken?: number | null }>>(
    `/api/quizzes/${quizId}/submissions`
  );
  return (list ?? []).map((s) => ({
    id: s.id,
    quiz_id: quizId,
    user_id: s.studentId,
    answers: {},
    score: s.score,
    time_taken: s.timeTaken ?? null,
    started_at: s.submittedAt,
    submitted_at: s.submittedAt,
    created_at: s.submittedAt,
  }));
}

export async function getMyQuizSubmission(_quizId: string, _userId: string): Promise<DbQuizSubmission | null> {
  return null;
}

export async function upsertQuizSubmission(
  quizId: string,
  _userId: string,
  answers: Record<string, string>,
  score: number,
  timeTaken: number | null,
  submitted: boolean
): Promise<DbQuizSubmission> {
  if (submitted) {
    await apiPost(`/api/quizzes/${quizId}/submit`, { answers, score, timeTaken: timeTaken ?? undefined });
  }
  return {
    id: '',
    quiz_id: quizId,
    user_id: '',
    answers,
    score,
    time_taken: timeTaken,
    started_at: new Date().toISOString(),
    submitted_at: submitted ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  };
}

// --- Question Sets ---

export async function getQuestionSetById(id: string): Promise<DbQuestionSet | null> {
  try {
    const q = await apiGet<{
      id: string;
      classId: string;
      title: string;
      description?: string | null;
      topic?: string | null;
      questions: Question[];
      totalPoints: number;
      dueDate: string;
      createdAt: string;
    }>(`/api/questionsets/${id}`);
    if (!q) return null;
    return {
      id: q.id,
      class_id: q.classId,
      title: q.title,
      description: q.description ?? null,
      topic: q.topic ?? null,
      questions: q.questions,
      total_points: q.totalPoints,
      due_date: q.dueDate,
      created_at: q.createdAt,
      updated_at: q.createdAt,
    };
  } catch {
    return null;
  }
}

export async function getQuestionSetSubmissionsByQuestionSet(questionSetId: string): Promise<Array<DbQuestionSetSubmission & { studentName: string }>> {
  const list = await apiGet<Array<{ id: string; studentId: string; studentName: string; submittedAt: string; score: number; totalPoints: number; status: string; timeTaken?: number | null }>>(
    `/api/questionsets/${questionSetId}/submissions`
  );
  return list.map(s => ({
    id: s.id,
    question_set_id: questionSetId,
    user_id: s.studentId,
    studentName: s.studentName,
    answers_json: '{}',
    score: s.score,
    time_taken: s.timeTaken ?? null,
    started_at: s.submittedAt,
    submitted_at: s.submittedAt,
    created_at: s.submittedAt,
  }));
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
  const q = await apiPost<{
    id: string;
    classId: string;
    title: string;
    description?: string | null;
    topic?: string | null;
    questions: Question[];
    totalPoints: number;
    dueDate: string;
    createdAt: string;
  }>('/api/questionsets', {
    classId,
    title,
    description: description ?? undefined,
    topic: topic ?? undefined,
    questions,
    totalPoints,
    dueDate,
  });
  return {
    id: q.id,
    class_id: q.classId,
    title: q.title,
    description: q.description ?? null,
    topic: q.topic ?? null,
    questions: q.questions,
    total_points: q.totalPoints,
    due_date: q.dueDate,
    created_at: q.createdAt,
    updated_at: q.createdAt,
  };
}

// --- Materials ---

export async function getMaterialsByClass(classId: string): Promise<DbMaterial[]> {
  const list = await apiGet<Array<{ id: string; classId: string; title: string; description?: string | null; topic?: string | null; createdAt: string; attachments: { name: string; type: string; url: string }[] }>>(
    `/api/materials/class/${classId}`
  );
  return (list ?? []).map((m) => ({
    id: m.id,
    class_id: m.classId,
    title: m.title,
    description: m.description ?? null,
    topic: m.topic ?? null,
    attachments: m.attachments ?? [],
    created_at: m.createdAt,
    updated_at: m.createdAt,
  }));
}

export async function createMaterial(
  classId: string,
  title: string,
  description: string | null,
  topic: string | null,
  attachments?: { name: string; type: string; url: string }[]
): Promise<DbMaterial> {
  const m = await apiPost<{
    id: string;
    classId: string;
    title: string;
    description?: string | null;
    topic?: string | null;
    createdAt: string;
    attachments: { name: string; type: string; url: string }[];
  }>('/api/materials', {
    classId,
    title,
    description: description ?? undefined,
    topic: topic ?? undefined,
    attachments: attachments ?? [],
  });
  return {
    id: m.id,
    class_id: m.classId,
    title: m.title,
    description: m.description ?? null,
    topic: m.topic ?? null,
    attachments: m.attachments ?? [],
    created_at: m.createdAt,
    updated_at: m.createdAt,
  };
}

// --- Announcements ---

export async function getAnnouncementsByClass(classId: string): Promise<DbAnnouncement[]> {
  const list = await apiGet<Array<{ id: string; classId: string; authorId: string; authorName: string; content: string; createdAt: string; attachments?: { name: string; type: string; url: string }[] }>>(
    `/api/announcements/class/${classId}`
  );
  return (list ?? []).map((a) => ({
    id: a.id,
    class_id: a.classId,
    author_id: a.authorId,
    content: a.content,
    attachments: a.attachments ?? [],
    created_at: a.createdAt,
    updated_at: a.createdAt,
  }));
}

export async function createAnnouncement(classId: string, _authorId: string, content: string): Promise<DbAnnouncement> {
  const a = await apiPost<{ id: string; classId: string; authorId: string; content: string; createdAt: string; attachments?: { name: string; type: string; url: string }[] }>(
    '/api/announcements',
    { classId, content }
  );
  return {
    id: a.id,
    class_id: a.classId,
    author_id: a.authorId,
    content: a.content,
    attachments: a.attachments ?? [],
    created_at: a.createdAt,
    updated_at: a.createdAt,
  };
}

// --- Question Set Submissions (if used elsewhere) ---

export async function getQuestionSetSubmissions(questionSetId: string): Promise<DbQuestionSetSubmission[]> {
  return getQuestionSetSubmissionsByQuestionSet(questionSetId);
}

export async function upsertQuestionSetSubmission(
  _questionSetId: string,
  _userId: string,
  _answers: Record<string, string>,
  _timeTaken: number | null,
  _submitted: boolean
) {
  return null;
}

// Admin API functions
export interface AdminUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

export interface TeacherSchedule {
  id: string;
  teacherId: string;
  teacherName: string;
  classId?: string;
  className: string;
  section?: string;
  subject?: string;
  room?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>('/api/admin/users');
}

export async function approveUser(userId: string): Promise<void> {
  return apiPost(`/api/admin/users/${userId}/approve`, {});
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  return apiPost(`/api/admin/users/${userId}/role`, { role });
}

export async function getSchedules(): Promise<TeacherSchedule[]> {
  return apiGet<TeacherSchedule[]>('/api/admin/schedules');
}

export async function createSchedule(data: {
  teacherId: string;
  className: string;
  section?: string;
  subject?: string;
  room?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}): Promise<TeacherSchedule> {
  return apiPost<TeacherSchedule>('/api/admin/schedules', data);
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  return apiDelete(`/api/admin/schedules/${scheduleId}`);
}

// Template API functions
export interface QuizTemplate {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  questions: Question[];
  totalPoints: number;
  requireFullscreen: boolean;
  timeLimit?: number;
  isApproved?: boolean;
  status: string; // 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Published'
}

export interface AssignmentTemplate {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  points: number;
  isApproved?: boolean;
  status: string; // 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Published'
}

export interface MaterialTemplate {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  fileUrl?: string;
  linkUrl?: string;
  isApproved?: boolean;
  status: string; // 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Published'
}

// Quiz Templates
export async function getQuizTemplates(): Promise<QuizTemplate[]> {
  return apiGet<QuizTemplate[]>('/api/templates/quizzes');
}

export async function getPersonalQuizTemplates(): Promise<QuizTemplate[]> {
  return apiGet<QuizTemplate[]>('/api/templates/quizzes/personal');
}

export async function getQuizTemplate(id: string): Promise<QuizTemplate> {
  return apiGet<QuizTemplate>(`/api/templates/quizzes/${id}`);
}

export async function createQuizTemplate(data: {
  title: string;
  description?: string;
  topic?: string;
  questions?: Question[];
  totalPoints: number;
  requireFullscreen: boolean;
  timeLimit?: number;
  publish?: boolean;
}): Promise<QuizTemplate> {
  return apiPost<QuizTemplate>('/api/templates/quizzes', data);
}

export async function updateQuizTemplate(id: string, data: {
  title: string;
  description?: string;
  topic?: string;
  questions?: Question[];
  totalPoints: number;
  requireFullscreen: boolean;
  timeLimit?: number;
}): Promise<QuizTemplate> {
  return apiPut<QuizTemplate>(`/api/templates/quizzes/${id}`, data);
}

export async function deleteQuizTemplate(templateId: string): Promise<void> {
  return apiDelete(`/api/templates/quizzes/${templateId}`);
}

// Assignment Templates
export async function getAssignmentTemplates(): Promise<AssignmentTemplate[]> {
  return apiGet<AssignmentTemplate[]>('/api/templates/assignments');
}

export async function getPersonalAssignmentTemplates(): Promise<AssignmentTemplate[]> {
  return apiGet<AssignmentTemplate[]>('/api/templates/assignments/personal');
}

export async function getAssignmentTemplate(id: string): Promise<AssignmentTemplate> {
  return apiGet<AssignmentTemplate>(`/api/templates/assignments/${id}`);
}

export async function createAssignmentTemplate(data: {
  title: string;
  description?: string;
  topic?: string;
  points: number;
  publish?: boolean;
}): Promise<AssignmentTemplate> {
  return apiPost<AssignmentTemplate>('/api/templates/assignments', data);
}

export async function updateAssignmentTemplate(id: string, data: {
  title: string;
  description?: string;
  topic?: string;
  points: number;
}): Promise<AssignmentTemplate> {
  return apiPut<AssignmentTemplate>(`/api/templates/assignments/${id}`, data);
}

export async function deleteAssignmentTemplate(templateId: string): Promise<void> {
  return apiDelete(`/api/templates/assignments/${templateId}`);
}

// Material Templates
export async function getMaterialTemplates(): Promise<MaterialTemplate[]> {
  return apiGet<MaterialTemplate[]>('/api/templates/materials');
}

export async function getPersonalMaterialTemplates(): Promise<MaterialTemplate[]> {
  return apiGet<MaterialTemplate[]>('/api/templates/materials/personal');
}

export async function getMaterialTemplate(id: string): Promise<MaterialTemplate> {
  return apiGet<MaterialTemplate>(`/api/templates/materials/${id}`);
}

export async function createMaterialTemplate(data: {
  title: string;
  description?: string;
  topic?: string;
  fileUrl?: string;
  linkUrl?: string;
  publish?: boolean;
}): Promise<MaterialTemplate> {
  return apiPost<MaterialTemplate>('/api/templates/materials', data);
}

export async function updateMaterialTemplate(id: string, data: {
  title: string;
  description?: string;
  topic?: string;
  fileUrl?: string;
  linkUrl?: string;
}): Promise<MaterialTemplate> {
  return apiPut<MaterialTemplate>(`/api/templates/materials/${id}`, data);
}

export async function deleteMaterialTemplate(templateId: string): Promise<void> {
  return apiDelete(`/api/templates/materials/${templateId}`);
}

// Request Approval Templates
export async function requestApprovalQuizTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/quizzes/${id}/request-approval`);
}

export async function requestApprovalAssignmentTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/assignments/${id}/request-approval`);
}

export async function requestApprovalMaterialTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/materials/${id}/request-approval`);
}

// Publish Templates (after approval)
export async function publishQuizTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/quizzes/${id}/publish`);
}

export async function publishAssignmentTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/assignments/${id}/publish`);
}

export async function publishMaterialTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/materials/${id}/publish`);
}

// Unpublish Templates
export async function unpublishQuizTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/quizzes/${id}/unpublish`);
}

export async function unpublishAssignmentTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/assignments/${id}/unpublish`);
}

export async function unpublishMaterialTemplate(id: string): Promise<void> {
  return apiPost(`/api/templates/materials/${id}/unpublish`);
}

// Admin Template Approval
export interface TemplateForApproval {
  id: string;
  type: 'quiz' | 'assignment' | 'material';
  title: string;
  createdBy: string;
  creatorName: string;
  isApproved: boolean;
  createdAt: string;
  status?: string; // 'PendingApproval' | 'Approved'
}

export async function getQuizTemplatesForApproval(): Promise<TemplateForApproval[]> {
  return apiGet<TemplateForApproval[]>('/api/admin/templates/quizzes');
}

export async function getAssignmentTemplatesForApproval(): Promise<TemplateForApproval[]> {
  return apiGet<TemplateForApproval[]>('/api/admin/templates/assignments');
}

export async function getMaterialTemplatesForApproval(): Promise<TemplateForApproval[]> {
  return apiGet<TemplateForApproval[]>('/api/admin/templates/materials');
}

export async function approveQuizTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/quizzes/${id}/approve`);
}

export async function rejectQuizTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/quizzes/${id}/reject`);
}

export async function approveAssignmentTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/assignments/${id}/approve`);
}

export async function rejectAssignmentTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/assignments/${id}/reject`);
}

export async function approveMaterialTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/materials/${id}/approve`);
}

export async function rejectMaterialTemplate(id: string): Promise<void> {
  return apiPost(`/api/admin/templates/materials/${id}/reject`);
}
