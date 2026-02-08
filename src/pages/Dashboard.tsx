import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ClassCard } from '@/components/dashboard/ClassCard';
import { AddClassDialog } from '@/components/dashboard/AddClassDialog';
import { Plus, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { classes, isLoading } = useData();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Your Classes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses and track progress
            </p>
          </div>
          <AddClassDialog />
        </div>

        {/* Class Grid */}
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No classes yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Create a class or join one using a stream code.
            </p>
            <AddClassDialog />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((classItem, index) => (
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
