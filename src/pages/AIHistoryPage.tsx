import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEFAULT_SELECT_VALUE = '__all__';

import {
  History,
  Loader2,
  RefreshCw,
  Search,
  FileText,
  Database,
  Clock,
  User,
  Bot,
  Wrench,
  MessageSquare,
  CheckCircle,
  Lightbulb,
  Shield,
  XOctagon,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Filter,
  Radio,
  FileCheck,
  BarChart3,
  ChevronLeft,
  HardDrive,
  Cpu,
  SlidersHorizontal,
} from 'lucide-react';
import {
  aiSessionLogsApi,
  personaApi,
  SessionLogSummary,
  SessionLogDetail,
  SessionLogEntry,
  SessionLogEntryType,
  SessionLogStatsOverview,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// 工具函数
// ============================================================================

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeOnly(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getEntryTypeLabel(type: SessionLogEntryType, t: (key: string) => string): string {
  const map: Record<string, string> = {
    session_created: t('aiHistory.entryType.sessionCreated'),
    session_ended: t('aiHistory.entryType.sessionEnded'),
    system_prompt: t('aiHistory.entryType.systemPrompt'),
    run_start: t('aiHistory.entryType.runStart'),
    run_end: t('aiHistory.entryType.runEnd'),
    user_input: t('aiHistory.entryType.userInput'),
    thinking: t('aiHistory.entryType.thinking'),
    tool_call: t('aiHistory.entryType.toolCall'),
    tool_return: t('aiHistory.entryType.toolReturn'),
    text_output: t('aiHistory.entryType.textOutput'),
    result: t('aiHistory.entryType.result'),
    token_usage: t('aiHistory.entryType.tokenUsage'),
    error: t('aiHistory.entryType.error'),
    node_transition: t('aiHistory.entryType.nodeTransition'),
  };
  return map[type] || type;
}

function getEntryTypeIcon(type: SessionLogEntryType) {
  switch (type) {
    case 'session_created': return <Clock className="w-3 h-3" />;
    case 'session_ended': return <CheckCircle className="w-3 h-3" />;
    case 'system_prompt': return <Shield className="w-3 h-3" />;
    case 'run_start': return <Clock className="w-3 h-3" />;
    case 'run_end': return <CheckCircle className="w-3 h-3" />;
    case 'user_input': return <MessageSquare className="w-3 h-3" />;
    case 'thinking': return <Lightbulb className="w-3 h-3" />;
    case 'tool_call': return <Wrench className="w-3 h-3" />;
    case 'tool_return': return <CheckCircle className="w-3 h-3" />;
    case 'text_output': return <MessageSquare className="w-3 h-3" />;
    case 'result': return <CheckCircle className="w-3 h-3" />;
    case 'token_usage': return <BarChart3 className="w-3 h-3" />;
    case 'error': return <XOctagon className="w-3 h-3" />;
    case 'node_transition': return <GitBranch className="w-3 h-3" />;
    default: return <FileText className="w-3 h-3" />;
  }
}

function getEntryTypeColor(type: SessionLogEntryType): string {
  switch (type) {
    case 'user_input': return 'bg-primary text-primary-foreground';
    case 'text_output': return 'bg-indigo-500 text-white';
    case 'thinking': return 'bg-amber-500/20 text-amber-600';
    case 'tool_call': return 'bg-orange-500/20 text-orange-600';
    case 'tool_return': return 'bg-teal-500/20 text-teal-600';
    case 'error': return 'bg-red-500/20 text-red-600';
    case 'token_usage': return 'bg-cyan-500/20 text-cyan-600';
    case 'system_prompt': return 'bg-purple-500/20 text-purple-600';
    case 'node_transition': return 'bg-pink-500/20 text-pink-600';
    default: return 'bg-muted text-muted-foreground';
  }
}

function hasEntryContent(entry: SessionLogEntry): boolean {
  const { type, data } = entry;
  switch (type) {
    case 'user_input':
      return !!(data.content || data.user_message);
    case 'text_output':
      return !!(data.content || data.output);
    case 'thinking':
      return !!data.content;
    case 'tool_call':
      return true;
    case 'tool_return':
      return !!data.content;
    case 'token_usage':
      return true;
    case 'error':
      return !!(data.error_type || data.message);
    case 'node_transition':
      return !!data.node_type;
    case 'system_prompt':
      return !!data.content;
    case 'session_created':
    case 'session_ended':
    case 'run_start':
    case 'run_end':
    case 'result':
      return false;
    default:
      return false;
  }
}

// ============================================================================
// 详情页时间线组件
// ============================================================================

function TimelineNode({ type, isLast }: { type: SessionLogEntryType; isLast: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      {!isLast && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-px h-[calc(100%+12px)] bg-border/60" />
      )}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0",
        getEntryTypeColor(type)
      )}>
        {getEntryTypeIcon(type)}
      </div>
    </div>
  );
}

