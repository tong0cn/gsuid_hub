import { Outlet } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

function LayoutHeader() {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return (
    <div className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 py-2 flex items-center">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="打开菜单">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="ml-4 font-semibold">GsCore</div>
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
          <div
            className="absolute inset-0 bg-background/20"
            style={{
              backdropFilter: `blur(${Math.max(2, blurIntensity / 4)}px)`,
              WebkitBackdropFilter: `blur(${Math.max(2, blurIntensity / 4)}px)`
            }}
          />
        </div>
      )}
      
      {hasDefaultGlass && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
          "flex flex-col overflow-hidden",
          isGlassmorphism && "bg-transparent"
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
    <SidebarProvider className="h-screen overflow-hidden">
      <LayoutContent />
    </SidebarProvider>
  );
}
