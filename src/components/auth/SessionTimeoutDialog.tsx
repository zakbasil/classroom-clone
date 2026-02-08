import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
}

export function SessionTimeoutDialog({
  open,
  countdown,
  onStayLoggedIn,
}: SessionTimeoutDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Session Expiring</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Your session is about to expire due to inactivity. You will be logged out in{' '}
            <span className="font-bold text-destructive">{countdown}</span> seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayLoggedIn} className="w-full sm:w-auto">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
