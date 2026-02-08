import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Code, FileText, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubmissionsLeaderboard } from '@/components/class/SubmissionsLeaderboard';
import type { QuestionSet, SubmissionEntry } from '@/contexts/DataContext';

const CACHE_KEY_PREFIX = 'questions_attempt_';

interface QuestionAttempt {
  questionSetId: string;
  answers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
}

export default function QuestionsPage() {
  const { classId, questionSetId } = useParams<{ classId: string; questionSetId: string }>();
  const navigate = useNavigate();
  const { getQuestionSetById, getClassById, isCreatorOfClass, getClassMembers } = useData();
  
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const classData = classId ? getClassById(classId) : undefined;
  const isCreator = classId ? isCreatorOfClass(classId) : false;

  // Mock submissions for question sets (would need a separate API call in real impl)
  const [questionSetSubmissions] = useState<SubmissionEntry[]>([]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load question set data
  useEffect(() => {
    async function loadQuestionSet() {
      if (!questionSetId) return;
      
      setIsLoading(true);
      try {
        const data = await getQuestionSetById(questionSetId);
        setQuestionSet(data);
        
        if (classId) {
          const members = await getClassMembers(classId);
          setStudentCount(members.filter(m => !m.isCreator).length);
        }
      } catch (error) {
        console.error('Error loading question set:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestionSet();
  }, [questionSetId, classId]);

  // Load cached attempt
  useEffect(() => {
    if (questionSetId && !isCreator && questionSet) {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${questionSetId}`);
      if (cached) {
        try {
          const attempt: QuestionAttempt = JSON.parse(cached);
          if (!attempt.submittedAt) {
            setAnswers(attempt.answers);
          } else {
            setIsSubmitted(true);
            setAnswers(attempt.answers);
          }
        } catch (e) {
          console.error('Failed to parse cached attempt');
        }
      }
    }
  }, [questionSetId, isCreator, questionSet]);

  // Save to cache whenever answers change
  useEffect(() => {
    if (questionSetId && !isSubmitted && !isCreator && Object.keys(answers).length > 0) {
      const attempt: QuestionAttempt = {
        questionSetId,
        answers,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${questionSetId}`, JSON.stringify(attempt));
    }
  }, [questionSetId, answers, isSubmitted, isCreator]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!questionSet) return;

    // Save as submitted
    const attempt: QuestionAttempt = {
      questionSetId: questionSetId!,
      answers,
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${questionSetId}`, JSON.stringify(attempt));
    
    setIsSubmitted(true);
    toast.success('Answers submitted successfully!');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!questionSet || !classData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Questions not found</p>
        </div>
      </AppLayout>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questionSet.questions.length) * 100;

  // Creator view
  if (isCreator) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/class/${classId}/classwork`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classwork
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{questionSet.title}</h1>
            {questionSet.description && (
              <p className="text-muted-foreground mb-4">{questionSet.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{questionSet.totalPoints} points</span>
              <span>•</span>
              <span>{questionSet.questions.length} questions</span>
            </div>
          </div>

          <Tabs defaultValue="submissions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="submissions" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Submissions
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submissions">
              <SubmissionsLeaderboard 
                submissions={questionSetSubmissions}
                title={questionSet.title}
                totalStudents={studentCount}
              />
            </TabsContent>

            <TabsContent value="questions">
              <Card className="shadow-card rounded-2xl">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {questionSet.questions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {question.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{question.points} pts</Badge>
                        </div>
                        <p className="mb-3">{question.text}</p>
                        
                        {question.type === 'multiple_choice' && (
                          <div className="space-y-2">
                            {question.options?.map((option) => (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg ${
                                  option.id === question.correctOptionId
                                    ? 'bg-primary/10 border border-primary'
                                    : 'bg-background border border-border'
                                }`}
                              >
                                {option.text}
                                {option.id === question.correctOptionId && (
                                  <Badge className="ml-2" variant="default">Correct</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'code' && (
                          <div className="bg-background p-3 rounded-lg border">
                            <code className="text-sm text-muted-foreground">
                              // {question.codeLanguage} code expected
                            </code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // Submitted screen
  if (isSubmitted) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 px-4">
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Answers Submitted!</h1>
              <p className="text-muted-foreground mb-6">
                Your answers have been recorded. Your teacher will review and grade your submission.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(`/class/${classId}/classwork`)}
              >
                Back to Classwork
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Question answering interface
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Progress Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/class/${classId}/classwork`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold">{questionSet.title}</h1>
            </div>
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {questionSet.questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questionSet.questions.map((question, index) => (
            <Card key={question.id} className="shadow-card rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {question.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge variant="secondary">{question.points} pts</Badge>
                </div>
                <p className="font-medium mb-4">{question.text}</p>

                {question.type === 'short_answer' && (
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}

                {question.type === 'long_answer' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer..."
                    rows={5}
                  />
                )}

                {question.type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="space-y-2">
                      {question.options?.map((option) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer py-2">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {question.type === 'code' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="w-4 h-4" />
                      <span>{question.codeLanguage || 'Code'}</span>
                    </div>
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder={`// Write your ${question.codeLanguage || 'code'} here...`}
                      className="font-mono text-sm"
                      rows={8}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSubmit} className="gradient-primary px-8">
            Submit Answers
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
