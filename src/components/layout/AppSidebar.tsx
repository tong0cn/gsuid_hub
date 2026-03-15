import { LayoutDashboard, Database, Settings, FileText, LogOut, Palette, Terminal, Calendar, Store, Cpu, HardDrive, PanelLeftClose, PanelLeft, Cog, Power, RotateCw } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getAuthToken, getCustomApiHost, systemApi } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const navItems = [{
  title: '数据看板',
  url: '/dashboard',
  icon: LayoutDashboard
}, {
  title: '数据库管理',
  url: '/database',
  icon: Database
}, {
  title: '实时控制台',
  url: '/console',
  icon: Terminal
}, {
  title: '任务调度',
  url: '/scheduler',
  icon: Calendar
}, {
  title: 'Core 核心配置',
  url: '/core-config',
  icon: Cog
}, {
  title: '备份管理',
  url: '/backup',
  icon: HardDrive
}, {
  title: '框架配置',
  url: '/framework-config',
  icon: Cpu
}, {
  title: '插件配置',
  url: '/plugins',
  icon: Settings
}, {
  title: '插件商城',
  url: '/plugin-store',
  icon: Store
}, {
  title: '日志查看',
  url: '/logs',
  icon: FileText
}, {
  title: '主题设置',
  url: '/themes',
  icon: Palette
}];
export function AppSidebar() {
  const {
    user,
    logout
  } = useAuth();
  const {
    state,
    toggleSidebar,
    isMobile
  } = useSidebar();
  const {
    style,
    iconColor
  } = useTheme();
  const isCollapsed = state === 'collapsed';
  const isGlassmorphism = style === 'glassmorphism';

  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartProgress, setRestartProgress] = useState(0);
  const [restartCompleted, setRestartCompleted] = useState(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) {
        clearInterval(restartTimerRef.current);
      }
    };
  }, []);

  const handleRestart = async () => {
    setIsRestarting(true);
    setRestartProgress(0);
    setRestartCompleted(false);

    // Start fake progress bar (70s to 99%)
    const startTime = Date.now();
    const duration = 70000; // 70 seconds (1 minute 10 seconds)
    const targetProgress = 99;
    let backendResponded = false;

    restartTimerRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * targetProgress, targetProgress);
      setRestartProgress(progress);

      // Try to ping backend to check if it's back (no auth needed, just check if server is up)
      if (!backendResponded && progress > 10) {
        try {
          const apiHost = getCustomApiHost();
          // Use health check endpoint which doesn't require auth
          const url = apiHost ? `${apiHost}/api/system/health` : '/api/system/health';
          
          const response = await fetch(url, { method: 'GET' }).catch(() => null);
          
          if (response && response.ok) {
            backendResponded = true;
            setRestartProgress(100);
            setRestartCompleted(true);
            if (restartTimerRef.current) {
              clearInterval(restartTimerRef.current);
            }
          }
        } catch {
          // Backend not responding yet
        }
      }

      if (progress >= targetProgress && !backendResponded) {
        if (restartTimerRef.current) {
          clearInterval(restartTimerRef.current);
        }
      }
    }, 500);

    try {
      // Send restart request
      await systemApi.restartCore();
    } catch (error) {
      console.log('Restart command sent, backend may be restarting...');
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setShowRestartDialog(false);
      setIsRestarting(false);
      setRestartProgress(0);
      setRestartCompleted(false);
      if (restartTimerRef.current) {
        clearInterval(restartTimerRef.current);
      }
    } else {
      setShowRestartDialog(true);
    }
  };
  
  // Get icon class based on iconColor setting
  const getIconClass = (customClass = "") => {
    const baseClass = customClass || "w-5 h-5";
    if (iconColor === 'white') {
      return cn(baseClass, "text-white drop-shadow");
    } else if (iconColor === 'black') {
      return cn(baseClass, "text-black");
    }
    // colored - use default (text-primary)
    return cn(baseClass, "text-primary");
  };
  
  return <Sidebar variant="sidebar" collapsible="icon" className={cn("border-0", isGlassmorphism ? "floating-sidebar" : "bg-sidebar shadow-lg")}>
      <SidebarHeader className={cn("p-4", isCollapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
              <img src="/app/ICON.png" alt="GsCore" className="w-8 h-8 object-contain" />
            </div>
            {!isCollapsed && <div className="flex flex-col">
                <span className="font-bold text-lg">GsCore</span>
                <span className="text-xs text-muted-foreground">​早柚核心</span>
              </div>}
          </div>
          {!isCollapsed && <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground" aria-label="收起侧边栏">
              <PanelLeftClose className="w-4 h-4" />
            </button>}
        </div>
        {isCollapsed && <button onClick={toggleSidebar} className="mt-2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground" aria-label="展开侧边栏">
            <PanelLeft className="w-4 h-4" />
          </button>}
      </SidebarHeader>

      <Separator className="opacity-30 mx-2" />

      <SidebarContent className={cn(isCollapsed ? "px-1" : "p-2")}>
        <SidebarGroup className={cn(isCollapsed && "p-0")}>
          {!isCollapsed && <SidebarGroupLabel className="text-muted-foreground/70">
              导航菜单
            </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className={cn(isCollapsed && "items-center")}>
              {navItems.map(item => <SidebarMenuItem key={item.title} className={cn(isCollapsed ? "w-auto" : "w-full")}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className={cn("flex items-center rounded-lg transition-all", isCollapsed ? "justify-center w-10 h-10 p-0" : "gap-3 px-3 py-2.5", "hover:bg-primary/10")} activeClassName="bg-primary/20 text-primary font-medium shadow-sm">
                      <item.icon className={getIconClass("w-5 h-5 shrink-0")} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("p-4", isCollapsed && "flex flex-col items-center")}>
        <Separator className="mb-4 opacity-30" />
        
        <div className={cn("flex items-center mb-3", isCollapsed ? "justify-center" : "gap-3")}>
          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          {!isCollapsed && <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>}
        </div>

        <Button variant="ghost" size={isCollapsed ? 'icon' : 'default'} onClick={logout} className={cn("text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors", isCollapsed ? "w-auto justify-center" : "w-full justify-start gap-2")}>
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>退出登录</span>}
        </Button>

        <Button variant="ghost" size={isCollapsed ? 'icon' : 'default'} onClick={() => setShowRestartDialog(true)} title="重启GsCore" className={cn("text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors", isCollapsed ? "w-auto justify-center mt-2" : "w-full justify-start gap-2 mt-2")}>
          <Power className="w-4 h-4" />
          {!isCollapsed && <span>重启GsCore</span>}
        </Button>
      </SidebarFooter>

      <Dialog open={showRestartDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            {restartCompleted ? (
              <>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 animate-spin text-green-500" />
                  重启成功
                </DialogTitle>
                <DialogDescription>
                  GsCore 已成功重启！
                </DialogDescription>
              </>
            ) : isRestarting ? (
              <>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 animate-spin" />
                  正在重启GsCore...
                </DialogTitle>
                <DialogDescription>
                  核心正在重启中，请稍候...
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>是否确定重启GsCore？</DialogTitle>
                <DialogDescription className="text-red-500 italic">
                  点击按钮后你的机器人可能不会回来了
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          
          {isRestarting && (
            <div className="py-4">
              <Progress value={restartProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {Math.round(restartProgress)}%
              </p>
            </div>
          )}
          
          <DialogFooter>
            {restartCompleted ? (
              <Button variant="default" onClick={() => handleDialogClose(false)}>
                完成
              </Button>
            ) : isRestarting ? null : (
              <>
                <Button variant="outline" onClick={() => handleDialogClose(false)}>
                  取消
                </Button>
                <Button variant="destructive" onClick={handleRestart}>
                  确认重启
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>;
}