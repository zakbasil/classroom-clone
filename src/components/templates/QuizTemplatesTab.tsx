import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, CheckCircle, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getQuizTemplates,
  getPersonalQuizTemplates,
  getQuizTemplate,
  deleteQuizTemplate,
  publishQuizTemplate,
  unpublishQuizTemplate,
  requestApprovalQuizTemplate,
  type QuizTemplate,
} from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import { CreateQuizTemplateDialog } from './CreateQuizTemplateDialog';
import { EditQuizTemplateDialog } from './EditQuizTemplateDialog';

export function QuizTemplatesTab() {
  const { isAdmin, userId } = useAuth();
  const [approvedTemplates, setApprovedTemplates] = useState<QuizTemplate[]>([]);
  const [personalTemplates, setPersonalTemplates] = useState<QuizTemplate[]>([]);
  const [allPersonalTemplates, setAllPersonalTemplates] = useState<QuizTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [allTemplates, personal] = await Promise.all([
        getQuizTemplates(),
        getPersonalQuizTemplates(),
      ]);
      
      // Separate published templates (available to all) and personal templates
      const published = allTemplates.filter(t => t.status === 'Published');
      const personalTemplatesList = personal.filter(t => t.status !== 'Published');
      
      setApprovedTemplates(published);
      setPersonalTemplates(personalTemplatesList);
      setAllPersonalTemplates(personal); // Keep all personal templates including published ones
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteQuizTemplate(templateId);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = async (template: QuizTemplate) => {
    try {
      const fullTemplate = await getQuizTemplate(template.id);
      setEditingTemplate(fullTemplate);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  const handleRequestApproval = async (templateId: string) => {
    try {
      await requestApprovalQuizTemplate(templateId);
      toast.success('Template submitted for approval');
      loadTemplates();
    } catch (error) {
      console.error('Error requesting approval:', error);
      toast.error('Failed to submit template for approval');
    }
  };

  const handlePublish = async (templateId: string) => {
    try {
      await publishQuizTemplate(templateId);
      toast.success('Template published successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error publishing template:', error);
      toast.error('Failed to publish template');
    }
  };

  const handleUnpublish = async (templateId: string) => {
    try {
      await unpublishQuizTemplate(templateId);
      toast.success('Template unpublished successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error unpublishing template:', error);
      toast.error('Failed to unpublish template');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />Published</Badge>;
      case 'Approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-600"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'PendingApproval':
        return <Badge variant="secondary">Pending Approval</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return null;
    }
  };

  const TemplateCard = ({ template, isPersonal }: { template: QuizTemplate; isPersonal: boolean }) => (
    <Card key={template.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{template.title}</CardTitle>
              {getStatusBadge(template.status)}
            </div>
          </div>
          <div className="flex gap-1">
            {isPersonal && template.status === 'Approved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePublish(template.id)}
                className="text-primary"
                title="Publish Template"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
            {isPersonal && template.status === 'Published' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnpublish(template.id)}
                className="text-orange-600"
                title="Unpublish Template"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
            {isPersonal && (template.status === 'Draft' || template.status === 'Rejected') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestApproval(template.id)}
                className="text-primary"
                title="Request Approval"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
            {(isPersonal || template.status === 'Published') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(template)}
                className="text-primary"
                title={template.status === 'Published' ? 'Edit (will unpublish)' : 'Edit'}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(template.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {template.description && (
          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{template.questions.length} questions</span>
          <span>•</span>
          <span>{template.totalPoints} points</span>
          {template.timeLimit && (
            <>
              <span>•</span>
              <span>{template.timeLimit} min</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quiz Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reuse approved templates or create your own personal templates
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Published Templates Section */}
      {approvedTemplates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Published Templates (Available to All Teachers)
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedTemplates.map((template) => {
              // Show edit/unpublish buttons for published templates if user is creator
              const isCreator = allPersonalTemplates.some(t => t.id === template.id);
              return <TemplateCard key={template.id} template={template} isPersonal={isCreator} />;
            })}
          </div>
        </div>
      )}

      {/* Personal Templates Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">My Personal Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personalTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} isPersonal={true} />
          ))}
          {personalTemplates.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No personal templates yet. Create your first template to get started.
            </div>
          )}
        </div>
      </div>

      <CreateQuizTemplateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={loadTemplates}
      />

      {editingTemplate && (
        <EditQuizTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          onUpdated={loadTemplates}
        />
      )}
    </div>
  );
}
