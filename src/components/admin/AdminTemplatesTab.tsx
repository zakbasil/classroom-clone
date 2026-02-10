import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  getQuizTemplatesForApproval,
  getAssignmentTemplatesForApproval,
  getMaterialTemplatesForApproval,
  approveQuizTemplate,
  rejectQuizTemplate,
  approveAssignmentTemplate,
  rejectAssignmentTemplate,
  approveMaterialTemplate,
  rejectMaterialTemplate,
  type TemplateForApproval,
} from '@/lib/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminTemplatesTab() {
  const [quizTemplates, setQuizTemplates] = useState<TemplateForApproval[]>([]);
  const [assignmentTemplates, setAssignmentTemplates] = useState<TemplateForApproval[]>([]);
  const [materialTemplates, setMaterialTemplates] = useState<TemplateForApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [quizzes, assignments, materials] = await Promise.all([
        getQuizTemplatesForApproval(),
        getAssignmentTemplatesForApproval(),
        getMaterialTemplatesForApproval(),
      ]);
      setQuizTemplates(quizzes);
      setAssignmentTemplates(assignments);
      setMaterialTemplates(materials);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (type: 'quiz' | 'assignment' | 'material', id: string) => {
    try {
      if (type === 'quiz') {
        await approveQuizTemplate(id);
      } else if (type === 'assignment') {
        await approveAssignmentTemplate(id);
      } else {
        await approveMaterialTemplate(id);
      }
      toast.success('Template approved successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error approving template:', error);
      toast.error('Failed to approve template');
    }
  };

  const handleReject = async (type: 'quiz' | 'assignment' | 'material', id: string) => {
    try {
      if (type === 'quiz') {
        await rejectQuizTemplate(id);
      } else if (type === 'assignment') {
        await rejectAssignmentTemplate(id);
      } else {
        await rejectMaterialTemplate(id);
      }
      toast.success('Template rejected');
      loadTemplates();
    } catch (error) {
      console.error('Error rejecting template:', error);
      toast.error('Failed to reject template');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-600"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'PendingApproval':
        return <Badge variant="secondary">Pending Approval</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const TemplateList = ({ templates, type }: { templates: TemplateForApproval[]; type: 'quiz' | 'assignment' | 'material' }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No templates to review.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {templates.map((template) => {
          const isApproved = template.status === 'Approved';
          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      {getStatusBadge(template.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created by: {template.creatorName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {!isApproved && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(type, template.id)}
                        className="text-destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(type, template.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                  {isApproved && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Already Approved
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Template Approval</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve pending templates to make them available to all teachers
          </p>
        </div>

      <Tabs defaultValue="quizzes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quiz Templates ({quizTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Assignment Templates ({assignmentTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Material Templates ({materialTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <TemplateList templates={quizTemplates} type="quiz" />
        </TabsContent>

        <TabsContent value="assignments">
          <TemplateList templates={assignmentTemplates} type="assignment" />
        </TabsContent>

        <TabsContent value="materials">
          <TemplateList templates={materialTemplates} type="material" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
