import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CLASS_COLORS = [
  'class-blue',
  'class-green', 
  'class-purple',
  'class-orange',
  'class-teal',
  'class-pink',
];

const colorClasses: Record<string, string> = {
  'class-blue': 'bg-class-blue',
  'class-green': 'bg-class-green',
  'class-purple': 'bg-class-purple',
  'class-orange': 'bg-class-orange',
  'class-teal': 'bg-class-teal',
  'class-pink': 'bg-class-pink',
};

export function AddClassDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  
  // Join form state
  const [streamCode, setStreamCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Create form state
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [selectedColor, setSelectedColor] = useState(CLASS_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const { joinClass, createClass } = useApp();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamCode.trim()) {
      toast.error('Please enter a stream code');
      return;
    }

    setIsJoining(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = joinClass(streamCode.trim());
    
    setIsJoining(false);
    
    if (result.success) {
      toast.success(result.message);
      setStreamCode('');
      setOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = createClass({
      name: className.trim(),
      section: section.trim() || undefined,
      subject: subject.trim() || undefined,
      room: room.trim() || undefined,
      coverColor: selectedColor,
    });
    
    setIsCreating(false);
    
    if (result.success) {
      toast.success(result.message);
      setClassName('');
      setSection('');
      setSubject('');
      setRoom('');
      setSelectedColor(CLASS_COLORS[0]);
      setOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const resetForm = () => {
    setStreamCode('');
    setClassName('');
    setSection('');
    setSubject('');
    setRoom('');
    setSelectedColor(CLASS_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-soft gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Class</DialogTitle>
          <DialogDescription>
            Join an existing class or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'join' | 'create')} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Class</TabsTrigger>
            <TabsTrigger value="create">Create Class</TabsTrigger>
          </TabsList>
          
          <TabsContent value="join" className="mt-4">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streamCode">Stream Code</Label>
                <Input
                  id="streamCode"
                  placeholder="e.g., MATH2026"
                  value={streamCode}
                  onChange={(e) => setStreamCode(e.target.value.toUpperCase())}
                  className="uppercase tracking-wider text-lg font-mono"
                  maxLength={20}
                  autoComplete="off"
                />
                <p className="text-sm text-muted-foreground">
                  Ask the class creator for the stream code
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isJoining || !streamCode.trim()}
                  className="rounded-xl gradient-primary"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="create" className="mt-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  placeholder="e.g., Advanced Mathematics"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  maxLength={100}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="e.g., Period 1"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    placeholder="e.g., Room 204"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cover Color</Label>
                <div className="flex gap-2">
                  {CLASS_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full ${colorClasses[color]} transition-all ${
                        selectedColor === color 
                          ? 'ring-2 ring-offset-2 ring-primary' 
                          : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !className.trim()}
                  className="rounded-xl gradient-primary"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
