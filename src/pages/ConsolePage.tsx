import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, Download, Circle } from "lucide-react";

interface LogEntry {
  id: string;
  type: "input" | "output" | "error" | "warning" | "info" | "debug" | "trace";
  content: string;
  timestamp: Date;
}

// Mock command responses
const executeCommand = (command: string): { type: "output" | "error"; content: string } => {
  const cmd = command.trim().toLowerCase();

  if (cmd === "help") {
    return {
      type: "output",
      content: `可用命令:
  help          - 显示帮助信息
  status        - 查看系统状态
  users         - 查看在线用户
  plugins       - 列出已安装插件
  tasks         - 查看运行中的任务
  clear         - 清空控制台
  version       - 显示版本信息
  uptime        - 显示运行时间
  memory        - 显示内存使用情况`,
    };
  }

  if (cmd === "status") {
    return {
      type: "output",
      content: `系统状态: 运行中 ✓
CPU 使用率: 23.5%
内存使用率: 45.2%
磁盘使用率: 67.8%
网络延迟: 12ms`,
    };
  }

  if (cmd === "users") {
    return {
      type: "output",
      content: `在线用户: 128
  - 活跃会话: 89
  - 空闲会话: 39
  - 管理员在线: 3`,
    };
  }

  if (cmd === "plugins") {
    return {
      type: "output",
      content: `已安装插件 (5):
  1. 数据分析引擎 v2.1.0 [运行中]
  2. 邮件通知服务 v1.5.3 [运行中]
  3. 备份管理器 v3.0.1 [运行中]
  4. 日志收集器 v1.2.0 [运行中]
  5. 安全扫描器 v2.0.0 [已停止]`,
    };
  }

  if (cmd === "tasks") {
    return {
      type: "output",
      content: `运行中的任务 (3):
  [PID 1024] 数据同步任务 - 运行中 (5分钟前启动)
  [PID 1089] 日志轮转任务 - 运行中 (12分钟前启动)
  [PID 1156] 缓存清理任务 - 运行中 (1小时前启动)`,
    };
  }

  if (cmd === "version") {
    return {
      type: "output",
      content: `Admin Console v1.0.0
Build: 2024.12.27
Node.js: v20.10.0
Platform: Linux x64`,
    };
  }

  if (cmd === "uptime") {
    return {
      type: "output",
      content: `系统运行时间: 15天 8小时 32分钟
上次重启: 2024-12-12 03:28:15`,
    };
  }

  if (cmd === "memory") {
    return {
      type: "output",
      content: `内存使用情况:
  总内存: 16.0 GB
  已使用: 7.2 GB (45.2%)
  可用: 8.8 GB
  缓存: 2.1 GB`,
    };
  }

  if (cmd === "") {
    return { type: "output", content: "" };
  }

  return {
    type: "error",
    content: `未知命令: ${command}\n输入 'help' 查看可用命令`,
  };
};

let logCounter = 0;

export default function ConsolePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Real-time log stream connection
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const eventSource = new EventSource(`/api/logs/stream`, {
      withCredentials: true
    });

    // Add authorization header via query parameter since EventSource doesn't support headers directly
    const authEventSource = new EventSource(`/api/logs/stream?token=${encodeURIComponent(token)}`, {
      withCredentials: true
    });

    authEventSource.onmessage = (event) => {
      try {
        const logData = JSON.parse(event.data);
        let logType: LogEntry["type"] = "info";
        
        switch (logData.level.toLowerCase()) {
          case "error":
            logType = "error";
            break;
          case "warning":
          case "warn":
            logType = "warning";
            break;
          case "info":
            logType = "info";
            break;
          case "debug":
            logType = "debug";
            break;
          case "trace":
            logType = "trace";
            break;
          default:
            logType = "info";
        }

        setLogs((prev) => {
          // 最多保留400条日志，避免内存占用过高
          const newLogs = [...prev, {
            id: (++logCounter).toString(),
            type: logType,
            content: logData.message,
            timestamp: new Date(logData.timestamp),
          }];
          return newLogs.slice(-400);
        });
      } catch (e) {
        console.error("Failed to parse log message:", e);
      }
    };

    authEventSource.onerror = (error) => {
      console.error("Log stream error:", error);
      authEventSource.close();
      // Reconnect after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    return () => {
      authEventSource.close();
    };
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const newLogs: LogEntry[] = [
        {
          id: (++logCounter).toString(),
          type: "input",
          content: `$ ${input}`,
          timestamp: new Date(),
        },
      ];

      setLogs((prev) => [...prev, ...newLogs]);
      setCommandHistory((prev) => [input, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setInput("");
    },
    [input],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const content = logs
      .map((log) => `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.content}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (type: LogEntry["type"]) => {
    const badges = {
      input: { label: "CMD", bg: "bg-blue-600", text: "text-white" },
      output: { label: "OUT", bg: "bg-slate-600", text: "text-white" },
      error: { label: "ERROR", bg: "bg-red-600", text: "text-white" },
      warning: { label: "WARN", bg: "bg-yellow-500", text: "text-black" },
      info: { label: "INFO", bg: "bg-emerald-600", text: "text-white" },
      debug: { label: "DEBUG", bg: "bg-purple-600", text: "text-white" },
      trace: { label: "TRACE", bg: "bg-gray-600", text: "text-white" },
    };
    return badges[type] || badges.info;
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "input":
        return "text-cyan-400";
      case "output":
        return "text-gray-200";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-black dark:text-white";
      case "debug":
        return "text-purple-400";
      case "trace":
        return "text-gray-400";
      default:
        return "text-gray-200";
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            实时控制台
          </h1>
          <p className="text-muted-foreground mt-1">实时日志监控与命令行交互</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
            实时连接
          </div>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            清空
          </Button>
        </div>
      </div>

      <Card className="backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 shadow-lg flex flex-col overflow-hidden h-[calc(100vh-130px)]">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-background/50 border-b border-border/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-mono">admin@server:~</span>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 p-4 bg-transparent overflow-y-auto" ref={scrollRef}>
          <div className="font-mono text-sm space-y-2">
            {logs.map((log) => {
              const badge = getLevelBadge(log.type);
              return (
                <div key={log.id} className="flex items-start gap-2 whitespace-pre-wrap break-all">
                  <span className="text-muted-foreground text-xs shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                  <span className={`${badge.bg} ${badge.text} text-xs px-1.5 py-0.5 rounded font-semibold shrink-0`}>
                    {badge.label}
                  </span>
                  <span className={getLogColor(log.type)}>{log.content}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 bg-background/50 border-t border-border/30">
          <span className="text-primary font-mono">$</span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入命令..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 font-mono text-foreground placeholder:text-muted-foreground/50"
            autoFocus
          />
        </form>
      </Card>
    </div>
  );
}
