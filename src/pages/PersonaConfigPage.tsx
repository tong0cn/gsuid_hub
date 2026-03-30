import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/components/config/TagsInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Trash2, Edit3, Sparkles, User, Check, Brain } from 'lucide-react';
import { personaApi, frameworkConfigApi, PersonaInfo, PersonaFrameworkConfig } from '@/lib/api';
import { toast } from 'sonner';

// ============================================================================
// 类型定义
// ============================================================================

interface PersonaCardData extends PersonaInfo {
  enabled: boolean;
  groups: string[];
}

// ============================================================================
// 工具函数
// ============================================================================

// 截取 markdown 文本的预览内容
function getMarkdownPreview(content: string, maxLength: number = 150): string {
  if (!content) return '';
  const cleaned = content
    .replace(/^#+ .*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

// ============================================================================
// 组件定义
// ============================================================================

export default function PersonaConfigPage() {
  const { style } = useTheme();
  const { t } = useLanguage();
  const isGlass = style === 'glassmorphism';
  
  // 状态
  const [personaList, setPersonaList] = useState<string[]>([]);
  const [personaDetails, setPersonaDetails] = useState<Record<string, PersonaCardData>>({});
  const [frameworkConfig, setFrameworkConfig] = useState<PersonaFrameworkConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 创建对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaQuery, setNewPersonaQuery] = useState('');
  
  // 编辑对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaCardData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editingGroups, setEditingGroups] = useState<string[]>([]);
  
  // 二次确认对话框状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  
  // 获取启用人格列表
  const enabledPersonas = useMemo(() => {
    return frameworkConfig?.config.enable_persona.value || [];
  }, [frameworkConfig]);
  
  // 获取人格对应的群聊映射
  const personaGroupsMap = useMemo(() => {
    return frameworkConfig?.config.persona_for_session.value || {};
  }, [frameworkConfig]);
  
  // 获取所有人格卡片数据
  const personaCards = useMemo(() => {
    return personaList.map(name => ({
      name,
      enabled: enabledPersonas.includes(name),
      groups: personaGroupsMap[name] || [],
      content: personaDetails[name]?.content || '',
    }));
  }, [personaList, enabledPersonas, personaGroupsMap, personaDetails]);
  
  // 获取人格头像URL
  const getAvatarUrl = useCallback((personaName: string) => {
    return `${import.meta.env.VITE_API_BASE || ''}/api/persona/${encodeURIComponent(personaName)}/avatar`;
  }, []);
  
  // 加载人格列表和框架配置
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [listData, frameworkData] = await Promise.all([
        personaApi.getPersonaList(),
        personaApi.getFrameworkConfig(),
      ]);
      
      setPersonaList(listData);
      setFrameworkConfig(frameworkData);
      
      // 加载每个人格的详情
      const detailsMap: Record<string, PersonaCardData> = {};
      await Promise.all(
        listData.map(async (name) => {
          try {
            const detail = await personaApi.getPersona(name);
            detailsMap[name] = {
              name: detail.name,
              content: detail.content,
              enabled: enabledPersonas.includes(name),
              groups: personaGroupsMap[name] || [],
            };
          } catch {
            detailsMap[name] = {
              name,
              content: '',
              enabled: false,
              groups: [],
            };
          }
        })
      );
      
      setPersonaDetails(detailsMap);
    } catch (error) {
      console.error('Failed to load persona data:', error);
      toast.error(t('personaConfig.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t, enabledPersonas, personaGroupsMap]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  // 更新框架配置到后端
  const updateFrameworkConfig = useCallback(async (configName: string, config: Record<string, unknown>) => {
    try {
      await frameworkConfigApi.updateFrameworkConfig(configName, config);
      toast.success(t('common.saveSuccess'));
    } catch (error) {
      console.error('Failed to update framework config:', error);
      toast.error(t('common.saveFailed'));
      throw error;
    }
  }, [t]);
  
  // 创建新人格
  const handleCreatePersona = async () => {
    if (!newPersonaName.trim()) {
      toast.error(t('common.error'));
      return;
    }
    if (!newPersonaQuery.trim()) {
      toast.error(t('common.error'));
      return;
    }
    
    try {
      setIsCreating(true);
      await personaApi.createPersona({
        name: newPersonaName.trim(),
        query: newPersonaQuery.trim(),
      });
      
      toast.success(t('personaConfig.createSuccess'));
      setCreateDialogOpen(false);
      setNewPersonaName('');
      setNewPersonaQuery('');
      
      await loadData();
    } catch (error) {
      console.error('Failed to create persona:', error);
      toast.error(t('personaConfig.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };
  
  // 切换人格启用状态
  const handleToggleEnabled = async (personaName: string, enabled: boolean) => {
    if (!frameworkConfig) return;
    
    try {
      const newEnabledList = enabled
        ? [...enabledPersonas, personaName]
        : enabledPersonas.filter(n => n !== personaName);
      
      await updateFrameworkConfig(frameworkConfig.full_name, {
        enable_persona: newEnabledList,
      });
      
      await loadData();
    } catch (error) {
      console.error('Failed to toggle persona:', error);
    }
  };
  
  // 打开编辑对话框
  const handleEditClick = (persona: PersonaCardData) => {
    setEditingPersona(persona);
    setEditContent(persona.content);
    setEditingGroups([...persona.groups]);
    setEditDialogOpen(true);
  };
  
  // 保存编辑（群聊关联）
  const handleSaveEdit = async () => {
    if (!editingPersona || !frameworkConfig) return;
    
    try {
      setIsSaving(true);
      
      // 保存群聊关联
      const updatedPersonaForSession = {
        ...personaGroupsMap,
        [editingPersona.name]: editingGroups,
      };
      
      await updateFrameworkConfig(frameworkConfig.full_name, {
        persona_for_session: updatedPersonaForSession,
      });
      
      toast.success(t('personaConfig.saveSuccess'));
      setEditDialogOpen(false);
      setEditingPersona(null);
      setEditContent('');
      setEditingGroups([]);
      
      await loadData();
    } catch (error) {
      console.error('Failed to save persona:', error);
      toast.error(t('personaConfig.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // 打开删除确认
  const handleDeleteClick = (personaName: string) => {
    setDeleteTarget(personaName);
    setDeleteConfirmOpen(true);
  };

  // 处理卡片上的群聊标签变化（直接保存）
  const handleGroupsChange = async (personaName: string, groups: string[]) => {
    if (!frameworkConfig) return;
    
    try {
      const updatedPersonaForSession = {
        ...personaGroupsMap,
        [personaName]: groups,
      };
      
      await updateFrameworkConfig(frameworkConfig.full_name, {
        persona_for_session: updatedPersonaForSession,
      });
      
      // 重新加载数据以更新显示
      await loadData();
    } catch (error) {
      console.error('Failed to save groups:', error);
      toast.error(t('common.saveFailed'));
    }
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      setIsDeleting(deleteTarget);
      await personaApi.deletePersona(deleteTarget);
      toast.success(t('personaConfig.deleteSuccess'));
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      
      await loadData();
    } catch (error) {
      console.error('Failed to delete persona:', error);
      toast.error(t('personaConfig.deleteFailed'));
    } finally {
      setIsDeleting(null);
    }
  };
  
  // 渲染人格卡片
  const renderPersonaCard = (persona: PersonaCardData) => {
    const preview = getMarkdownPreview(persona.content);
    
    return (
      <Card
        key={persona.name}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "hover:shadow-lg",
          isGlass ? "glass-card" : "border border-border/50"
        )}
      >
        <CardContent className="p-4">
          {/* 顶部: 头像、名称和状态 */}
          <div className="flex items-start gap-3">
            {/* 头像 */}
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={getAvatarUrl(persona.name)}
                alt={persona.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ICON.png';
                }}
              />
            </div>
            
            {/* 名称和启用开关 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base truncate">{persona.name}</h3>
                <Switch
                  checked={persona.enabled}
                  onCheckedChange={(checked) => handleToggleEnabled(persona.name, checked)}
                  className={cn(
                    "shrink-0",
                    persona.enabled
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-muted hover:bg-muted/80"
                  )}
                />
              </div>
              <Badge
                className={cn(
                  "mt-1 text-xs",
                  persona.enabled
                    ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {persona.enabled ? t('personaConfig.enabled') : t('personaConfig.disabled')}
              </Badge>
            </div>
          </div>
          
          {/* 内容预览 */}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 break-words whitespace-pre-wrap">
            {preview || t('common.noData')}
          </p>
          
          {/* 底部: 关联群聊TagsInput和操作按钮 */}
          <div className="flex items-center justify-between mt-3 gap-3">
            {/* 左下角: 关联群聊TagsInput */}
            <div className="flex-1 min-w-0">
              <TagsInput
                value={persona.groups}
                onChange={(groups) => handleGroupsChange(persona.name, groups)}
                placeholder={t('personaConfig.noGroups')}
              />
            </div>
            
            {/* 右下角: 编辑和删除按钮 */}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClick(persona)}
                className="h-8 px-3 gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(persona.name)}
                className="h-8 px-3 text-destructive hover:text-destructive gap-1.5"
                disabled={isDeleting === persona.name}
              >
                {isDeleting === persona.name ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6 flex-1 overflow-auto p-6 h-full flex flex-col">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8" />
            {t('personaConfig.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('personaConfig.description')}</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('personaConfig.createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('personaConfig.createNew')}
              </DialogTitle>
              <DialogDescription>
                {t('personaConfig.createNewDesc')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="persona-name">{t('personaConfig.personaName')}</Label>
                <Input
                  id="persona-name"
                  placeholder={t('personaConfig.personaNamePlaceholder')}
                  value={newPersonaName}
                  onChange={(e) => setNewPersonaName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="persona-query">{t('personaConfig.personaQuery')}</Label>
                <Textarea
                  id="persona-query"
                  placeholder={t('personaConfig.personaQueryPlaceholder')}
                  value={newPersonaQuery}
                  onChange={(e) => setNewPersonaQuery(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreatePersona}
                disabled={isCreating || !newPersonaName.trim() || !newPersonaQuery.trim()}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('personaConfig.creating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('common.confirm')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 人格列表 - 两列布局 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : personaCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('personaConfig.noPersonas')}</p>
          <Button
            variant="link"
            onClick={() => setCreateDialogOpen(true)}
            className="mt-2"
          >
            {t('personaConfig.createNew')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personaCards.map(renderPersonaCard)}
        </div>
      )}
      
      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {t('personaConfig.editPersona')}: {editingPersona?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden py-4 space-y-4">
            {/* 人设内容编辑 */}
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="edit-content">{t('personaConfig.personaContent')}</Label>
              <ScrollArea className="rounded-md border p-4 min-h-[300px]">
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[280px] resize-none border-0 focus-visible:ring-0 p-0 font-mono text-sm"
                />
              </ScrollArea>
            </div>
            
            {/* 关联群聊编辑 */}
            <div className="space-y-2">
              <Label>{t('personaConfig.enabledGroups')}</Label>
              <TagsInput
                value={editingGroups}
                onChange={setEditingGroups}
                placeholder={t('personaConfig.groupsPlaceholder')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => setSaveConfirmOpen(true)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t('personaConfig.savePersona')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 保存二次确认 */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('personaConfig.confirmSave')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('personaConfig.confirmSaveMessage', { name: editingPersona?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 删除二次确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('personaConfig.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('personaConfig.deleteConfirmMessage', { name: deleteTarget })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
