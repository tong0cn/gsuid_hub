import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Plus, Pencil, Trash2, Filter, RefreshCw, ChevronLeft, ChevronRight, Settings, Database } from 'lucide-react';
import { databaseApi, PluginDatabaseInfo, DatabaseTableInfo, DatabaseColumn, PaginatedData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function DatabasePage() {
  const [plugins, setPlugins] = useState<PluginDatabaseInfo[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string>('');
  const [activeTable, setActiveTable] = useState<string>('');
  const [tableMetadata, setTableMetadata] = useState<DatabaseTableInfo | null>(null);
  const [data, setData] = useState<PaginatedData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState('');
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const selectedPlugin = useMemo(() => {
    return plugins.find(p => p.plugin_id === selectedPluginId);
  }, [plugins, selectedPluginId]);

  const fetchPlugins = useCallback(async () => {
    try {
      setIsLoading(true);
      const pluginData = await databaseApi.getPlugins();
      setPlugins(pluginData);
      if (pluginData.length > 0) {
        setSelectedPluginId(pluginData[0].plugin_id);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      toast({
        title: '加载失败',
        description: '无法加载插件列表',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  useEffect(() => {
    if (selectedPlugin && selectedPlugin.tables.length > 0) {
      setActiveTable(selectedPlugin.tables[0].table_name);
    } else {
      setActiveTable('');
    }
  }, [selectedPlugin]);

  useEffect(() => {
    if (activeTable) {
      fetchTableMetadata(activeTable);
      fetchTableData(activeTable, currentPage, perPage);
    }
  }, [activeTable]);

  const fetchTableMetadata = async (tableName: string) => {
    try {
      const metadata = await databaseApi.getTableMetadata(tableName);
      setTableMetadata(metadata);
    } catch (error) {
      console.error('Failed to fetch table metadata:', error);
    }
  };

  const fetchTableData = async (tableName: string, page: number = 1, pageSize: number = 20) => {
    try {
      const result = await databaseApi.getTableData(tableName, page, pageSize);
      setData(result);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      toast({
        title: '加载失败',
        description: '无法加载数据',
        variant: 'destructive'
      });
    }
  };

  const columns = tableMetadata?.columns || [];
  const columnNames = columns.map(col => col.name);

  const filteredData = useMemo(() => {
    if (!data?.items) return [];
    
    let result = [...data.items];

    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterColumn && filterValue) {
      result = result.filter((item) =>
        String(item[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return result;
  }, [data, searchTerm, filterColumn, filterValue]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  const handlePageChange = (newPage: number) => {
    if (activeTable && newPage >= 1 && newPage <= totalPages) {
      fetchTableData(activeTable, newPage, perPage);
    }
  };

  const handleCreate = () => {
    const emptyItem: Record<string, unknown> = {};
    columns.forEach((col) => {
      emptyItem[col.name] = col.default ?? (col.type === 'int' ? 0 : col.type === 'bool' ? false : '');
    });
    setEditingItem(emptyItem);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditingItem({ ...item });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem || !activeTable) return;

    try {
      if (isCreating) {
        await databaseApi.createRecord(activeTable, editingItem);
        toast({ title: '创建成功', description: '新记录已添加' });
      } else {
        const pkName = tableMetadata?.pk_name || 'id';
        const recordId = editingItem[pkName];
        await databaseApi.updateRecord(activeTable, recordId as string | number, editingItem);
        toast({ title: '更新成功', description: '记录已更新' });
      }
      fetchTableData(activeTable, currentPage, perPage);
      setIsDialogOpen(false);
      setEditingItem(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save record:', error);
      toast({
        title: '保存失败',
        description: '无法保存记录',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (item: Record<string, unknown>) => {
    if (!activeTable || !tableMetadata) return;

    try {
      const pkName = tableMetadata.pk_name || 'id';
      const recordId = item[pkName];
      await databaseApi.deleteRecord(activeTable, recordId as string | number);
      toast({ title: '删除成功', description: '记录已删除' });
      fetchTableData(activeTable, currentPage, perPage);
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast({
        title: '删除失败',
        description: '无法删除记录',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setEditingItem((prev) => prev ? { ...prev, [field]: value } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8" />
          数据库管理
        </h1>
        <p className="text-muted-foreground mt-1">浏览和管理数据库表</p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Label className="text-sm font-medium min-w-[80px]">选择插件</Label>
            <Select
              value={selectedPluginId}
              onValueChange={setSelectedPluginId}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="选择插件" />
              </SelectTrigger>
              <SelectContent>
                {plugins.map((plugin) => (
                  <SelectItem key={plugin.plugin_id} value={plugin.plugin_id}>
                    <div className="flex items-center gap-2">
                      {plugin.icon ? (
                        <img src={plugin.icon} alt={plugin.plugin_name} className="w-4 h-4 object-contain" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                      {plugin.plugin_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPlugin && selectedPlugin.tables.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-3 block">选择数据库表</Label>
            <ToggleGroup type="single" value={activeTable} onValueChange={setActiveTable} className="flex flex-wrap gap-1">
              {selectedPlugin.tables.map((table) => (
                <ToggleGroupItem key={table.table_name} value={table.table_name} className="px-4 py-2">
                  {table.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardContent>
        </Card>
      )}

      {activeTable && tableMetadata && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>{tableMetadata.label}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fetchTableData(activeTable, currentPage, perPage)} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  刷新
                </Button>
                <Button onClick={handleCreate} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  新增
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[200px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterColumn} onValueChange={setFilterColumn}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="筛选列" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterColumn && (
                  <Input
                    placeholder="值..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full sm:w-[150px]"
                  />
                )}
              </div>
            </div>

            <Separator className="my-2" />

            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.name} className="whitespace-nowrap">
                          {col.title.length > 10 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{col.title.slice(0, 10)}...</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {col.title}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            col.title
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px] whitespace-nowrap">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={index}>
                          {columns.map((col) => (
                            <TableCell key={col.name} className="whitespace-nowrap">
                              {typeof item[col.name] === 'boolean' ? (
                                <Badge variant={item[col.name] ? 'default' : 'secondary'}>
                                  {item[col.name] ? '是' : '否'}
                                </Badge>
                              ) : (
                                String(item[col.name] ?? '')
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </div>

            {data && data.total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  共 {data.total} 条记录，第 {currentPage} / {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? '新增记录' : '编辑记录'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map((col) => (
              <div key={col.name} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={col.name} className="text-right">
                  {col.title}
                </Label>
                {col.type === 'bool' ? (
                  <div className="col-span-3 flex items-center">
                    <Switch
                      checked={Boolean(editingItem?.[col.name])}
                      onCheckedChange={(checked) => handleInputChange(col.name, checked)}
                    />
                  </div>
                ) : col.type === 'int' || col.type === 'float' ? (
                  <Input
                    id={col.name}
                    type="number"
                    value={String(editingItem?.[col.name] ?? '')}
                    onChange={(e) => handleInputChange(col.name, col.type === 'int' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
                    className="col-span-3"
                  />
                ) : (
                  <Input
                    id={col.name}
                    value={String(editingItem?.[col.name] ?? '')}
                    onChange={(e) => handleInputChange(col.name, e.target.value)}
                    className="col-span-3"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
