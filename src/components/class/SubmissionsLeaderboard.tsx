import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export interface SubmissionEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  score: number;
  totalPoints: number;
  status: 'submitted' | 'graded' | 'pending';
  timeTaken?: number; // in minutes
}

interface SubmissionsLeaderboardProps {
  submissions: SubmissionEntry[];
  title: string;
  totalStudents: number;
}

export function SubmissionsLeaderboard({ submissions, title, totalStudents }: SubmissionsLeaderboardProps) {
  // Sort by score descending, then by time taken ascending
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeTaken || 0) - (b.timeTaken || 0);
  });

  const submittedCount = submissions.length;
  const pendingCount = totalStudents - submittedCount;
  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
    : 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-primary" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-secondary" />;
      default:
        return <span className="w-5 h-5 text-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'text-primary';
    if (percentage >= 70) return 'text-primary';
    if (percentage >= 50) return 'text-secondary';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-card rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{submittedCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card className="shadow-card rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-secondary" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="shadow-card rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{avgScore}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="shadow-card rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <XCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm">Students will appear here after submitting</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Time</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubmissions.map((submission, index) => (
                    <TableRow key={submission.id} className={index < 3 ? 'bg-muted/30' : ''}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {submission.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{submission.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getScoreColor(submission.score, submission.totalPoints)}`}>
                          {submission.score}/{submission.totalPoints}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({Math.round((submission.score / submission.totalPoints) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {submission.timeTaken ? (
                          <Badge variant="outline" className="text-xs">
                            {submission.timeTaken}m
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(submission.submittedAt), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
