import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Users, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PeopleTabProps {
  classId: string;
}

interface ClassMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isCreator: boolean;
}

export function PeopleTab({ classId }: PeopleTabProps) {
  const { getClassMembers, getClassById, isCreatorOfClass } = useData();
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const classData = getClassById(classId);
  const isCreator = isCreatorOfClass(classId);

  useEffect(() => {
    loadMembers();
  }, [classId]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getClassMembers(classId);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const creator = members.find(m => m.isCreator);
  const students = members.filter(m => !m.isCreator);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Creator Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Creator</h2>
        </div>
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {creator ? getInitials(creator.name) : classData ? getInitials(classData.creatorName) : 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{creator?.name || classData?.creatorName}</p>
                <p className="text-sm text-muted-foreground">Creator</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <span className="text-sm text-muted-foreground">({students.length})</span>
          </div>
          {isCreator && (
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
              <p className="text-muted-foreground">No members yet</p>
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
                  {isCreator && (
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
