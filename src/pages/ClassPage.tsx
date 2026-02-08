import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StreamTab } from '@/components/class/StreamTab';
import { ClassworkTab } from '@/components/class/ClassworkTab';
import { PeopleTab } from '@/components/class/PeopleTab';
import { MaterialsTab } from '@/components/class/MaterialsTab';
import { cn } from '@/lib/utils';

const colorClasses: Record<string, string> = {
  'class-blue': 'bg-class-blue',
  'class-green': 'bg-class-green',
  'class-purple': 'bg-class-purple',
  'class-orange': 'bg-class-orange',
  'class-teal': 'bg-class-teal',
  'class-pink': 'bg-class-pink',
};

export default function ClassPage() {
  const { classId, tab = 'stream' } = useParams<{ classId: string; tab?: string }>();
  const navigate = useNavigate();
  const { getClassById } = useApp();

  const classData = classId ? getClassById(classId) : undefined;

  if (!classData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Class not found</p>
        </div>
      </AppLayout>
    );
  }

  const coverColorClass = colorClasses[classData.coverColor] || 'bg-class-teal';

  const handleTabChange = (value: string) => {
    navigate(`/class/${classId}/${value}`);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Class Header */}
        <div className={cn('h-48 p-6 relative', coverColorClass)}>
          <div className="max-w-5xl mx-auto h-full flex flex-col justify-end">
            <h1 className="text-3xl font-bold text-white mb-1">{classData.name}</h1>
            <p className="text-white/90">{classData.section}</p>
            {classData.room && (
              <p className="text-white/80 text-sm mt-1">{classData.room}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto">
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="bg-transparent h-12 gap-2 p-0">
                <TabsTrigger 
                  value="stream"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                >
                  Stream
                </TabsTrigger>
                <TabsTrigger 
                  value="classwork"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                >
                  Classwork
                </TabsTrigger>
                <TabsTrigger 
                  value="people"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                >
                  People
                </TabsTrigger>
                <TabsTrigger 
                  value="materials"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                >
                  Materials
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stream" className="mt-0">
                <StreamTab classId={classData.id} />
              </TabsContent>
              <TabsContent value="classwork" className="mt-0">
                <ClassworkTab classId={classData.id} />
              </TabsContent>
              <TabsContent value="people" className="mt-0">
                <PeopleTab classId={classData.id} />
              </TabsContent>
              <TabsContent value="materials" className="mt-0">
                <MaterialsTab classId={classData.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
