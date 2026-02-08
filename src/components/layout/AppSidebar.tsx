import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Calendar,
  Settings,
  BookOpen,
  CheckSquare,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Calendar', url: '/calendar', icon: Calendar },
  { title: 'To-do', url: '/todo', icon: CheckSquare },
  { title: 'Archived', url: '/archived', icon: Archive },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { classes } = useApp();

  const isActive = (path: string) => location.pathname === path;
  const isClassActive = (classId: string) => location.pathname.startsWith(`/class/${classId}`);

  return (
    <Sidebar
      className={cn(
        'border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                        isActive(item.url)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Classes */}
        {!collapsed && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Classes
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mt-2">
                {classes.map((classItem) => (
                  <SidebarMenuItem key={classItem.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/class/${classItem.id}`}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl transition-colors',
                          isClassActive(classItem.id)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                      >
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{classItem.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
