import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabButtonGroup } from '@/components/ui/TabButtonGroup';
import { Wrench, AlertCircle } from 'lucide-react';
import { aiToolsApi, AITool } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// 类型定义
// ============================================================================

interface ParsedTool {
  name: string;
  title: string;
  summary: string;
  fullDescription: string;
  plugin: string;
}

// ============================================================================
// 工具函数
// ============================================================================

function parseToolDescription(tool: AITool, plugin: string): ParsedTool {
  const lines = tool.description.split('\n');
  const firstLine = lines[0];
  // 如果第一行字数小于11，则作为标题
  const title = firstLine.length < 11 ? firstLine : tool.name;
  
  // Args 之前的所有内容作为简介
  const summaryLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('Args:') || line.startsWith('Returns:') || line.startsWith('Example:')) {
      break;
    }
    if (line.trim()) {
      summaryLines.push(line.trim());
    }
  }
  // 去掉第一行（标题行），保留换行
  const summary = summaryLines.slice(1).join('\n');
  
  return {
    name: tool.name,
    title,
    summary,
    fullDescription: tool.description,
    plugin,
  };
}

// ============================================================================
// 组件定义
// ============================================================================

export default function AIToolsPage() {
  const { style } = useTheme();
  const { t } = useLanguage();
  const isGlass = style === 'glassmorphism';

  // 状态
  const [toolsByPlugin, setToolsByPlugin] = useState<Record<string, AITool[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ParsedTool | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<string>('all');

  // 获取所有插件列表（core 放在最后）
  const pluginList = useMemo(() => {
    const plugins = Object.keys(toolsByPlugin);
    return ['all', ...plugins.filter(p => p !== 'core').sort(), ...plugins.filter(p => p === 'core')];
  }, [toolsByPlugin]);

  // 按插件过滤后的工具列表
  const filteredTools = useMemo(() => {
    if (selectedPlugin === 'all') {
      // 返回扁平化的工具列表，同时保留 plugin 信息
      return Object.entries(toolsByPlugin).flatMap(([plugin, tools]) =>
        Array.isArray(tools) ? tools.map(tool => ({ ...tool, plugin })) : []
      );
    }
    const pluginTools = toolsByPlugin[selectedPlugin];
    return Array.isArray(pluginTools) ? pluginTools.map(tool => ({ ...tool, plugin: selectedPlugin })) : [];
  }, [toolsByPlugin, selectedPlugin]);

  // 解析后的工具列表
  const parsedTools = useMemo(() => {
    return filteredTools.map(tool => parseToolDescription(tool, tool.plugin));
  }, [filteredTools]);

  // 加载工具列表
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // api.get returns data.data directly when status is 0
        // tools is now Record<string, AITool[]> grouped by plugin name
        const data = await aiToolsApi.getToolsList() as unknown as { tools: Record<string, AITool[]>; count: number };
        setToolsByPlugin(data.tools || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : t('aiTools.loadFailed'));
        toast.error(err instanceof Error ? err.message : t('aiTools.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [t]);

  const handleToolClick = (tool: ParsedTool) => {
    setSelectedTool(tool);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wrench className="w-8 h-8" />
          {t('aiTools.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('aiTools.description')}</p>
      </div>

      {/* 插件过滤器 */}
      {!isLoading && Object.keys(toolsByPlugin).length > 0 && (
        <TabButtonGroup
          options={pluginList.map((plugin) => ({
            value: plugin,
            label: plugin === 'all' ? (t('aiTools.allPlugins') || '全部') : plugin,
            icon: <Wrench className="w-4 h-4" />,
          }))}
          value={selectedPlugin}
          onValueChange={setSelectedPlugin}
          glassClassName={isGlass ? 'glass-card' : 'border border-border/50'}
        />
      )}

      {/* 错误提示 */}
      {error && (
        <Card className={cn(
          "border-destructive/50",
          isGlass ? "glass-card" : "border border-border/50"
        )}>
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* 工具列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={cn(
              isGlass ? "glass-card" : "border border-border/50"
            )}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : parsedTools.length === 0 ? (
        <Card className={cn(
          isGlass ? "glass-card" : "border border-border/50"
        )}>
          <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Wrench className="w-12 h-12 mb-4 opacity-50" />
            <p>{t('aiTools.noTools')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parsedTools.map((tool) => (
            <Card 
              key={tool.name} 
              className={cn(
                "cursor-pointer transition-colors hover:border-primary/50",
                isGlass ? "glass-card" : "border border-border/50"
              )}
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    <span className="text-lg">{tool.title}</span>
                  </CardTitle>
                  {tool.plugin && tool.plugin !== 'core' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {tool.plugin}
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  {tool.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {tool.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 工具详情弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              {selectedTool?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedTool?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-md overflow-x-auto">
              {selectedTool?.fullDescription}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
