import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockClasses as initialClasses, mockAssignments, mockAnnouncements, mockStudents, mockSubmissions, mockMaterials, mockEnrollments as initialEnrollments } from '@/data/mockData';

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

interface AppContextType {
  currentUser: User;
  classes: ClassData[];
  assignments: Assignment[];
  announcements: Announcement[];
  students: Student[];
  submissions: Submission[];
  materials: Material[];
  enrollments: Enrollment[];
  getClassById: (id: string) => ClassData | undefined;
  getAssignmentsByClass: (classId: string) => Assignment[];
  getAnnouncementsByClass: (classId: string) => Announcement[];
  getStudentsByClass: (classId: string) => Student[];
  getSubmissionsByAssignment: (assignmentId: string) => Submission[];
  getMaterialsByClass: (classId: string) => Material[];
  getUserClasses: () => ClassData[];
  getClassByStreamCode: (code: string) => ClassData | undefined;
  joinClass: (streamCode: string) => { success: boolean; message: string };
  createClass: (input: CreateClassInput) => { success: boolean; message: string; classData?: ClassData };
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

  const getClassById = (id: string) => classes.find((c) => c.id === id);
  
  const getAssignmentsByClass = (classId: string) => 
    mockAssignments.filter((a) => a.classId === classId);
  
  const getAnnouncementsByClass = (classId: string) => 
    mockAnnouncements.filter((a) => a.classId === classId);
  
  const getStudentsByClass = (_classId: string) => mockStudents;
  
  const getSubmissionsByAssignment = (assignmentId: string) => 
    mockSubmissions.filter((s) => s.assignmentId === assignmentId);
  
  const getMaterialsByClass = (classId: string) => 
    mockMaterials.filter((m) => m.classId === classId);

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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        classes,
        assignments: mockAssignments,
        announcements: mockAnnouncements,
        students: mockStudents,
        submissions: mockSubmissions,
        materials: mockMaterials,
        enrollments,
        getClassById,
        getAssignmentsByClass,
        getAnnouncementsByClass,
        getStudentsByClass,
        getSubmissionsByAssignment,
        getMaterialsByClass,
        getUserClasses,
        getClassByStreamCode,
        joinClass,
        createClass,
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
