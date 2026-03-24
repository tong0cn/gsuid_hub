import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function LayoutHeader() {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!isMobile) return null;
  
  return (
    <div className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="打开菜单">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/app/ICON.png" alt="GsCore" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-semibold">GsCore</span>
        </div>
      </div>
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        <Avatar className="w-8 h-8">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
      </button>
    </div>
  );
}

function LayoutContent() {
  const { style, backgroundImage, blurIntensity } = useTheme();
  const isMobile = useIsMobile();

  const isGradient = backgroundImage?.startsWith('linear-gradient');
  const isImage = backgroundImage && !isGradient;

  const isGlassmorphism = style === 'glassmorphism';
  const isSolid = style === 'solid';
  const hasBackground = isGlassmorphism && backgroundImage;
  const hasDefaultGlass = isGlassmorphism && !backgroundImage;

  return (
    <>
      {/* Background layers - fixed at bottom */}
      {hasBackground && (
        <div className="fixed inset-0 -z-10">
          {isGradient ? (
            <div className="w-full h-full" style={{ background: backgroundImage }} />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat bg-fixed"
              style={{ backgroundImage: `url("${backgroundImage}")` }}
            />
          )}
        </div>
      )}
      
      {hasDefaultGlass && (
        <div className="fixed inset-0 -z-10 rounded-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-none" />
        </div>
      )}

      {isSolid && (
        <div className="fixed inset-0 -z-10">
          {backgroundImage ? (
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat bg-fixed"
              style={{ backgroundImage: `url("${backgroundImage}")` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-background via-background to-secondary/30" />
          )}
        </div>
      )}

      {/*
        LAYOUT STRUCTURE:
        - AppSidebar comes first (provides spacer)
        - SidebarInset takes remaining space using flex-1
        - SidebarProvider already provides the flex container
      */}
      <AppSidebar />
      <SidebarInset
        className={cn(
          "flex flex-col overflow-hidden transition-transform"
        )}
      >
        <LayoutHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <LayoutContent />
    </SidebarProvider>
  );
}
