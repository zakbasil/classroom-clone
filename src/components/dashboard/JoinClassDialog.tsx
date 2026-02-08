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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function JoinClassDialog() {
  const [open, setOpen] = useState(false);
  const [streamCode, setStreamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinClass } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamCode.trim()) {
      toast.error('Please enter a stream code');
      return;
    }

    setIsLoading(true);
    
    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = joinClass(streamCode.trim());
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(result.message);
      setStreamCode('');
      setOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-soft gradient-primary hover:opacity-90">
          <UserPlus className="w-4 h-4 mr-2" />
          Join Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Enter the stream code provided by your teacher to join their class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              Ask your teacher for the class stream code
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
              disabled={isLoading || !streamCode.trim()}
              className="rounded-xl gradient-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Class'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
