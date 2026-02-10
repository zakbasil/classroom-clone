import { useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createQuizTemplate } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import type { Question } from '@/types/classwork';

interface CreateQuizTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateQuizTemplateDialog({ open, onOpenChange, onCreated }: CreateQuizTemplateDialogProps) {
  const { isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [requireFullscreen, setRequireFullscreen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publish, setPublish] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'multiple_choice',
      text: '',
      points: 10,
      options: [
        { id: `opt-${Date.now()}-1`, text: '' },
        { id: `opt-${Date.now()}-2`, text: '' },
      ],
      correctOptionId: undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];
    if (question.options) {
      question.options.push({ id: `opt-${Date.now()}`, text: '' });
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...questions];
    const question = updated[questionIndex];
    if (question.options) {
      question.options[optionIndex].text = text;
      setQuestions(updated);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const question = updated[questionIndex];
    if (question.options && question.options.length > 2) {
      question.options.splice(optionIndex, 1);
      setQuestions(updated);
    }
  };

  const setCorrectOption = (questionIndex: number, optionId: string) => {
    const updated = [...questions];
    updated[questionIndex].correctOptionId = optionId;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    setIsSubmitting(true);
    try {
      await createQuizTemplate({
        title,
        description: description || undefined,
        topic: topic || undefined,
        questions,
        totalPoints,
        requireFullscreen,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
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
      setTimeLimit('');
      setRequireFullscreen(false);
      setQuestions([]);
      setPublish(false);
      onCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quiz Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz Template Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
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
              <Label>Time Limit (minutes)</Label>
              <Input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Switch
                checked={requireFullscreen}
                onCheckedChange={setRequireFullscreen}
              />
              <Label>Require Fullscreen</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Questions</Label>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="font-medium">Question {qIndex + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="Question text"
                    />
                    <div className="flex items-center gap-2">
                      <Label>Points:</Label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {question.options?.map((option, optIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctOptionId === option.id}
                          onChange={() => setCorrectOption(qIndex, option.id)}
                        />
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        {question.options && question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(qIndex, optIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
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
  );
}