function EntryContent({ entry, t }: { entry: SessionLogEntry; t: (key: string) => string }) {
  const { type, data } = entry;

  if (type === 'error') {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-red-600">{data.error_type as string}</p>
        <p className="text-sm text-red-500/80">{data.message as string}</p>
      </div>
    );
  }

  if (type === 'tool_call') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-sm font-medium">{data.tool_name as string}</span>
          <span className="text-xs text-muted-foreground font-mono">{data.tool_call_id as string}</span>
        </div>
        <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto font-mono">
          {data.args as string}
        </pre>
      </div>
    );
  }

  if (type === 'tool_return') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-sm font-medium">{data.tool_name as string}</span>
        </div>
        <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto font-mono whitespace-pre-wrap">
          {data.content as string}
        </pre>
      </div>
    );
  }

  if (type === 'node_transition') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <GitBranch className="w-3.5 h-3.5 text-pink-500" />
        <span className="font-medium">{data.node_type as string}</span>
      </div>
    );
  }

  if (type === 'system_prompt') {
    return (
      <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
        {data.content as string}
      </pre>
    );
  }

  if (type === 'thinking') {
    return (
      <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap font-mono italic text-muted-foreground max-h-48 overflow-y-auto">
        {data.content as string}
      </pre>
    );
  }

  const content = (data.content || data.output || data.user_message || '') as string;
  return (
    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
  );
}

