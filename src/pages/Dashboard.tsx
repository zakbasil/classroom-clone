import { useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClassCard } from '@/components/dashboard/ClassCard';
import { JoinClassDialog } from '@/components/dashboard/JoinClassDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { currentRole, getClassesForCurrentUser } = useApp();
  const userClasses = getClassesForCurrentUser();

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {currentRole === 'teacher' ? 'Your Classes' : 'Enrolled Classes'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentRole === 'teacher' 
                ? 'Manage your courses and track student progress'
                : 'View your enrolled courses and upcoming work'
              }
            </p>
          </div>
          {currentRole === 'teacher' ? (
            <Button className="rounded-xl shadow-soft gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          ) : (
            <JoinClassDialog />
          )}
        </div>

        {/* Class Grid */}
        {userClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {currentRole === 'teacher' ? 'No classes yet' : 'Not enrolled in any classes'}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {currentRole === 'teacher' 
                ? 'Create your first class to get started teaching.'
                : 'Join a class using the stream code provided by your teacher.'
              }
            </p>
            {currentRole === 'student' && <JoinClassDialog />}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userClasses.map((classItem, index) => (
              <ClassCard 
                key={classItem.id} 
                classData={classItem}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
