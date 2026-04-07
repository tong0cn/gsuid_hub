import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabButtonGroup } from '@/components/ui/TabButtonGroup';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { BookOpen, Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Loader2, Sparkles, FileText } from 'lucide-react';
import { aiKnowledgeApi, AIKnowledgeItem } from '@/lib/api';
import { toast } from 'sonner';
import { FormCard } from '@/components/FormCard';

// ============================================================================
// 类型定义
// ============================================================================

interface KnowledgeFormData {
  id: string;
  plugin: string;
  title: string;
  content: string;
  tags: string[];
}

const initialFormData: KnowledgeFormData = {
  id: '',
  plugin: 'manual',
  title: '',
  content: '',
  tags: [],
};

// ============================================================================
// 组件定义
// ============================================================================

export default function AIKnowledgePage() {
  const { style } = useTheme();
  const { t } = useLanguage();
  const isGlass = style === 'glassmorphism';

  // 状态
  const [knowledgeList, setKnowledgeList] = useState<AIKnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>('plugin');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AIKnowledgeItem[]>([]);

  // Dialog 状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<KnowledgeFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 删除确认 Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AIKnowledgeItem | null>(null);

  // 查看详情 Dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<AIKnowledgeItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 加载知识列表
  const fetchKnowledgeList = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await aiKnowledgeApi.getKnowledgeList({ page, limit, source: sourceFilter });
      setKnowledgeList(data.list || []);
      setTotal(data.total);
      setPageSize(data.page_size);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sourceFilter, t]);

  useEffect(() => {
    fetchKnowledgeList();
  }, [fetchKnowledgeList]);

  // 搜索处理
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const data = await aiKnowledgeApi.searchKnowledge(searchQuery, 50, sourceFilter);
      setSearchResults(data.results || []);
      setShowSearchResults(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.loadFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  // 搜索结果切换
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 打开新增 Dialog
  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  // 打开编辑 Dialog
  const handleOpenEditDialog = (item: AIKnowledgeItem) => {
    setIsEditMode(true);
    setFormData({
      id: item.id,
      plugin: item.plugin,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
    });
    setDialogOpen(true);
  };

  // 保存知识
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('common.saveFailed'));
      return;
    }

    try {
      setIsSaving(true);
      if (isEditMode) {
        await aiKnowledgeApi.updateKnowledge(formData.id, {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
        });
        toast.success(t('common.saveSuccess'));
      } else {
        await aiKnowledgeApi.createKnowledge({
          plugin: formData.plugin,
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
        });
        toast.success(t('common.saveSuccess'));
      }
      setDialogOpen(false);
      fetchKnowledgeList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  // 删除知识
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      await aiKnowledgeApi.deleteKnowledge(itemToDelete.id);
      toast.success(t('common.success'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchKnowledgeList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  // 点击行打开编辑
  const handleOpenEdit = async (item: AIKnowledgeItem) => {
    setSelectedKnowledge(item);
    setFormData({
      id: item.id,
      plugin: item.plugin,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  // 分页
  const totalPages = pageSize ? Math.ceil(total / pageSize) : Math.ceil(total / limit);
  const currentPage = page;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 计算页码范围
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // 显示的数据源
  const displayList = showSearchResults && searchResults.length > 0 ? searchResults : knowledgeList;
  const displayTotal = showSearchResults && searchResults.length > 0 ? searchResults.length : total;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          {t('aiKnowledge.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('aiKnowledge.description')}</p>
      </div>

      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <TabButtonGroup
          options={[
            { value: 'plugin', label: t('aiKnowledge.sourcePlugin'), icon: <Sparkles className="w-4 h-4" /> },
            { value: 'manual', label: t('aiKnowledge.sourceManual'), icon: <Pencil className="w-4 h-4" /> },
          ]}
          value={sourceFilter}
          onValueChange={(value) => {
            setSourceFilter(value);
            setPage(1);
          }}
          className="shrink-0"
        />
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('aiKnowledge.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <Button onClick={handleOpenAddDialog} size="icon" className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 搜索结果提示 */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('aiKnowledge.searchResults')}: {searchResults.length}</span>
          <Button variant="ghost" size="sm" onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}>
            <X className="h-4 w-4 mr-1" />
            {t('common.clear')}
          </Button>
        </div>
      )}

      {/* 知识列表表格 */}
      <Card className={cn(isGlass ? "glass-card" : "border border-border/50")}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t('aiKnowledge.titleField')}</TableHead>
                    <TableHead className="w-[100px]">{t('aiKnowledge.plugin')}</TableHead>
                    <TableHead className="w-[180px]">{t('aiKnowledge.content')}</TableHead>
                    <TableHead>{t('aiKnowledge.tags')}</TableHead>
                    <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayList.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => handleOpenEdit(item)}>
                      <TableCell className="font-medium truncate">{item.title}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.plugin}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="line-clamp-1">{item.content.split('\n')[0]}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {!showSearchResults && totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, page - 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((p, index) =>
                        p === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === currentPage}
                              onClick={() => handlePageChange(p as number)}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-sm text-muted-foreground text-center mt-2">
                    {t('common.totalRecords', { total: displayTotal })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <FormCard
            type="knowledge"
            mode="edit"
            data={formData}
            onChange={(key, value) => setFormData({ ...formData, [key]: value })}
            showId={false}
          />
          <DialogFooter className="flex items-center justify-between">
            {isEditMode && (
              <span className="text-sm text-muted-foreground">
                ID: {formData.id}
              </span>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('aiKnowledge.deleteConfirm', { title: itemToDelete?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
