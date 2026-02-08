import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronRight, Clock, CheckCircle, AlertCircle, ClipboardList, FileQuestion, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CreateClassworkMenu } from './CreateClassworkMenu';
import { useState, useEffect } from 'react';
import type { Assignment } from '@/contexts/DataContext';

interface ClassworkTabProps {
  classId: string;
}

export function ClassworkTab({ classId }: ClassworkTabProps) {
  const { getAssignmentsByClass, isCreatorOfClass } = useData();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isCreator = isCreatorOfClass(classId);

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await getAssignmentsByClass(classId);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group assignments by topic
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const topic = assignment.topic || 'No Topic';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(assignment);
    return acc;
  }, {} as Record<string, typeof assignments>);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-secondary" />;
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Submitted</Badge>;
      case 'graded':
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Graded</Badge>;
      case 'late':
        return <Badge variant="secondary" className="bg-secondary/10 text-secondary">Late</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="outline">Assigned</Badge>;
    }
  };

  const getAssignmentIcon = (type?: string) => {
    switch (type) {
      case 'quiz':
        return <ClipboardList className="w-5 h-5 text-primary" />;
      case 'questions':
        return <FileQuestion className="w-5 h-5 text-primary" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const getAssignmentLink = (assignment: Assignment) => {
    if (assignment.type === 'quiz' && assignment.quizId) {
      return `/class/${classId}/quiz/${assignment.quizId}`;
    }
    if (assignment.type === 'questions' && assignment.questionSetId) {
      return `/class/${classId}/questions/${assignment.questionSetId}`;
    }
    return `/class/${classId}/assignment/${assignment.id}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Create Button (Creator only) */}
      {isCreator && (
        <div className="mb-6">
          <CreateClassworkMenu classId={classId} onCreated={loadAssignments} />
        </div>
      )}

      {/* Assignments by Topic */}
      {Object.entries(groupedAssignments).length === 0 ? (
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No assignments yet</p>
            {isCreator && (
              <p className="text-sm text-muted-foreground mt-1">
                Click "Create" to add your first assignment
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAssignments).map(([topic, topicAssignments]) => (
            <div key={topic}>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {topic}
              </h3>
              <div className="space-y-2">
                {topicAssignments.map((assignment) => (
                  <Link 
                    key={assignment.id} 
                    to={getAssignmentLink(assignment)}
                  >
                    <Card className="shadow-card hover:shadow-elevated rounded-2xl transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {assignment.title}
                            </h4>
                            {assignment.type === 'quiz' && (
                              <Badge variant="outline" className="text-xs">Quiz</Badge>
                            )}
                            {assignment.type === 'questions' && (
                              <Badge variant="outline" className="text-xs">Questions</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>Due {format(new Date(assignment.dueDate), 'MMM d')}</span>
                            <span>•</span>
                            <span>{assignment.points} pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!isCreator && getStatusBadge(assignment.status)}
                          {!isCreator && getStatusIcon(assignment.status)}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
