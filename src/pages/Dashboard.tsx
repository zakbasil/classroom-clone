import { useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClassCard } from '@/components/dashboard/ClassCard';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';

export default function Dashboard() {
  const { currentRole, classes } = useApp();

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
          <Button className="rounded-xl shadow-soft gradient-primary hover:opacity-90">
            {currentRole === 'teacher' ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Join Class
              </>
            )}
          </Button>
        </div>

        {/* Class Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map((classItem, index) => (
            <ClassCard 
              key={classItem.id} 
              classData={classItem}
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
