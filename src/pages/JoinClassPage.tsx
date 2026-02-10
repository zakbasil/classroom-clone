import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinClassPage() {
  const { streamCode } = useParams<{ streamCode: string }>();
  const navigate = useNavigate();
  const { joinClass } = useData();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedJoin = useRef(false);

  const handleJoin = async () => {
    if (!streamCode || isJoining || hasJoined) return;

    setIsJoining(true);
    setError(null);

    try {
      const result = await joinClass(streamCode.trim().toUpperCase());
      
      if (result.success) {
        setHasJoined(true);
        toast.success(result.message);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = 'Failed to join class. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!streamCode) {
      setError('Invalid invite link');
      return;
    }

    // Auto-join when page loads (only once)
    if (!hasAttemptedJoin.current) {
      hasAttemptedJoin.current = true;
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamCode, user]);

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Class</CardTitle>
            <CardDescription>
              {streamCode ? `Stream Code: ${streamCode.toUpperCase()}` : 'Invalid invite link'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isJoining && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Joining class...</p>
              </div>
            )}

            {hasJoined && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Successfully joined!</p>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            )}

            {error && !isJoining && !hasJoined && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-lg font-semibold mb-2 text-destructive">{error}</p>
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      hasAttemptedJoin.current = false;
                      handleJoin();
                    }}
                    className="flex items-center gap-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {!isJoining && !hasJoined && !error && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Processing...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
