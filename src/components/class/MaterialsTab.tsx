import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, FileText, Link as LinkIcon, Download } from 'lucide-react';

interface MaterialsTabProps {
  classId: string;
}

export function MaterialsTab({ classId }: MaterialsTabProps) {
  const { currentRole, getMaterialsByClass } = useApp();
  const materials = getMaterialsByClass(classId);

  // Group materials by topic
  const groupedMaterials = materials.reduce((acc, material) => {
    const topic = material.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(material);
    return acc;
  }, {} as Record<string, typeof materials>);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-primary" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Add Material Button (Teacher only) */}
      {currentRole === 'teacher' && (
        <div className="mb-6">
          <Button className="rounded-xl gradient-primary shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </div>
      )}

      {/* Materials by Topic */}
      {Object.entries(groupedMaterials).length === 0 ? (
        <Card className="shadow-card rounded-2xl">
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No materials yet</p>
            {currentRole === 'teacher' && (
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Material" to share resources with your class
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMaterials).map(([topic, topicMaterials]) => (
            <div key={topic}>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {topic}
              </h3>
              <div className="space-y-3">
                {topicMaterials.map((material) => (
                  <Card key={material.id} className="shadow-card rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{material.title}</h4>
                          {material.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {material.description}
                            </p>
                          )}
                          
                          {/* Attachments */}
                          {material.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {material.attachments.map((attachment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 cursor-pointer transition-colors group"
                                >
                                  {getFileIcon(attachment.type)}
                                  <span className="truncate max-w-[150px]">{attachment.name}</span>
                                  <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
