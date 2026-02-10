import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getQuizTemplates,
  createQuizTemplate,
  deleteQuizTemplate,
  getAssignmentTemplates,
  createAssignmentTemplate,
  deleteAssignmentTemplate,
  getMaterialTemplates,
  createMaterialTemplate,
  deleteMaterialTemplate,
  type QuizTemplate,
  type AssignmentTemplate,
  type MaterialTemplate,
} from '@/lib/database';
import { QuizTemplatesTab } from '@/components/templates/QuizTemplatesTab';
import { AssignmentTemplatesTab } from '@/components/templates/AssignmentTemplatesTab';
import { MaterialTemplatesTab } from '@/components/templates/MaterialTemplatesTab';

export default function TemplatesPage() {
  const { isTeacher } = useAuth();

  if (!isTeacher()) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You must be a teacher to access templates.
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
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-muted-foreground">
            Create reusable templates for quizzes, assignments, and materials
          </p>
        </div>

        <Tabs defaultValue="quizzes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quiz Templates
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Assignment Templates
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Material Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            <QuizTemplatesTab />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentTemplatesTab />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialTemplatesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
