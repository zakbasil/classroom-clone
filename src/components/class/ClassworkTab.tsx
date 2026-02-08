import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useParams } from 'react-router-dom';

interface ClassworkTabProps {
  classId: string;
}

export function ClassworkTab({ classId }: ClassworkTabProps) {
  const { currentRole, getAssignmentsByClass } = useApp();
  const assignments = getAssignmentsByClass(classId);

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
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
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Graded</Badge>;
      case 'late':
        return <Badge variant="secondary" className="bg-secondary/10 text-secondary">Late</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="outline">Assigned</Badge>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Create Button (Teacher only) */}
      {currentRole === 'teacher' && (
        <div className="mb-6">
          <Button className="rounded-xl gradient-primary shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      )}

      {/* Assignments by Topic */}
      {Object.entries(groupedAssignments).length === 0 ? (
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No assignments yet</p>
            {currentRole === 'teacher' && (
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
                    to={`/class/${classId}/assignment/${assignment.id}`}
                  >
                    <Card className="shadow-card hover:shadow-elevated rounded-2xl transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {assignment.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>Due {format(new Date(assignment.dueDate), 'MMM d')}</span>
                            <span>•</span>
                            <span>{assignment.points} pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {currentRole === 'student' && getStatusBadge(assignment.status)}
                          {currentRole === 'student' && getStatusIcon(assignment.status)}
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
