import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Maximize, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { QuizAttempt } from '@/types/classwork';

const CACHE_KEY_PREFIX = 'quiz_attempt_';

export default function QuizPage() {
  const { classId, quizId } = useParams<{ classId: string; quizId: string }>();
  const navigate = useNavigate();
  const { getQuizById, getClassById, isCreatorOfClass } = useApp();
  
  const quiz = quizId ? getQuizById(quizId) : undefined;
  const classData = classId ? getClassById(classId) : undefined;
  const isCreator = classId ? isCreatorOfClass(classId) : false;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load cached attempt
  useEffect(() => {
    if (quizId && !isCreator) {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${quizId}`);
      if (cached) {
        try {
          const attempt: QuizAttempt = JSON.parse(cached);
          if (!attempt.submittedAt) {
            setAnswers(attempt.answers);
            setHasStarted(true);
          } else {
            setIsSubmitted(true);
            setAnswers(attempt.answers);
          }
        } catch (e) {
          console.error('Failed to parse cached quiz attempt');
        }
      }
    }
  }, [quizId, isCreator]);

  // Save to cache whenever answers change
  useEffect(() => {
    if (quizId && hasStarted && !isSubmitted && !isCreator) {
      const attempt: QuizAttempt = {
        quizId,
        answers,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
    }
  }, [quizId, answers, hasStarted, isSubmitted, isCreator]);

  // Fullscreen handling
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (e) {
      console.error('Fullscreen not supported');
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleStartQuiz = async () => {
    if (quiz?.requireFullscreen) {
      await enterFullscreen();
    }
    setHasStarted(true);
    const attempt: QuizAttempt = {
      quizId: quizId!,
      answers: {},
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    // Check for unanswered questions
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    // Save as submitted
    const attempt: QuizAttempt = {
      quizId: quizId!,
      answers,
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
    
    setIsSubmitted(true);
    exitFullscreen();
    toast.success('Quiz submitted successfully!');
  };

  if (!quiz || !classData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Quiz not found</p>
        </div>
      </AppLayout>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  // Creator view
  if (isCreator) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-6 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/class/${classId}/classwork`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classwork
          </Button>

          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground mb-4">{quiz.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span>{quiz.totalPoints} points</span>
                <span>•</span>
                <span>{quiz.questions.length} questions</span>
                {quiz.requireFullscreen && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      <Maximize className="w-3 h-3 mr-1" />
                      Fullscreen Required
                    </Badge>
                  </>
                )}
              </div>

              <div className="space-y-6">
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge variant="secondary">{question.points} pts</Badge>
                    </div>
                    <p className="mb-3">{question.text}</p>
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Start screen for students
  if (!hasStarted && !isSubmitted) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 px-4">
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground mb-6">{quiz.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span>{quiz.totalPoints} points</span>
                <span>•</span>
                <span>{quiz.questions.length} questions</span>
              </div>

              {quiz.requireFullscreen && (
                <div className="bg-muted/50 p-4 rounded-xl mb-6 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <p className="text-sm text-left">
                    This quiz requires fullscreen mode. You must stay in fullscreen until you submit.
                  </p>
                </div>
              )}

              <Button onClick={handleStartQuiz} className="gradient-primary w-full">
                {quiz.requireFullscreen ? (
                  <>
                    <Maximize className="w-4 h-4 mr-2" />
                    Start Quiz in Fullscreen
                  </>
                ) : (
                  'Start Quiz'
                )}
              </Button>
            </CardContent>
          </Card>
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
              <h1 className="text-2xl font-bold mb-2">Quiz Submitted!</h1>
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

  // Quiz taking interface
  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'p-6' : ''}`}>
      {!isFullscreen && (
        <AppLayout>
          <div className="max-w-3xl mx-auto py-6 px-4">
            <QuizContent
              quiz={quiz}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              progress={progress}
              answeredCount={answeredCount}
            />
          </div>
        </AppLayout>
      )}
      {isFullscreen && (
        <div className="max-w-3xl mx-auto">
          <QuizContent
            quiz={quiz}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            progress={progress}
            answeredCount={answeredCount}
          />
        </div>
      )}
    </div>
  );
}

interface QuizContentProps {
  quiz: {
    title: string;
    totalPoints: number;
    questions: {
      id: string;
      text: string;
      points: number;
      options?: { id: string; text: string }[];
    }[];
  };
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  progress: number;
  answeredCount: number;
}

function QuizContent({ quiz, answers, onAnswerChange, onSubmit, progress, answeredCount }: QuizContentProps) {
  return (
    <>
      {/* Progress Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-semibold">{quiz.title}</h1>
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {quiz.questions.length} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <Card key={question.id} className="shadow-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                <Badge variant="secondary">{question.points} pts</Badge>
              </div>
              <p className="font-medium mb-4">{question.text}</p>

              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => onAnswerChange(question.id, value)}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={onSubmit} className="gradient-primary px-8">
          Submit Quiz
        </Button>
      </div>
    </>
  );
}
