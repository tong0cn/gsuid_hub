# GsCore Frontend v0.0.1

GsCore网页控制台前端项目 - 一个基于React的管理控制台界面。

后端项目：[gsuid_core](https://github.com/Genshin-bots/gsuid_core) 💖 一套业务逻辑，多个平台支持！

前端项目：[gsuid_hub](https://github.com/Genshin-bots/gsuid_hub) 💖 易于使用的网页控制台，控制你的一切！

**🎉 [详细文档](https://docs.sayu-bot.com)** ( [快速开始(安装)](https://docs.sayu-bot.com/Started/InstallCore.html) | [网页控制台](https://docs.sayu-bot.com/Started/WebConsole.html) | [插件市场](https://docs.sayu-bot.com/InstallPlugins/PluginsList.html) )

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS + Shadcn UI
- **路由**: React Router DOM
- **状态管理**: React Hook Form + Zod
- **图表**: Recharts
- **日期处理**: date-fns
- **HTTP客户端**: 内置API封装

## 项目结构

```
src/
├── components/          # React组件
│   ├── ui/             # Shadcn UI组件
│   ├── config/         # 配置相关组件
│   └── layout/         # 布局组件
├── contexts/           # React Context
│   ├── AuthContext.tsx # 认证上下文
│   └── ThemeContext.tsx# 主题上下文
├── hooks/              # 自定义Hooks
├── lib/                # 工具库和API
│   ├── api.ts          # API封装
│   ├── mockData.ts     # 模拟数据
│   └── utils.ts        # 工具函数
├── pages/              # 页面组件
│   ├── BackupPage.tsx      # 备份页面
│   ├── ConsolePage.tsx     # 控制台页面
│   ├── CoreConfigPage.tsx  # 核心配置页面
│   ├── Dashboard.tsx       # 仪表盘
│   ├── DatabasePage.tsx    # 数据库页面
│   ├── Index.tsx          # 首页
│   ├── Login.tsx          # 登录页面
│   ├── LogsPage.tsx       # 日志页面
│   ├── NotFound.tsx       # 404页面
│   ├── PluginsPage.tsx    # 插件页面
│   ├── PluginStorePage.tsx# 插件商店页面
│   ├── SchedulerPage.tsx  # 调度器页面
│   └── ThemesPage.tsx     # 主题页面
├── App.tsx             # 主应用组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

## 功能特性

### 页面功能

1. **仪表盘 (Dashboard)**
   - 展示Bot统计信息（用户数、群组数、新增用户等）
   - 命令使用统计图表
   - 每日数据趋势图

2. **控制台 (Console)**
   - 实时消息监控
   - 快速命令执行

3. **插件管理 (Plugins)**
   - 插件列表展示
   - 插件启用/禁用
   - 插件配置管理

4. **插件商店 (Plugin Store)**
   - 在线插件浏览
   - 插件安装

5. **数据库管理 (Database)**
   - 数据查看
   - 数据操作

6. **日志管理 (Logs)**
   - 系统日志查看
   - 日志搜索过滤

7. **调度器 (Scheduler)**
   - 定时任务管理
   - 任务状态监控

8. **主题管理 (Themes)**
   - 主题切换
   - 自定义主题配置

9. **核心配置 (Core Config)**
   - 核心参数配置
   - 安全设置

10. **备份 (Backup)**
    - 数据备份
    - 文件管理

## 开发指南

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

启动开发服务器（端口8080）：

```bash
npm run dev
```

开发服务器支持：
- 热重载
- API代理（代理/api和/ws到后端localhost:8765）

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 配置说明

### Vite配置 (vite.config.ts)

- **开发模式**: 基础路径 `/`
- **生产模式**: 基础路径 `/app/`
- **API代理**: 开发模式下将 `/api` 代理到 `http://localhost:8765`
- **WebSocket代理**: 开发模式下将 `/ws` 代理到 `http://localhost:8765`

### 路径别名

项目配置了 `@` 作为 `src` 目录的别名：

```typescript
import Component from '@/components/xxx';
```

## API通信

项目使用自定义API封装与后端通信，详见 `src/lib/api.ts`。

## 样式

- 使用Tailwind CSS进行样式管理
- 使用Shadcn UI组件库
- 自定义样式在 `src/index.css` 和 `src/App.css` 中

## 浏览器支持

- Chrome/Edge 90+
- Firefox 90+
- Safari 15+
- 不支持IE浏览器

## 许可证

本项目为GsCore管理控制台的前端部分。

## 感谢

- 本项目仅供学习使用，请勿用于商业用途
- [爱发电](https://afdian.com/a/KimigaiiWuyi)
- [GPL-3.0 License](https://github.com/Genshin-bots/gsuid_core/blob/master/LICENSE) ©[@KimigaiiWuyi](https://github.com/KimigaiiWuyi)
