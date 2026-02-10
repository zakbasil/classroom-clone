import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, Shield, CheckCircle, XCircle, UserCheck, UserX, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminUsers,
  approveUser,
  updateUserRole,
  getSchedules,
  createSchedule,
  deleteSchedule,
  type AdminUser,
  type TeacherSchedule,
} from '@/lib/database';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminSchedulesTab } from '@/components/admin/AdminSchedulesTab';
import { AdminTemplatesTab } from '@/components/admin/AdminTemplatesTab';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<'admin' | 'student' | 'teacher'>('admin');

  if (!isAdmin()) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You must be an administrator to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users, schedules, and system settings</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeView === 'admin' ? 'default' : 'outline'}
                onClick={() => setActiveView('admin')}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin View
              </Button>
              <Button
                variant={activeView === 'teacher' ? 'default' : 'outline'}
                onClick={() => setActiveView('teacher')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Teacher View
              </Button>
              <Button
                variant={activeView === 'student' ? 'default' : 'outline'}
                onClick={() => setActiveView('student')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Student View
              </Button>
            </div>
          </div>
        </div>

        {activeView === 'admin' && (
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Teacher Schedules
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Template Approval
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminUsersTab />
            </TabsContent>

            <TabsContent value="schedules">
              <AdminSchedulesTab />
            </TabsContent>

            <TabsContent value="templates">
              <AdminTemplatesTab />
            </TabsContent>
          </Tabs>
        )}

        {activeView === 'teacher' && (
          <Card>
            <CardHeader>
              <CardTitle>Teacher View</CardTitle>
              <CardDescription>
                Viewing the application as a teacher. You have full access to create classes, quizzes, and manage students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Switch back to Admin View to manage users and schedules.
              </p>
            </CardContent>
          </Card>
        )}

        {activeView === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Student View</CardTitle>
              <CardDescription>
                Viewing the application as a student. You can join classes and complete assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Switch back to Admin View to manage users and schedules.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
