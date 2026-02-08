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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, QuestionType, QuestionOption } from '@/types/classwork';

interface CreateQuestionsDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questionTypeLabels: Record<QuestionType, string> = {
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  multiple_choice: 'Multiple Choice',
  code: 'Code',
};

export function CreateQuestionsDialog({ classId, open, onOpenChange }: CreateQuestionsDialogProps) {
  const { addQuestionSet } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = (type: QuestionType = 'short_answer') => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      text: '',
      points: 10,
      options: type === 'multiple_choice' ? [
        { id: `opt-${Date.now()}-1`, text: '' },
        { id: `opt-${Date.now()}-2`, text: '' },
      ] : undefined,
      correctOptionId: undefined,
      codeLanguage: type === 'code' ? 'javascript' : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    
    // Handle type change
    if (updates.type) {
      if (updates.type === 'multiple_choice' && !updated[index].options) {
        updated[index].options = [
          { id: `opt-${Date.now()}-1`, text: '' },
          { id: `opt-${Date.now()}-2`, text: '' },
        ];
      }
      if (updates.type === 'code' && !updated[index].codeLanguage) {
        updated[index].codeLanguage = 'javascript';
      }
    }
    
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
      toast.error('Please enter a title');
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
      if (q.type === 'multiple_choice') {
        if (!q.correctOptionId) {
          toast.error(`Please select the correct answer for question ${i + 1}`);
          return;
        }
        if (q.options?.some(opt => !opt.text.trim())) {
          toast.error(`All options in question ${i + 1} must have text`);
          return;
        }
      }
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    addQuestionSet({
      classId,
      title,
      description,
      topic,
      questions,
      totalPoints,
      dueDate,
    });

    toast.success('Questions created successfully!');
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTopic('');
    setDueDate('');
    setQuestions([]);
  };

  const renderQuestionInput = (question: Question, qIndex: number) => {
    switch (question.type) {
      case 'multiple_choice':
        return (
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
        );
      case 'code':
        return (
          <div className="pl-4">
            <Select
              value={question.codeLanguage || 'javascript'}
              onValueChange={(value) => updateQuestion(qIndex, { codeLanguage: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Students will write code in a code editor (not executed)
            </p>
          </div>
        );
      case 'short_answer':
        return (
          <p className="text-sm text-muted-foreground pl-4">
            Students will provide a brief text response
          </p>
        );
      case 'long_answer':
        return (
          <p className="text-sm text-muted-foreground pl-4">
            Students will provide an extended text response
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Questions</DialogTitle>
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
                placeholder="Question set title"
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
                  placeholder="e.g., Chapter 5"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Questions</h3>
              <div className="flex gap-2">
                <Select onValueChange={(value) => addQuestion(value as QuestionType)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Add Question" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="long_answer">Long Answer</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No questions yet. Select a question type to add.</p>
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
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={question.type}
                                  onValueChange={(value) => updateQuestion(qIndex, { type: value as QuestionType })}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="long_answer">Long Answer</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="code">Code</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
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

                          {renderQuestionInput(question, qIndex)}
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
              Create Questions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
