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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Question } from '@/types/classwork';

interface CreateQuizDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateQuizDialog({ classId, open, onOpenChange }: CreateQuizDialogProps) {
  const { addQuiz } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [requireFullscreen, setRequireFullscreen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

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

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!dueDate) {
      toast.error('Please set a due date');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (!q.correctOptionId) {
        toast.error(`Please select the correct answer for question ${i + 1}`);
        return;
      }
      if (q.options?.some(opt => !opt.text.trim())) {
        toast.error(`All options in question ${i + 1} must have text`);
        return;
      }
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    addQuiz({
      classId,
      title,
      description,
      topic,
      questions,
      totalPoints,
      dueDate,
      dueTime,
      requireFullscreen,
      timeLimit: timeLimit ? Number(timeLimit) : undefined,
    });

    toast.success('Quiz created successfully!');
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
    setDueDate('');
    setDueTime('');
    setTimeLimit('');
    setRequireFullscreen(false);
    setQuestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for students..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topic">Topic (optional)</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Algebra"
                />
              </div>
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="timeLimit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="e.g., 30"
                    className="pl-10"
                    min={1}
                    max={300}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Deadline Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueTime">Deadline Time (optional)</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label htmlFor="fullscreen">Require Fullscreen</Label>
                <p className="text-sm text-muted-foreground">
                  Students must stay in fullscreen mode during the quiz
                </p>
              </div>
              <Switch
                id="fullscreen"
                checked={requireFullscreen}
                onCheckedChange={setRequireFullscreen}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Questions</h3>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No questions yet. Click "Add Question" to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, qIndex) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-grab" />
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Input
                                value={question.text}
                                onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                                placeholder={`Question ${qIndex + 1}`}
                                className="font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={question.points}
                                onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 0 })}
                                className="w-20"
                                min={1}
                              />
                              <span className="text-sm text-muted-foreground">pts</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Options */}
                          <div className="space-y-2 pl-4">
                            {question.options?.map((option, oIndex) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctOptionId === option.id}
                                  onChange={() => setCorrectOption(qIndex, option.id)}
                                  className="w-4 h-4 text-primary"
                                />
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  className={question.correctOptionId === option.id ? 'border-primary' : ''}
                                />
                                {question.options && question.options.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    className="shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(qIndex)}
                              className="text-primary"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="gradient-primary">
              Create Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
