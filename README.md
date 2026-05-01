# GsCore Frontend v0.0.1

GsCore网页控制台前端项目 - 一个基于React的管理控制台界面。

后端项目：[gsuid_core](https://github.com/Genshin-bots/gsuid_core) 💖 一套业务逻辑，多个平台支持！

前端项目：[gsuid_hub](https://github.com/Genshin-bots/gsuid_hub) 💖 易于使用的网页控制台，控制你的一切！

**🎉 [详细文档](https://docs.sayu-bot.com)** ( [快速开始(安装)](https://docs.sayu-bot.com/Started/InstallCore.html) | [网页控制台](https://docs.sayu-bot.com/Started/WebConsole.html) | [插件市场](https://docs.sayu-bot.com/InstallPlugins/PluginsList.html) )

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS + Shadcn UI (基于 Radix UI)
- **路由**: React Router DOM
- **状态管理**: React Hook Form + Zod
- **图表**: Recharts
- **日期处理**: date-fns
- **HTTP客户端**: 内置API封装
- **国际化**: 自定义 i18n (支持中文/英文)
- **图标**: lucide-react

## 项目结构

```
src/
├── components/              # React组件
│   ├── ui/                 # Shadcn UI组件
│   │   ├── TabButtonGroup.tsx      # 标签切换按钮组
│   │   ├── MultiSelectChipGroup.tsx # 多选芯片组
│   │   ├── input-with-dropdown.tsx  # 输入框+下拉列表
│   │   └── ...                      # 其他 shadcn/ui 组件
│   ├── config/             # 配置相关组件
│   │   ├── ConfigField.tsx         # 通用配置字段
│   │   ├── ConfigForm.tsx          # 配置表单
│   │   ├── DynamicConfigPanel.tsx  # 动态配置面板
│   │   ├── CoreSettings.tsx        # 核心设置
│   │   ├── MiscSettings.tsx        # 杂项设置
│   │   ├── VerificationSettings.tsx# 验证设置
│   │   ├── ImageSendSettings.tsx   # 图片发送设置
│   │   ├── ButtonMarkdownSettings.tsx # 按钮和MD设置
│   │   ├── TagsInput.tsx           # 标签输入
│   │   └── index.ts               # 组件导出
│   ├── layout/             # 布局组件
│   │   ├── AppLayout.tsx          # 应用布局
│   │   └── AppSidebar.tsx         # 侧边栏导航
│   ├── backup/             # 备份相关组件
│   │   └── FileTreeSelector.tsx   # 文件树选择器
│   ├── FormCard.tsx        # 表单卡片组件
│   ├── GitMirrorDialog.tsx # Git镜像对话框
│   ├── NavLink.tsx         # 导航链接组件
│   └── StructuredDataViewer.tsx # 结构化数据查看器
├── contexts/               # React Context
│   ├── AuthContext.tsx     # 认证上下文
│   ├── ThemeContext.tsx    # 主题上下文
│   ├── LanguageContext.tsx # 国际化上下文
│   └── ConfigDirtyContext.tsx # 配置变更检测上下文
├── hooks/                  # 自定义Hooks
│   ├── use-mobile.tsx     # 移动端检测
│   ├── use-toast.ts       # Toast通知
│   └── useSystemControl.ts # 系统控制
├── i18n/                   # 国际化
│   └── locales/
│       ├── zh-CN.json     # 中文翻译
│       └── en-US.json     # 英文翻译
├── lib/                    # 工具库和API
│   ├── api.ts             # API封装
│   ├── mockData.ts        # 模拟数据
│   └── utils.ts           # 工具函数 (cn等)
├── pages/                  # 页面组件
│   ├── Dashboard.tsx           # 数据看板
│   ├── DatabasePage.tsx        # 数据库管理
│   ├── ConsolePage.tsx         # 控制台
│   ├── LogsPage.tsx            # 日志页面
│   ├── PluginsPage.tsx         # 插件管理
│   ├── PluginStorePage.tsx     # 插件商店
│   ├── SchedulerPage.tsx       # 调度器
│   ├── ThemesPage.tsx          # 主题管理
│   ├── BackupPage.tsx          # 备份管理
│   ├── CoreConfigPage.tsx      # 核心配置
│   ├── FrameworkConfigPage.tsx # 框架配置
│   ├── DatabaseConfigPage.tsx  # 数据库配置
│   ├── StateConfigPage.tsx     # 状态配置
│   ├── ImageUploadPage.tsx     # 图片上传配置
│   ├── AIConfigPage.tsx        # AI基础配置
│   ├── PersonaConfigPage.tsx   # AI人格配置
│   ├── MCPConfigPage.tsx       # MCP配置
│   ├── AIToolsPage.tsx         # AI工具管理
│   ├── AISkillsPage.tsx        # AI技能管理
│   ├── AIStatisticsPage.tsx    # AI统计
│   ├── AIScheduledTasksPage.tsx# AI定时任务
│   ├── AIKnowledgePage.tsx     # AI知识库
│   ├── AIMemoryPage.tsx        # AI记忆管理
│   ├── SystemPromptPage.tsx    # 系统提示词管理
│   ├── SessionManagementPage.tsx # 会话管理
│   ├── SettingsPage.tsx        # 账户设置
│   ├── Login.tsx               # 登录页面
│   ├── Index.tsx               # 首页
│   └── NotFound.tsx            # 404页面
├── App.tsx                 # 主应用组件
├── main.tsx                # 入口文件
└── index.css               # 全局样式
```

## 功能特性

### 页面功能

#### 📊 数据看板 (Dashboard)
- 展示Bot统计信息（用户数、群组数、新增用户等）
- 命令使用统计图表
- 每日数据趋势图

#### 💾 数据库管理 (Database)
- 数据查看与操作
- 数据库配置管理（支持 SQLite、MySQL、PostgreSQL、自定义连接）
- 数据库连接参数配置（主机、端口、用户名、密码等）

#### ⚙️ 管理核心 (Admin Core)

- **核心配置 (Core Config)**: 核心参数配置、安全设置
- **框架配置 (Framework Config)**: 框架级配置管理，支持渐进式配置页面
  - 核心设置、杂项设置、验证设置、图片发送设置、按钮和MD设置
  - 图片上传配置（支持 smms、S3、本地、自定义上传服务）
  - 数据库配置、状态配置
  - 预期配置项 + 意外配置项自动兜底渲染
- **备份管理 (Backup)**: 数据备份、文件管理、文件树选择
- **调度器 (Scheduler)**: 定时任务管理、任务状态监控

#### 📝 日志查看 (Logs View)

- **控制台 (Console)**: 实时消息监控、快速命令执行
- **历史日志 (Logs)**: 系统日志查看、日志搜索过滤

#### 🤖 AI配置 (AI Config)

- **基础配置 (AI Config)**: AI服务开关、行动模式选择、服务提供方配置
  - AI模型配置（OpenAI兼容、Claude等）
  - 嵌入模型配置、Rerank模型配置
  - 网络搜索配置（Tavily、Exa、MiniMax等）
  - 记忆配置、白名单/黑名单管理
  - 渐进式披露设计，核心配置默认展开，高级配置默认折叠
- **人格配置 (Persona Config)**: AI人格管理
  - 人格卡片列表（头像、启用开关、状态标签）
  - 创建/编辑/删除人格
  - 人格内容编辑（Markdown）
  - 关联群聊管理
  - 启用/禁用切换
- **MCP配置 (MCP Config)**: MCP服务器配置管理
  - MCP服务器列表、启用/禁用
  - 环境变量配置
  - 服务器重载
- **AI工具 (AI Tools)**: AI工具插件浏览与详情查看
  - 工具列表展示（按插件分组）
  - 工具详情弹窗（描述、参数说明）
- **AI技能 (AI Skills)**: AI技能管理
  - 技能列表展示
  - 创建/编辑/删除技能
  - 技能内容编辑（Markdown）
- **AI统计 (AI Statistics)**: AI使用统计
  - Token用量统计（按模型、按类型）
  - 费用分析
  - 柱状图、饼图可视化
  - 日期筛选
- **AI定时任务 (AI Scheduled Tasks)**: AI定时任务管理
  - 任务列表（表格展示）
  - 创建/编辑/删除任务
  - 任务启停控制
  - Cron表达式配置
- **AI知识库 (AI Knowledge)**: AI知识库管理
  - 知识条目列表（分页）
  - 创建/编辑/删除知识条目
  - 搜索过滤
- **AI记忆 (AI Memory)**: AI记忆管理
  - 记忆数据库浏览
  - 知识图谱可视化
  - 记忆搜索与查看
  - 记忆删除与刷新
- **系统提示词 (System Prompt)**: 系统提示词管理
  - 提示词列表（分页）
  - 创建/编辑/删除提示词
  - 搜索过滤
- **会话管理 (Session Management)**: AI会话历史管理
  - 会话列表（按用户/群组分组）
  - 会话详情查看（文本/JSON/消息三种视图）
  - 会话历史回放
  - 会话删除

#### 🔌 插件管理 (Plugins)
- 插件列表展示
- 插件启用/禁用
- 插件配置管理

#### 🏪 插件商店 (Plugin Store)
- 在线插件浏览
- 插件安装

#### 🎨 控制台管理 (Console Management)

- **主题管理 (Themes)**: 主题切换、自定义主题配置
  - 亮色/暗色模式
  - 纯色/毛玻璃风格
  - 多种主题色（红、紫、蓝、绿、橙、粉）
  - 图标颜色配置
- **账户设置 (Settings)**: 账户管理
  - 头像上传
  - 用户名修改
  - 密码修改

### 核心特性

#### 🌐 国际化 (i18n)
- 支持中文（zh-CN）和英文（en-US）双语
- 通过 `LanguageContext` 统一管理
- 嵌套键组织翻译，按功能模块分组

#### 🎨 主题系统
- 亮色/暗色模式切换
- 纯色（Solid）/ 毛玻璃（Glassmorphism）风格
- 6种主题色可选
- CSS变量系统 + Tailwind映射
- `glass-card` 自动适配不同主题模式

#### 🔐 认证系统
- 登录认证与路由保护
- 401自动跳转登录页
- Token管理

#### 📱 响应式设计
- 移动端优先，支持多断点适配
- 侧边栏可折叠
- 表格在移动端自动切换为卡片布局

#### ⚡ 性能优化
- React.memo 优化组件渲染
- useMemo/useCallback 缓存计算和回调
- 组件懒加载
- 图片缓存与错误处理

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
- [GPL-3.0 License](https://github.com/Genshin-bots/gsuid_hub/blob/master/LICENSE) ©[@KimigaiiWuyi](https://github.com/KimigaiiWuyi)
