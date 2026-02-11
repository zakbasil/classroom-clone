import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Edit, CheckCircle, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAssignmentTemplates,
  getPersonalAssignmentTemplates,
  getAssignmentTemplate,
  createAssignmentTemplate,
  updateAssignmentTemplate,
  deleteAssignmentTemplate,
  publishAssignmentTemplate,
  unpublishAssignmentTemplate,
  requestApprovalAssignmentTemplate,
  type AssignmentTemplate,
} from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AssignmentTemplatesTab() {
  const { isAdmin } = useAuth();
  const [approvedTemplates, setApprovedTemplates] = useState<AssignmentTemplate[]>([]);
  const [personalTemplates, setPersonalTemplates] = useState<AssignmentTemplate[]>([]);
  const [allPersonalTemplates, setAllPersonalTemplates] = useState<AssignmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AssignmentTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [points, setPoints] = useState<number>(100);
  const [isCreating, setIsCreating] = useState(false);
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [allTemplates, personal] = await Promise.all([
        getAssignmentTemplates(),
        getPersonalAssignmentTemplates(),
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

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    setIsCreating(true);
    try {
      await createAssignmentTemplate({
        title,
        description: description || undefined,
        topic: topic || undefined,
        points,
        publish: isAdmin() && publish,
      });
      if (isAdmin() && publish) {
        toast.success('Template created and published successfully');
      } else {
        toast.success('Template created successfully');
      }
      setTitle('');
      setDescription('');
      setTopic('');
      setPoints(100);
      setPublish(false);
      setIsCreateOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteAssignmentTemplate(templateId);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = async (template: AssignmentTemplate) => {
    try {
      const fullTemplate = await getAssignmentTemplate(template.id);
      setEditingTemplate(fullTemplate);
      setTitle(fullTemplate.title);
      setDescription(fullTemplate.description || '');
      setTopic(fullTemplate.topic || '');
      setPoints(fullTemplate.points);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    setIsCreating(true);
    try {
      await updateAssignmentTemplate(editingTemplate.id, {
        title,
        description: description || undefined,
        topic: topic || undefined,
        points,
      });
      toast.success('Template updated successfully');
      setEditingTemplate(null);
      setTitle('');
      setDescription('');
      setTopic('');
      setPoints(100);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRequestApproval = async (templateId: string) => {
    try {
      await requestApprovalAssignmentTemplate(templateId);
      toast.success('Template submitted for approval');
      loadTemplates();
    } catch (error) {
      console.error('Error requesting approval:', error);
      toast.error('Failed to submit template for approval');
    }
  };

  const handlePublish = async (templateId: string) => {
    try {
      await publishAssignmentTemplate(templateId);
      toast.success('Template published successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error publishing template:', error);
      toast.error('Failed to publish template');
    }
  };

  const handleUnpublish = async (templateId: string) => {
    try {
      await unpublishAssignmentTemplate(templateId);
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

  const TemplateCard = ({ template, isPersonal }: { template: AssignmentTemplate; isPersonal: boolean }) => (
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
        <div className="text-xs text-muted-foreground">
          {template.points} points
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assignment Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reuse approved templates or create your own personal templates
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment Template</DialogTitle>
              <DialogDescription>
                Create a reusable assignment template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Assignment Template Title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Template description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </div>
              </div>
              {isAdmin() && (
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                  <Switch
                    checked={publish}
                    onCheckedChange={setPublish}
                  />
                  <Label className="cursor-pointer">
                    Publish for all teachers (requires no approval)
                  </Label>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Template'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment Template</DialogTitle>
            <DialogDescription>
              Update your assignment template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment Template Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Template'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
