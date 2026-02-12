import { useState, useEffect, useRef } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Clock, Loader2, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getQuizTemplates, createQuizTemplate, type QuizTemplate } from '@/lib/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Question } from '@/types/classwork';

interface CreateQuizDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type QuizMode = 'question' | 'paper';

export function CreateQuizDialog({ classId, open, onOpenChange, onCreated }: CreateQuizDialogProps) {
  const { createQuiz } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [requireFullscreen, setRequireFullscreen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [paperNumQuestions, setPaperNumQuestions] = useState<number>(5);
  const [paperOptionsPerQuestion, setPaperOptionsPerQuestion] = useState<number>(4);
  const [paperPdfFile, setPaperPdfFile] = useState<File | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && useTemplate) {
      loadTemplates();
    }
  }, [open, useTemplate]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await getQuizTemplates();
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
      setTimeLimit(template.timeLimit || '');
      setRequireFullscreen(template.requireFullscreen);
      setQuestions(template.questions.map(q => ({ ...q }))); // Deep copy
      setSelectedTemplateId(templateId);
    }
  };

  const generateAlphabeticLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

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

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setPaperPdfFile(file);
    }
    // Reset input
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const handleOpenAnswerModal = () => {
    if (!paperPdfFile) {
      toast.error('Please upload a PDF file first');
      return;
    }
    if (paperNumQuestions < 1) {
      toast.error('Please enter a valid number of questions');
      return;
    }
    if (paperOptionsPerQuestion < 2) {
      toast.error('Please enter at least 2 options per question');
      return;
    }
    setShowAnswerModal(true);
  };

  const handleAnswerModalSubmit = () => {
    // Validate all questions have answers
    const missingAnswers: number[] = [];
    for (let i = 0; i < paperNumQuestions; i++) {
      if (!correctAnswers[i]) {
        missingAnswers.push(i + 1);
      }
    }
    if (missingAnswers.length > 0) {
      toast.error(`Please select answers for questions: ${missingAnswers.join(', ')}`);
      return;
    }

    // Generate questions with correct answers
    const newQuestions: Question[] = [];
    for (let i = 0; i < paperNumQuestions; i++) {
      const options = [];
      let correctOptionId: string | undefined;
      
      for (let j = 0; j < paperOptionsPerQuestion; j++) {
        const optionId = `opt-${Date.now()}-${i}-${j}`;
        options.push({
          id: optionId,
          text: `${generateAlphabeticLabel(j)}. `,
        });
        
        // Set correct option based on answer
        if (correctAnswers[i] === generateAlphabeticLabel(j)) {
          correctOptionId = optionId;
        }
      }
      
      newQuestions.push({
        id: `q-${Date.now()}-${i}`,
        type: 'multiple_choice',
        text: `Question ${i + 1}`,
        points: 10,
        options,
        correctOptionId,
      });
    }
    
    setQuestions(newQuestions);
    setShowAnswerModal(false);
    setCorrectAnswers({});
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
    
    // Combine date and time
    let fullDueDate = dueDate;
    if (dueTime) {
      fullDueDate = `${dueDate}T${dueTime}:00`;
    }

    setIsSubmitting(true);
    try {
      // Convert PDF to data URL if paper-based quiz
      let paperPdfUrl: string | undefined;
      if (quizMode === 'paper' && paperPdfFile) {
        paperPdfUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(paperPdfFile);
        });
      }

      await createQuiz(
        classId,
        title,
        description || undefined,
        topic || undefined,
        questions,
        totalPoints,
        fullDueDate,
        requireFullscreen,
        timeLimit ? Number(timeLimit) : undefined,
        quizMode === 'paper' ? paperPdfUrl : undefined,
        quizMode === 'paper'
      );

      toast.success('Quiz created successfully!');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error('Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    setIsSavingTemplate(true);
    try {
      await createQuizTemplate({
        title,
        description: description || undefined,
        topic: topic || undefined,
        questions,
        totalPoints,
        requireFullscreen,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
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
    setDueDate('');
    setDueTime('');
    setTimeLimit('');
    setRequireFullscreen(false);
    setQuestions([]);
    setUseTemplate(false);
    setSelectedTemplateId('');
    setQuizMode(null);
    setPaperNumQuestions(5);
    setPaperOptionsPerQuestion(4);
    setPaperPdfFile(null);
    setCorrectAnswers({});
    setShowAnswerModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                        {template.title} ({template.questions.length} questions, {template.totalPoints} pts)
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
            {questions.length === 0 && !quizMode && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Question Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQuizMode('question');
                      addQuestion();
                    }}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span>Add Question</span>
                    <span className="text-xs text-muted-foreground">Manual entry</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuizMode('paper')}
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span>Add Paper</span>
                    <span className="text-xs text-muted-foreground">Bulk generation</span>
                  </Button>
                </div>
              </div>
            )}

            {quizMode === 'paper' && questions.length === 0 && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <Label className="text-base font-semibold">Paper Configuration</Label>
                
                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label>Upload Question Paper (PDF)</Label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {paperPdfFile ? 'Change PDF' : 'Upload PDF'}
                    </Button>
                    {paperPdfFile && (
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-destructive shrink-0" />
                          <span className="text-sm truncate">{paperPdfFile.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(paperPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPaperPdfFile(null)}
                          className="h-6 w-6 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Number of Questions and Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numQuestions">Number of Questions</Label>
                    <Input
                      id="numQuestions"
                      type="number"
                      min={1}
                      max={50}
                      value={paperNumQuestions}
                      onChange={(e) => setPaperNumQuestions(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optionsPerQuestion">Options per Question</Label>
                    <Input
                      id="optionsPerQuestion"
                      type="number"
                      min={2}
                      max={10}
                      value={paperOptionsPerQuestion}
                      onChange={(e) => setPaperOptionsPerQuestion(parseInt(e.target.value) || 2)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleOpenAnswerModal}
                    className="gradient-primary"
                    disabled={!paperPdfFile}
                  >
                    Set Correct Answers
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQuizMode(null);
                      setQuestions([]);
                      setPaperPdfFile(null);
                      setCorrectAnswers({});
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {questions.length > 0 && (
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Questions ({questions.length})</h3>
                {quizMode === 'question' && (
                  <Button onClick={addQuestion} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                )}
              </div>
            )}

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
                                <span className="w-6 text-sm font-medium text-muted-foreground">
                                  {generateAlphabeticLabel(oIndex)}.
                                </span>
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${generateAlphabeticLabel(oIndex)}`}
                                  className={question.correctOptionId === option.id ? 'border-primary' : ''}
                                />
                                {question.options && question.options.length > 2 && quizMode === 'question' && (
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
                            {quizMode === 'question' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(qIndex)}
                                className="text-primary"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Option
                              </Button>
                            )}
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
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate || !title.trim() || questions.length === 0}
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
                    Creating...
                  </>
                ) : (
                  'Create Quiz'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* OMR Answer Modal */}
      {showAnswerModal && (
        <Dialog open={showAnswerModal} onOpenChange={setShowAnswerModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set Correct Answers (OMR Style)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Select the correct answer for each question. Answers are labeled A, B, C, D, etc.
              </p>
              
              <div className="grid grid-cols-5 gap-2">
                {/* Header */}
                <div className="font-semibold text-sm">Question</div>
                {Array.from({ length: paperOptionsPerQuestion }, (_, i) => (
                  <div key={i} className="font-semibold text-sm text-center">
                    {generateAlphabeticLabel(i)}
                  </div>
                ))}
                
                {/* Rows for each question */}
                {Array.from({ length: paperNumQuestions }, (_, qIndex) => (
                  <>
                    <div className="flex items-center font-medium">
                      Q{qIndex + 1}
                    </div>
                    {Array.from({ length: paperOptionsPerQuestion }, (_, oIndex) => {
                      const optionLabel = generateAlphabeticLabel(oIndex);
                      const isSelected = correctAnswers[qIndex] === optionLabel;
                      return (
                        <div key={oIndex} className="flex justify-center">
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={isSelected}
                            onChange={() => {
                              setCorrectAnswers(prev => ({
                                ...prev,
                                [qIndex]: optionLabel,
                              }));
                            }}
                            className="w-5 h-5 text-primary cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAnswerModal(false);
                    setCorrectAnswers({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAnswerModalSubmit}
                  className="gradient-primary"
                >
                  Generate Questions
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
