import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GraduationCap, Users } from 'lucide-react';

export function RoleToggle() {
  const { currentRole, setCurrentRole, currentUser } = useApp();

  const handleToggle = (checked: boolean) => {
    setCurrentRole(checked ? 'student' : 'teacher');
  };

  return (
    <div className="flex items-center gap-4">
      {/* User Info */}
      <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-border">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {currentRole === 'teacher' ? (
            <Users className="w-4 h-4 text-primary" />
          ) : (
            <GraduationCap className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">{currentUser.name}</p>
          <p className="text-muted-foreground text-xs capitalize">{currentRole}</p>
        </div>
      </div>

      {/* Role Toggle */}
      <div className="flex items-center gap-2">
        <Label 
          htmlFor="role-toggle" 
          className={`text-sm cursor-pointer transition-colors ${
            currentRole === 'teacher' ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          Teacher
        </Label>
        <Switch
          id="role-toggle"
          checked={currentRole === 'student'}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-primary"
        />
        <Label 
          htmlFor="role-toggle" 
          className={`text-sm cursor-pointer transition-colors ${
            currentRole === 'student' ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          Student
        </Label>
      </div>
    </div>
  );
}
