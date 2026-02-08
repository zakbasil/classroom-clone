import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockClasses, mockAssignments, mockAnnouncements, mockStudents, mockSubmissions, mockMaterials } from '@/data/mockData';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface ClassData {
  id: string;
  name: string;
  section?: string;
  subject?: string;
  room?: string;
  teacherName: string;
  teacherAvatar?: string;
  coverColor: string;
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
  attachments?: { name: string; type: string; url: string }[];
  status?: 'assigned' | 'submitted' | 'graded' | 'late' | 'missing';
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

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  classes: ClassData[];
  assignments: Assignment[];
  announcements: Announcement[];
  students: Student[];
  submissions: Submission[];
  materials: Material[];
  getClassById: (id: string) => ClassData | undefined;
  getAssignmentsByClass: (classId: string) => Assignment[];
  getAnnouncementsByClass: (classId: string) => Announcement[];
  getStudentsByClass: (classId: string) => Student[];
  getSubmissionsByAssignment: (assignmentId: string) => Submission[];
  getMaterialsByClass: (classId: string) => Material[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const teacherUser: User = {
  id: 'teacher-1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@school.edu',
  avatar: undefined,
  role: 'teacher',
};

const studentUser: User = {
  id: 'student-1',
  name: 'Alex Chen',
  email: 'alex.chen@school.edu',
  avatar: undefined,
  role: 'student',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('teacher');

  const currentUser = currentRole === 'teacher' ? teacherUser : studentUser;

  const getClassById = (id: string) => mockClasses.find((c) => c.id === id);
  
  const getAssignmentsByClass = (classId: string) => 
    mockAssignments.filter((a) => a.classId === classId);
  
  const getAnnouncementsByClass = (classId: string) => 
    mockAnnouncements.filter((a) => a.classId === classId);
  
  const getStudentsByClass = (_classId: string) => mockStudents;
  
  const getSubmissionsByAssignment = (assignmentId: string) => 
    mockSubmissions.filter((s) => s.assignmentId === assignmentId);
  
  const getMaterialsByClass = (classId: string) => 
    mockMaterials.filter((m) => m.classId === classId);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        classes: mockClasses,
        assignments: mockAssignments,
        announcements: mockAnnouncements,
        students: mockStudents,
        submissions: mockSubmissions,
        materials: mockMaterials,
        getClassById,
        getAssignmentsByClass,
        getAnnouncementsByClass,
        getStudentsByClass,
        getSubmissionsByAssignment,
        getMaterialsByClass,
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
