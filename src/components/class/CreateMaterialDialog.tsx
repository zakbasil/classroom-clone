import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getMaterialTemplates, createMaterialTemplate, type MaterialTemplate } from '@/lib/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateMaterialDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateMaterialDialog({ classId, open, onOpenChange, onCreated }: CreateMaterialDialogProps) {
  const { createMaterial } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<MaterialTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  useEffect(() => {
    if (open && useTemplate) {
      loadTemplates();
    }
  }, [open, useTemplate]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await getMaterialTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setDescription(template.description || '');
      setTopic(template.topic || '');
      setSelectedTemplateId(templateId);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMaterial(classId, title, description || undefined, topic || undefined);
      toast.success('Material added successfully!');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error('Failed to add material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSavingTemplate(true);
    try {
      await createMaterialTemplate({
        title,
        description: description || undefined,
        topic: topic || undefined,
      });
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
    setUseTemplate(false);
    setSelectedTemplateId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Reuse Option */}
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
            <Switch
              checked={useTemplate}
              onCheckedChange={setUseTemplate}
            />
            <Label className="flex items-center gap-2 cursor-pointer">
              <FileText className="w-4 h-4" />
              Reuse from Template
            </Label>
          </div>

          {useTemplate && (
            <div className="space-y-2">
              <Label>Select Template</Label>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {templates.length === 0 && !isLoadingTemplates && (
                <p className="text-sm text-muted-foreground">
                  No templates available. Create templates in the Templates section.
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
            />
          </div>
          <div>
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Chapter 5"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate || !title.trim()}
              className="flex items-center gap-2"
            >
              {isSavingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Save as Template
                </>
              )}
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Material'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
