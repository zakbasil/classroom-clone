import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StreamTab } from '@/components/class/StreamTab';
import { ClassworkTab } from '@/components/class/ClassworkTab';
import { PeopleTab } from '@/components/class/PeopleTab';
import { MaterialsTab } from '@/components/class/MaterialsTab';
import { StreamCodeDisplay } from '@/components/class/StreamCodeDisplay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/api';

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
  const { getClassById, isCreatorOfClass, isLoading } = useData();
  const [isDownloadingClassReport, setIsDownloadingClassReport] = useState(false);

  const classData = classId ? getClassById(classId) : undefined;
  const isCreator = classId ? isCreatorOfClass(classId) : false;

  const handleDownloadClassReport = async () => {
    if (!classId) return;
    setIsDownloadingClassReport(true);
    try {
      await downloadFile(`/api/classes/${classId}/quizzes/report`, `Class_Quiz_Report_${classData?.name.replace(/\s+/g, '_') || 'Report'}.xlsx`);
      toast.success('Class quiz report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading class report:', error);
      toast.error('Failed to download class quiz report');
    } finally {
      setIsDownloadingClassReport(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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
          
          {/* Stream Code and Download Report for Creators */}
          {isCreator && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-3">
              <StreamCodeDisplay streamCode={classData.streamCode} />
              <Button
                variant="outline"
                onClick={handleDownloadClassReport}
                disabled={isDownloadingClassReport}
                className="flex items-center gap-2 bg-white/90 hover:bg-white"
              >
                {isDownloadingClassReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Class Report
                  </>
                )}
              </Button>
            </div>
          )}
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
