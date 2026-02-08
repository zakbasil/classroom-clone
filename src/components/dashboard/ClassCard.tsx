import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import type { ClassData } from '@/contexts/AppContext';
import { FolderOpen, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClassCardProps {
  classData: ClassData;
  style?: React.CSSProperties;
}

const colorClasses: Record<string, string> = {
  'class-blue': 'bg-class-blue',
  'class-green': 'bg-class-green',
  'class-purple': 'bg-class-purple',
  'class-orange': 'bg-class-orange',
  'class-teal': 'bg-class-teal',
  'class-pink': 'bg-class-pink',
};

export function ClassCard({ classData, style }: ClassCardProps) {
  const coverColorClass = colorClasses[classData.coverColor] || 'bg-class-teal';

  return (
    <Link to={`/class/${classData.id}`}>
      <Card 
        className="overflow-hidden bg-card shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl group animate-fade-in cursor-pointer"
        style={style}
      >
        {/* Cover Header */}
        <div className={cn("h-24 p-4 relative", coverColorClass)}>
          <div className="flex items-start justify-between">
            <div className="text-white">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:underline">
                {classData.name}
              </h3>
              <p className="text-sm text-white/80 mt-0.5">
                {classData.section}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Creator Name */}
          <p className="text-sm text-white/90 mt-2 absolute bottom-4 left-4">
            {classData.creatorName}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{classData.studentCount} students</span>
            {classData.upcomingAssignments > 0 && (
              <span className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {classData.upcomingAssignments} due
              </span>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-border px-4 py-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => e.preventDefault()}
          >
            <FolderOpen className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </Link>
  );
}
