import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { GraduationCap, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutDialog } from '@/components/auth/SessionTimeoutDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const { showWarning, countdown, stayLoggedIn } = useSessionTimeout({
    inactivityTimeout: 10 * 60 * 1000, // 10 minutes
    warningTimeout: 2 * 60 * 1000, // 2 minutes
    onTimeout: handleLogout,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur-sm px-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-5 h-5 text-black dark:text-white" />
                </div>
                <span className="font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent hidden sm:inline">iSkew PlayGround</span>
              </Link>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-3">
              {profile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-foreground">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-700 dark:text-amber-300 text-sm font-semibold">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 sm:hidden">
                      <p className="text-sm font-medium">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    <DropdownMenuSeparator className="sm:hidden" />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Session Timeout Dialog */}
      <SessionTimeoutDialog
        open={showWarning}
        countdown={countdown}
        onStayLoggedIn={stayLoggedIn}
      />
    </SidebarProvider>
  );
}
