import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Maximize, AlertTriangle, FileText, Trophy, Timer, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SubmissionsLeaderboard } from '@/components/class/SubmissionsLeaderboard';
import { QuizTimer, useQuizDeadline } from '@/components/class/QuizTimer';
import { format } from 'date-fns';
import type { QuizAttempt } from '@/types/classwork';
import type { Quiz, SubmissionEntry } from '@/contexts/DataContext';
import { downloadFile } from '@/lib/api';

const CACHE_KEY_PREFIX = 'quiz_attempt_';

export default function QuizPage() {
  const { classId, quizId } = useParams<{ classId: string; quizId: string }>();
  const navigate = useNavigate();
  const { getQuizById, getClassById, isCreatorOfClass, getQuizSubmissions, submitQuizAttempt, getClassMembers } = useData();
  const { profile } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizSubmissions, setQuizSubmissions] = useState<SubmissionEntry[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const classData = classId ? getClassById(classId) : undefined;
  const isCreator = classId ? isCreatorOfClass(classId) : false;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // Check if deadline has passed
  const isPastDeadline = useQuizDeadline(quiz?.dueDate || new Date().toISOString());

  const handleDownloadQuizReport = async () => {
    if (!quizId) return;
    setIsDownloadingReport(true);
    try {
      await downloadFile(`/api/quizzes/${quizId}/report`, `Quiz_Report_${quiz.title.replace(/\s+/g, '_')}.xlsx`);
      toast.success('Quiz report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading quiz report:', error);
      toast.error('Failed to download quiz report');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;
      
      setIsLoadingQuiz(true);
      try {
        const quizData = await getQuizById(quizId);
        setQuiz(quizData);
        
        if (quizData) {
          const submissions = await getQuizSubmissions(quizId);
          setQuizSubmissions(submissions);
        }
        
        if (classId) {
          const members = await getClassMembers(classId);
          setStudentCount(members.filter(m => !m.isCreator).length);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setIsLoadingQuiz(false);
      }
    }
    loadQuiz();
  }, [quizId, classId]);

  // Load cached attempt
  useEffect(() => {
    if (quizId && !isCreator && quiz) {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${quizId}`);
      if (cached) {
        try {
          const attempt: QuizAttempt = JSON.parse(cached);
          if (!attempt.submittedAt) {
            setAnswers(attempt.answers);
            setHasStarted(true);
            if (attempt.timerStartedAt) {
              setTimerStartedAt(attempt.timerStartedAt);
              // Check if timer already expired
              if (quiz.timeLimit) {
                const startTime = new Date(attempt.timerStartedAt).getTime();
                const endTime = startTime + quiz.timeLimit * 60 * 1000;
                if (Date.now() > endTime) {
                  setIsTimerExpired(true);
                }
              }
            }
          } else {
            setIsSubmitted(true);
            setAnswers(attempt.answers);
          }
        } catch (e) {
          console.error('Failed to parse cached quiz attempt');
        }
      }
    }
  }, [quizId, isCreator, quiz]);

  // Save to cache whenever answers change
  useEffect(() => {
    if (quizId && hasStarted && !isSubmitted && !isCreator && !isTimerExpired && !isPastDeadline) {
      const attempt: QuizAttempt = {
        quizId,
        answers,
        startedAt: new Date().toISOString(),
        timerStartedAt: timerStartedAt || undefined,
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
    }
  }, [quizId, answers, hasStarted, isSubmitted, isCreator, timerStartedAt, isTimerExpired, isPastDeadline]);

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
    const now = new Date().toISOString();
    setHasStarted(true);
    setTimerStartedAt(now);
    
    const attempt: QuizAttempt = {
      quizId: quizId!,
      answers: {},
      startedAt: now,
      timerStartedAt: now,
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (isTimerExpired || isPastDeadline || isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!quiz) return { score: 0, total: 0, percentage: 0 };
    let score = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        score += q.points;
      }
    });
    return {
      score,
      total: quiz.totalPoints,
      percentage: Math.round((score / quiz.totalPoints) * 100),
    };
  }, [quiz, answers]);

  const handleTimerExpire = useCallback(async () => {
    setIsTimerExpired(true);
    exitFullscreen();
    toast.error('Time is up! Your quiz has been automatically saved.');
    
    // Auto-submit current answers
    if (quizId && quiz) {
      const { score } = calculateScore();
      const timeTaken = timerStartedAt 
        ? Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000)
        : undefined;
      
      const attempt: QuizAttempt = {
        quizId,
        answers,
        startedAt: timerStartedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        timerStartedAt: timerStartedAt || undefined,
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
      
      try {
        await submitQuizAttempt(quizId, answers, score, timeTaken);
      } catch (error) {
        console.error('Error submitting quiz:', error);
      }
    }
  }, [quizId, quiz, answers, timerStartedAt, exitFullscreen, submitQuizAttempt, calculateScore]);

  const handleSubmit = async () => {
    if (!quiz || isTimerExpired || isPastDeadline) return;

    // Check for unanswered questions
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    const { score } = calculateScore();
    const timeTaken = timerStartedAt 
      ? Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000)
      : undefined;

    // Save as submitted
    const attempt: QuizAttempt = {
      quizId: quizId!,
      answers,
      startedAt: timerStartedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      timerStartedAt: timerStartedAt || undefined,
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(attempt));
    
    // Submit to database
    try {
      await submitQuizAttempt(quizId!, answers, score, timeTaken);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
    
    setIsSubmitted(true);
    exitFullscreen();
    toast.success('Quiz submitted successfully!');
  };

  if (isLoadingQuiz) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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

  // Creator view with tabs
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
                {quiz.description && (
                  <p className="text-muted-foreground mb-4">{quiz.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadQuizReport}
                  disabled={isDownloadingReport}
                  className="flex items-center gap-2"
                >
                  {isDownloadingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Quiz Report
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{quiz.totalPoints} points</span>
              <span>•</span>
              <span>{quiz.questions.length} questions</span>
              {quiz.timeLimit && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    <Timer className="w-3 h-3 mr-1" />
                    {quiz.timeLimit} min timer
                  </Badge>
                </>
              )}
              {quiz.requireFullscreen && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    <Maximize className="w-3 h-3 mr-1" />
                    Fullscreen Required
                  </Badge>
                </>
              )}
              <span>•</span>
              <span>Due: {format(new Date(quiz.dueDate), 'MMM d, yyyy h:mm a')}</span>
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
                submissions={quizSubmissions}
                title={quiz.title}
                totalStudents={studentCount}
              />
            </TabsContent>

            <TabsContent value="questions">
              <Card className="shadow-card rounded-2xl">
                <CardContent className="p-6">
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
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // Deadline passed view (before starting)
  if (isPastDeadline && !hasStarted && !isSubmitted) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 px-4">
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Quiz Deadline Passed</h1>
              <p className="text-muted-foreground mb-6">
                The deadline for this quiz was {format(new Date(quiz.dueDate), 'MMM d, yyyy h:mm a')}. 
                You can no longer take this quiz.
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

  // Timer expired or submitted - Results view
  if (isTimerExpired || isSubmitted || (isPastDeadline && hasStarted)) {
    const { score, total, percentage } = calculateScore();
    
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

          <Card className="shadow-card rounded-2xl mb-6">
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                percentage >= 70 ? 'bg-primary/10' : 'bg-secondary/10'
              }`}>
                {isTimerExpired ? (
                  <Clock className="w-10 h-10 text-secondary" />
                ) : (
                  <CheckCircle className={`w-10 h-10 ${percentage >= 70 ? 'text-primary' : 'text-secondary'}`} />
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {isTimerExpired ? 'Time Expired' : 'Quiz Completed!'}
              </h1>
              <p className="text-muted-foreground mb-4">
                {isTimerExpired 
                  ? 'Your time ran out. Here are your results based on what you answered.'
                  : 'Your answers have been recorded. Here are your results.'}
              </p>
              <div className="text-4xl font-bold mb-2">
                <span className={percentage >= 70 ? 'text-primary' : 'text-secondary'}>{score}</span>
                <span className="text-muted-foreground">/{total}</span>
              </div>
              <p className="text-lg text-muted-foreground">{percentage}%</p>
            </CardContent>
          </Card>

          {/* Show answers and results */}
          <h2 className="text-lg font-semibold mb-4">Your Answers</h2>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctOptionId;
              
              return (
                <Card key={question.id} className="shadow-card rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                        {isCorrect ? (
                          <Badge variant="default" className="bg-primary">Correct</Badge>
                        ) : (
                          <Badge variant="destructive">Incorrect</Badge>
                        )}
                      </div>
                      <Badge variant="secondary">{question.points} pts</Badge>
                    </div>
                    <p className="font-medium mb-4">{question.text}</p>

                    <div className="space-y-2">
                      {question.options?.map((option) => {
                        const isUserAnswer = option.id === userAnswer;
                        const isCorrectOption = option.id === question.correctOptionId;
                        
                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border ${
                              isCorrectOption
                                ? 'bg-primary/10 border-primary'
                                : isUserAnswer && !isCorrectOption
                                ? 'bg-destructive/10 border-destructive'
                                : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.text}</span>
                              <div className="flex items-center gap-2">
                                {isUserAnswer && (
                                  <Badge variant="outline" className="text-xs">Your answer</Badge>
                                )}
                                {isCorrectOption && (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Start screen for students
  if (!hasStarted) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 px-4">
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground mb-6">{quiz.description}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span>{quiz.totalPoints} points</span>
                <span>•</span>
                <span>{quiz.questions.length} questions</span>
                {quiz.timeLimit && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">
                      <Timer className="w-3 h-3 mr-1" />
                      {quiz.timeLimit} min
                    </Badge>
                  </>
                )}
              </div>

              {quiz.timeLimit && (
                <div className="bg-secondary/10 p-4 rounded-xl mb-4 flex items-center gap-3">
                  <Timer className="w-5 h-5 text-secondary" />
                  <p className="text-sm text-left">
                    You will have <strong>{quiz.timeLimit} minutes</strong> to complete this quiz once you start.
                    The timer cannot be paused.
                  </p>
                </div>
              )}

              {quiz.requireFullscreen && (
                <div className="bg-muted/50 p-4 rounded-xl mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-secondary" />
                  <p className="text-sm text-left">
                    This quiz requires fullscreen mode. You must stay in fullscreen until you submit.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-6">
                Deadline: {format(new Date(quiz.dueDate), 'MMM d, yyyy h:mm a')}
              </p>

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

  // Quiz taking interface
  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'p-6' : ''}`}>
      {!isFullscreen && (
        <AppLayout>
          <div className="max-w-3xl mx-auto py-6 px-4">
            <QuizContentWithTimer
              quiz={quiz}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              progress={progress}
              answeredCount={answeredCount}
              timeLimit={quiz.timeLimit}
              timerStartedAt={timerStartedAt}
              onTimerExpire={handleTimerExpire}
            />
          </div>
        </AppLayout>
      )}
      {isFullscreen && (
        <div className="max-w-3xl mx-auto">
          <QuizContentWithTimer
            quiz={quiz}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            progress={progress}
            answeredCount={answeredCount}
            timeLimit={quiz.timeLimit}
            timerStartedAt={timerStartedAt}
            onTimerExpire={handleTimerExpire}
          />
        </div>
      )}
    </div>
  );
}

interface QuizContentProps {
  quiz: Quiz;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  progress: number;
  answeredCount: number;
  timeLimit?: number;
  timerStartedAt: string | null;
  onTimerExpire: () => void;
}

function QuizContentWithTimer({ 
  quiz, 
  answers, 
  onAnswerChange, 
  onSubmit, 
  progress, 
  answeredCount,
  timeLimit,
  timerStartedAt,
  onTimerExpire
}: QuizContentProps) {
  return (
    <>
      {/* Progress Header with Timer */}
      <div className="sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-semibold">{quiz.title}</h1>
          <div className="flex items-center gap-4">
            {timeLimit && timerStartedAt && (
              <QuizTimer 
                timeLimit={timeLimit}
                startedAt={timerStartedAt}
                onExpire={onTimerExpire}
              />
            )}
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {quiz.questions.length}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Questions */}
      {quiz.isPaperBased && quiz.paperPdfUrl ? (
        <div className="grid grid-cols-2 gap-6">
          {/* PDF Viewer on Left */}
          <div className="sticky top-4 h-[calc(100vh-8rem)]">
            <Card className="shadow-card rounded-2xl h-full">
              <CardContent className="p-0 h-full">
                <iframe
                  src={quiz.paperPdfUrl}
                  className="w-full h-full rounded-2xl"
                  title="Question Paper PDF"
                />
              </CardContent>
            </Card>
          </div>

          {/* OMR Options on Right */}
          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="shadow-card rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm text-muted-foreground font-semibold">Question {index + 1}</span>
                    <Badge variant="secondary">{question.points} pts</Badge>
                  </div>

                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => onAnswerChange(question.id, value)}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {question.options?.map((option, optIndex) => {
                        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D, etc.
                        return (
                          <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer flex items-center gap-2">
                              <span className="font-semibold text-primary w-6">{optionLabel}.</span>
                              <span className="flex-1">{option.text || optionLabel}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
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
      )}

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={onSubmit} className="gradient-primary px-8">
          Submit Quiz
        </Button>
      </div>
    </>
  );
}
