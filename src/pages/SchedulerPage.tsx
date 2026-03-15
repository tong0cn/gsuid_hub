import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  Search,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { format, addHours, addMinutes, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { schedulerApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  cronDescription: string;
  status: 'running' | 'paused' | 'error';
  nextRun: Date;
  lastRun: Date | null;
  lastResult: 'success' | 'failed' | 'pending';
  runCount: number;
  avgDuration: string;
}

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch jobs from API
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const jobs = await schedulerApi.getJobs();
      // Convert to frontend format
      const formattedJobs = jobs.map((job: any, index: number) => ({
        id: job.id,
        name: job.name,
        description: job.description || job.name, // Use docstring from backend
        cronExpression: job.trigger,
        cronDescription: job.trigger_description || job.trigger,
        status: job.paused ? 'paused' as const : 'running' as const,
        nextRun: job.next_run_time ? new Date(job.next_run_time) : new Date(),
        lastRun: null,
        lastResult: 'success' as const,
        runCount: 0,
        avgDuration: 'N/A'
      }));
      setTasks(formattedJobs);
    } catch (error) {
      console.error('Failed to fetch scheduler jobs:', error);
      toast({
        title: '加载失败',
        description: '无法加载任务调度列表',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const stats = useMemo(() => ({
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    error: tasks.filter(t => t.status === 'error').length
  }), [tasks]);

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      if (task.status === 'running') {
        await schedulerApi.pauseJob(taskId);
        toast({
          title: '任务已暂停',
          description: `任务 "${task.name}" 已暂停`
        });
      } else {
        await schedulerApi.resumeJob(taskId);
        toast({
          title: '任务已启动',
          description: `任务 "${task.name}" 已启动`
        });
      }
      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Failed to toggle task status:', error);
      toast({
        title: '操作失败',
        description: '无法更改任务状态',
        variant: 'destructive'
      });
    }
  };

  const runTaskNow = async (taskId: string) => {
    try {
      await schedulerApi.runJob(taskId);
      toast({
        title: '执行成功',
        description: '任务已触发执行'
      });
      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Failed to run job:', error);
      toast({
        title: '执行失败',
        description: '无法触发任务执行',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: ScheduledTask['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">运行中</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">已暂停</Badge>;
      case 'error':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">错误</Badge>;
    }
  };

  const getResultIcon = (result: ScheduledTask['lastResult']) => {
    switch (result) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 flex-1 overflow-auto p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          任务调度
        </h1>
        <p className="text-muted-foreground mt-1">管理和监控后端定时任务 (APScheduler)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总任务数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.running}</p>
                <p className="text-xs text-muted-foreground">运行中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Pause className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.paused}</p>
                <p className="text-xs text-muted-foreground">已暂停</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.error}</p>
                <p className="text-xs text-muted-foreground">异常</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索任务名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            定时任务列表
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead className="hidden md:table-cell">执行周期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="hidden lg:table-cell">下次执行</TableHead>
                  <TableHead className="hidden lg:table-cell">上次结果</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {task.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="text-sm">{task.cronDescription}</p>
                        <p className="text-xs text-muted-foreground font-mono">{task.cronExpression}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        {format(task.nextRun, 'MM-dd HH:mm', { locale: zhCN })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {getResultIcon(task.lastResult)}
                        <span className="text-xs text-muted-foreground">
                          {task.lastRun ? format(task.lastRun, 'HH:mm', { locale: zhCN }) : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTaskStatus(task.id)}
                          title={task.status === 'running' ? '暂停' : '启动'}
                        >
                          {task.status === 'running' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => runTaskNow(task.id)}
                          title="立即执行"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              {selectedTask?.name}
            </DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">状态</p>
                  {getStatusBadge(selectedTask.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cron 表达式</p>
                  <p className="font-mono text-sm">{selectedTask.cronExpression}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">执行周期</p>
                  <p className="text-sm">{selectedTask.cronDescription}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">平均执行时长</p>
                  <p className="text-sm">{selectedTask.avgDuration}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">下次执行时间</p>
                  <p className="text-sm">{format(selectedTask.nextRun, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">上次执行时间</p>
                  <p className="text-sm">
                    {selectedTask.lastRun 
                      ? format(selectedTask.lastRun, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
                      : '-'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">总执行次数</p>
                  <p className="text-sm">{selectedTask.runCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">上次执行结果</p>
                  <div className="flex items-center gap-2">
                    {getResultIcon(selectedTask.lastResult)}
                    <span className="text-sm">
                      {selectedTask.lastResult === 'success' ? '成功' : 
                       selectedTask.lastResult === 'failed' ? '失败' : '待执行'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleTaskStatus(selectedTask.id)}
                >
                  {selectedTask.status === 'running' ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      暂停任务
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      启动任务
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => runTaskNow(selectedTask.id)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  立即执行
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
