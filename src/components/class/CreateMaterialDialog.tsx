import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
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
import { toast } from 'sonner';

interface CreateMaterialDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMaterialDialog({ classId, open, onOpenChange }: CreateMaterialDialogProps) {
  const { addMaterial } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    addMaterial({
      classId,
      title,
      description,
      topic,
    });

    toast.success('Material added successfully!');
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="gradient-primary">
              Add Material
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
