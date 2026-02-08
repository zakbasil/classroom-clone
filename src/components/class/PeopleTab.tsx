import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Users } from 'lucide-react';

interface PeopleTabProps {
  classId: string;
}

export function PeopleTab({ classId }: PeopleTabProps) {
  const { currentRole, getStudentsByClass, getClassById } = useApp();
  const students = getStudentsByClass(classId);
  const classData = getClassById(classId);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Teachers Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Teachers</h2>
        </div>
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {classData ? getInitials(classData.teacherName) : 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{classData?.teacherName}</p>
                <p className="text-sm text-muted-foreground">Teacher</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Students</h2>
            <span className="text-sm text-muted-foreground">({students.length})</span>
          </div>
          {currentRole === 'teacher' && (
            <Button variant="outline" className="rounded-xl">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          )}
        </div>

        {students.length === 0 ? (
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No students enrolled yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card rounded-2xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-border">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  </div>
                  {currentRole === 'teacher' && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