function TimelineEntry({ entry, t, personaName, isLast }: {
  entry: SessionLogEntry;
  t: (key: string) => string;
  personaName: string;
  isLast: boolean;
}) {
  const type = entry.type;
  const label = getEntryTypeLabel(type, t);
  const time = formatTimeOnly(entry.timestamp);
  const hasContent = hasEntryContent(entry);

  // 用户消息
  if (type === 'user_input') {
    const content = (entry.data.content || entry.data.user_message || '') as string;
    return (
      <div className="flex gap-3">
        <TimelineNode type={type} isLast={isLast} />
        <div className="flex-1 min-w-0 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary">{t('aiHistory.entryType.userInput')}</span>
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-2.5 text-sm shadow-sm block sm:inline-block sm:max-w-[85%] overflow-hidden">
            <pre className="whitespace-pre-wrap font-sans leading-relaxed break-words [overflow-wrap:anywhere]">{content}</pre>
          </div>
        </div>
      </div>
    );
  }

  // AI 消息
  if (type === 'text_output') {
    const content = (entry.data.content || entry.data.output || '') as string;
    const avatarUrl = personaName ? personaApi.getAvatarUrl(personaName) : '';
    return (
      <div className="flex gap-3">
        <TimelineNode type={type} isLast={isLast} />
        <div className="flex-1 min-w-0 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-5 h-5">
              <AvatarImage src={avatarUrl} alt={personaName} />
              <AvatarFallback className="bg-indigo-500/10 text-indigo-600 text-[10px]">
                <Bot className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-indigo-600">{personaName}</span>
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-2.5 text-sm shadow-sm border border-border/50 block sm:inline-block sm:max-w-[85%] overflow-hidden">
            <pre className="whitespace-pre-wrap font-sans leading-relaxed break-words [overflow-wrap:anywhere]">{content}</pre>
          </div>
        </div>
      </div>
    );
  }

  // token_usage - Badge 形式不展开
  if (type === 'token_usage') {
    return (
      <div className="flex gap-3">
        <TimelineNode type={type} isLast={isLast} />
        <div className="flex-1 min-w-0 pb-5 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground/50">{time}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {entry.data.model_name as string}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              {t('aiHistory.inputTokens')}: {entry.data.input_tokens as number}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              {t('aiHistory.outputTokens')}: {entry.data.output_tokens as number}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  // 可折叠系统消息
  const collapsibleTypes = ['thinking', 'tool_call', 'tool_return', 'system_prompt', 'error'];
  const isCollapsible = collapsibleTypes.includes(type);

  if (isCollapsible && hasContent) {
    return <CollapsibleSystemEntry entry={entry} t={t} isLast={isLast} />;
  }

  // 纯标签系统消息
  return (
    <div className="flex gap-3">
      <TimelineNode type={type} isLast={isLast} />
      <div className="flex-1 min-w-0 pb-5 pt-0.5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground/50">{time}</span>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSystemEntry({ entry, t, isLast }: {
  entry: SessionLogEntry;
  t: (key: string) => string;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const type = entry.type;
  const label = getEntryTypeLabel(type, t);
  const time = formatTimeOnly(entry.timestamp);

  return (
    <div className="flex gap-3">
      <TimelineNode type={type} isLast={isLast} />
      <div className="flex-1 min-w-0 pb-5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground/50">{time}</span>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {open && (
          <div className="mt-1.5 bg-muted/30 rounded-lg p-3 text-sm">
            <EntryContent entry={entry} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 主组件
// ============================================================================

export default function AIHistoryPage() {
  const { style } = useTheme();
  const { t } = useLanguage();
  const isGlass = style === 'glassmorphism';

  // 数据状态
  const [logs, setLogs] = useState<SessionLogSummary[]>([]);
  const [stats, setStats] = useState<SessionLogStatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 选中的详情
  const [selectedLog, setSelectedLog] = useState<SessionLogSummary | null>(null);
  const [detail, setDetail] = useState<SessionLogDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCreateBy, setFilterCreateBy] = useState<string>(DEFAULT_SELECT_VALUE);
  const [filterPersona, setFilterPersona] = useState<string>(DEFAULT_SELECT_VALUE);
  const [filterStatus, setFilterStatus] = useState<string>(DEFAULT_SELECT_VALUE);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // 分页
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // 获取统计
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const data = await aiSessionLogsApi.getStatsOverview();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch session log stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 获取统一日志列表
  const fetchLogs = useCallback(async (currentOffset: number = 0) => {
    try {
      setIsLoading(true);
      const data = await aiSessionLogsApi.getLogs({
        session_id: searchQuery || undefined,
        create_by: filterCreateBy !== DEFAULT_SELECT_VALUE ? filterCreateBy : undefined,
        persona_name: filterPersona !== DEFAULT_SELECT_VALUE ? filterPersona : undefined,
        is_active: filterStatus !== DEFAULT_SELECT_VALUE ? filterStatus === 'active' : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        limit,
        offset: currentOffset,
      });
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setOffset(currentOffset);
    } catch (err) {
      console.error('Failed to fetch session logs:', err);
      toast({
        title: t('common.error'),
        description: t('aiHistory.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterCreateBy, filterPersona, filterStatus, filterDateFrom, filterDateTo, t]);

  // 获取详情
  const fetchDetail = useCallback(async (log: SessionLogSummary) => {
    try {
      setIsLoadingDetail(true);
      const data = await aiSessionLogsApi.getLogDetail(log.session_id, log.session_uuid);
      setDetail(data);
      setSelectedLog(log);
    } catch (err) {
      console.error('Failed to fetch log detail:', err);
      toast({
        title: t('common.error'),
        description: t('aiHistory.loadDetailFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }, [t]);

  // 初始加载
  useEffect(() => {
    fetchStats();
    fetchLogs(0);
  }, [fetchStats, fetchLogs]);

  // 刷新
  const handleRefresh = useCallback(() => {
    fetchStats();
    fetchLogs(0);
    if (selectedLog) {
      fetchDetail(selectedLog);
    }
  }, [fetchStats, fetchLogs, selectedLog, fetchDetail]);

  // 应用筛选
  const handleApplyFilter = useCallback(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  // 分页
  const handlePrevPage = useCallback(() => {
    if (offset >= limit) {
      fetchLogs(offset - limit);
    }
  }, [offset, limit, fetchLogs]);

  const handleNextPage = useCallback(() => {
    if (offset + limit < total) {
      fetchLogs(offset + limit);
    }
  }, [offset, limit, total, fetchLogs]);

  // 来源和人格列表
  const createByOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.create_by));
    return Array.from(set);
  }, [logs]);

  const personaOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.persona_name));
    return Array.from(set);
  }, [logs]);

  const handleSelectLog = (log: SessionLogSummary) => {
    fetchDetail(log);
  };

  const handleBackToList = () => {
    setSelectedLog(null);
    setDetail(null);
  };

  const personaName = detail?.persona_name || selectedLog?.persona_name || '';
  const avatarUrl = personaName ? personaApi.getAvatarUrl(personaName) : '';

  return (
    <div className="flex-1 overflow-hidden h-full flex">
      {/* 左侧边栏 - 日志列表 */}
      <div className={cn(
        "border-r flex flex-col shrink-0",
        "w-full absolute inset-0 z-10 sm:relative sm:w-80 lg:w-96",
        isGlass ? "border-white/10 glass-card" : "border-border bg-card",
        selectedLog ? "hidden sm:flex" : "flex"
      )}>
        {/* 标题和刷新 */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {t('aiHistory.title')}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 统计概览 - 带图标 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-tight">{t('aiHistory.statsTotalFiles')}</p>
                <p className="text-lg font-bold leading-tight mt-0.5">{stats?.total_files ?? '-'}</p>
              </div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-tight">{t('aiHistory.statsActiveSessions')}</p>
                <p className="text-lg font-bold leading-tight mt-0.5">{stats?.memory_active_sessions ?? '-'}</p>
              </div>
            </div>
          </div>

          {/* 搜索 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t('aiHistory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className={cn("pl-9 h-8 text-sm", isGlass && "glass-card")}
            />
          </div>

          {/* 筛选 - 带标题和图标 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('aiHistory.filterTitle')}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Select value={filterCreateBy} onValueChange={setFilterCreateBy}>
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <SelectValue placeholder={t('aiHistory.filterCreateBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_SELECT_VALUE}>{t('aiHistory.filterAll')}</SelectItem>
                  {createByOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPersona} onValueChange={setFilterPersona}>
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <SelectValue placeholder={t('aiHistory.filterPersona')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_SELECT_VALUE}>{t('aiHistory.filterAll')}</SelectItem>
                  {personaOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[90px] h-7 text-xs">
                  <SelectValue placeholder={t('aiHistory.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_SELECT_VALUE}>{t('aiHistory.filterAll')}</SelectItem>
                  <SelectItem value="active">{t('aiHistory.filterActive')}</SelectItem>
                  <SelectItem value="ended">{t('aiHistory.filterEnded')}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleApplyFilter} className="h-7 gap-1 text-xs">
                <Filter className="w-3 h-3" />
                {t('common.filter')}
              </Button>
            </div>
          </div>
        </div>

        {/* 日志列表 */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">{t('aiHistory.noLogs')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {logs.map((log) => {
                const isSelected = selectedLog?.session_uuid === log.session_uuid;
                return (
                  <button
                    key={log.session_uuid}
                    onClick={() => handleSelectLog(log)}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-all",
                      "hover:bg-accent/50",
                      isSelected && "bg-primary/10 hover:bg-primary/10 border-l-2 border-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        log.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                      )}>
                        {log.is_active ? <Radio className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium truncate">{log.session_id}</span>
                          {log.is_active && (
                            <Badge className="text-[10px] h-4 px-1 bg-green-500/10 text-green-600 border-green-500/20">
                              {t('aiHistory.statusActive')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.persona_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.created_at_str}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {log.entry_count} {t('aiHistory.entries')}
                          </span>
                        </div>
                        {log.type_counts && Object.keys(log.type_counts).length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {Object.entries(log.type_counts).slice(0, 4).map(([type, count]) => (
                              <Badge key={type} variant="secondary" className="text-[10px] h-4 px-1">
                                {getEntryTypeLabel(type as SessionLogEntryType, t)}: {count as number}
                              </Badge>
                            ))}
                            {Object.keys(log.type_counts).length > 4 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{Object.keys(log.type_counts).length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* 分页 */}
        {total > 0 && (
          <div className="p-3 border-t border-border/50 flex items-center justify-between text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={offset === 0 || isLoading}
              className="h-7 px-2"
            >
              {t('common.previousPage')}
            </Button>
            <span className="text-muted-foreground">
              {t('common.pageInfo', { current: Math.floor(offset / limit) + 1, total: Math.ceil(total / limit) })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={offset + limit >= total || isLoading}
              className="h-7 px-2"
            >
              {t('common.nextPage')}
            </Button>
          </div>
        )}
      </div>

      {/* 右侧内容区 - 详情时间线 */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden",
        isGlass ? "bg-background/50 backdrop-blur-md" : "bg-background",
        selectedLog ? "flex" : "hidden sm:flex"
      )}>
        {selectedLog && detail ? (
          <>
            {/* 详情头部 */}
            <div className={cn(
              "h-14 border-b px-4 flex items-center justify-between shrink-0",
              isGlass ? "border-white/10 bg-background/50" : "border-border bg-card"
            )}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-8 w-8 shrink-0"
                  onClick={handleBackToList}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={avatarUrl} alt={personaName} />
                  <AvatarFallback className="bg-indigo-500/10 text-indigo-600 text-[10px]">
                    <Bot className="w-3.5 h-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm truncate">{detail.session_id}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {personaName} · {detail.create_by} · {detail.entry_count} {t('aiHistory.entries')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {formatTimestamp(detail.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoadingDetail}
                  className="h-8 w-8"
                >
                  {isLoadingDetail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* 时间线内容 */}
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                {isLoadingDetail ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                        <Skeleton className="h-8 rounded-xl w-[60%]" />
                      </div>
                    ))}
                  </div>
                ) : detail.entries.length > 0 ? (
                  <div className="space-y-0">
                    {detail.entries.map((entry, index) => (
                      <TimelineEntry
                        key={`${entry.type}-${entry.timestamp}-${index}`}
                        entry={entry}
                        t={t}
                        personaName={personaName}
                        isLast={index === detail.entries.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">{t('aiHistory.noEntries')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          /* 空状态 */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">{t('aiHistory.selectSession')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">点击左侧会话查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}
