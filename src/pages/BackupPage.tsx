import { useState, useEffect, useMemo } from 'react';
import { HardDrive, Download, Trash2, Play, Archive, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ConfigField, ConfigFieldDefinition, ConfigValue, ConfigFieldType } from '@/components/config';
import { FileTreeSelector } from '@/components/backup/FileTreeSelector';
import { backupApi, BackupFile, FileTreeNode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Define types for backend response
interface BackupConfigItem {
  type: string;
  title?: string;
  desc?: string;
  data: unknown;
  options?: string[];
}

// Convert backend config to frontend ConfigFieldDefinition
const convertToConfig = (backendConfig: Record<string, BackupConfigItem>): Record<string, ConfigFieldDefinition> => {
  const config: Record<string, ConfigFieldDefinition> = {};
  for (const [key, value] of Object.entries(backendConfig)) {
    let type: ConfigFieldType = 'text';
    const rawType = value.type || '';
    
    // 直接匹配后端定义的Gs系列配置类型
    switch (rawType) {
      case 'GsBoolConfig':
        type = 'boolean';
        break;
      case 'GsIntConfig':
        type = 'number';
        break;
      case 'GsListConfig':
        type = 'tags';
        break;
      case 'GsListStrConfig':
        // 如果有options则是多选，否则是标签列表
        type = value.options && value.options.length > 0 ? 'multiselect' : 'tags';
        break;
      case 'GsTimeConfig':
        // 时间配置使用text类型显示
        type = 'text';
        break;
      case 'GsStrConfig':
        // 如果有options则是下拉选择，否则是普通文本
        type = value.options && value.options.length > 0 ? 'select' : 'text';
        break;
      case 'GsDictConfig':
        type = 'text';
        break;
      case 'GsImageConfig':
        type = 'image';
        break;
      default:
        // 默认为文本类型
        type = 'text';
    }

    config[key] = {
      value: value.data as ConfigValue,
      type,
      label: value.title || key,
      placeholder: value.desc || '请输入内容',
      options: value.options,
      description: value.desc || key,
      required: false,
      disabled: false,
    } as ConfigFieldDefinition;
  }
  return config;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BackupPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, ConfigFieldDefinition>>({});
  const [selectedPaths, setSelectedPaths] = useState<string[]>([
    'data', 'data/config', 'data/config/settings.json', 'data/config/users.json',
    'data/logs', 'data/db', 'data/db/main.sqlite'
  ]);
  // Extend BackupFile with frontend-specific fields
  interface BackupFileWithMeta extends BackupFile {
    id: number;
    filename: string;
    createdAt: Date;
    status: 'completed' | 'in_progress' | 'failed';
  }

  const [backupList, setBackupList] = useState<BackupFileWithMeta[]>([]);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [originalConfig, setOriginalConfig] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BackupFileWithMeta | null>(null);

  // Fetch backup files and config from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch backup files
        const files = await backupApi.getFiles();
        // Convert backend fields to frontend format
        const formattedFiles = files.map((file: any, index: number) => ({
          ...file,
          id: index + 1,
          filename: file.fileName,
          createdAt: new Date(file.created),
          status: 'completed',
        }));
        setBackupList(formattedFiles);

        // Fetch backup config
        const backendConfig = await backupApi.getConfig();
        console.log('BackupPage: Raw backend config:', backendConfig);
        
        // Initialize selectedPaths from backup_dir data if available
        if (backendConfig.backup_dir?.data && Array.isArray(backendConfig.backup_dir.data)) {
          setSelectedPaths(backendConfig.backup_dir.data);
        }
        
        const convertedConfig = convertToConfig(backendConfig);
        console.log('BackupPage: Converted config:', convertedConfig);
        setConfig(convertedConfig);
        // Save original config for change detection
        setOriginalConfig(backendConfig);

        // Fetch file tree
        const tree = await backupApi.getFileTree();
        console.log('BackupPage: File tree:', tree);
        setFileTree(tree);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Convert file tree type to match component expectation
  const convertFileTree = (nodes: FileTreeNode[]): any[] => {
    return nodes.map(node => ({
      ...node,
      type: node.type === 'directory' ? 'folder' : 'file',
      children: convertFileTree(node.children)
    }));
  };

  const convertedFileTree = convertFileTree(fileTree);

  const handleConfigChange = (key: string, value: ConfigValue) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [key]: { ...prev[key], value }
      };
      
      // Check if any config has changed from original
      const changes = Object.keys(newConfig).map(key => {
        return JSON.stringify(newConfig[key]?.value) !== JSON.stringify(originalConfig[key]?.data);
      });
      
      // Also check if selected paths changed
      changes.push(JSON.stringify(selectedPaths) !== JSON.stringify(originalConfig.backup_dir?.data));
      
      // Also check if WebDAV config changed
      if (originalConfig.webdav_url) {
        changes.push(JSON.stringify(newConfig.webdav_url?.value) !== JSON.stringify(originalConfig.webdav_url?.data));
      }
      if (originalConfig.webdav_username) {
        changes.push(JSON.stringify(newConfig.webdav_username?.value) !== JSON.stringify(originalConfig.webdav_username?.data));
      }
      if (originalConfig.webdav_password) {
        changes.push(JSON.stringify(newConfig.webdav_password?.value) !== JSON.stringify(originalConfig.webdav_password?.data));
      }
      
      setHasChanges(changes.some(change => change));
      return newConfig;
    });
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const configData: Record<string, any> = {};
      Object.entries(config).forEach(([key, field]) => {
        configData[key] = field.value;
      });
      configData.backup_dir = selectedPaths;
      
      // 确保 WebDAV 配置也被保存
      if (config.webdav_url?.value) configData.webdav_url = config.webdav_url.value;
      if (config.webdav_username?.value) configData.webdav_username = config.webdav_username.value;
      if (config.webdav_password?.value) configData.webdav_password = config.webdav_password.value;
      
      await backupApi.setConfig(configData);
      
      // Update original config after successful save
      const updatedOriginal = { ...originalConfig };
      Object.keys(config).forEach(key => {
        if (updatedOriginal[key]) {
          updatedOriginal[key].data = config[key].value;
        }
      });
      updatedOriginal.backup_dir.data = selectedPaths;
      
      // Update WebDAV config in original
      if (config.webdav_url) {
        updatedOriginal.webdav_url = { ...updatedOriginal.webdav_url, data: config.webdav_url.value };
      }
      if (config.webdav_username) {
        updatedOriginal.webdav_username = { ...updatedOriginal.webdav_username, data: config.webdav_username.value };
      }
      if (config.webdav_password) {
        updatedOriginal.webdav_password = { ...updatedOriginal.webdav_password, data: config.webdav_password.value };
      }
      
      setOriginalConfig(updatedOriginal);
      
      setHasChanges(false);
      toast({
        title: "设置已保存",
        description: "备份配置已成功更新",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "保存备份配置时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await backupApi.createBackup();
      // Refresh backup list
      const files = await backupApi.getFiles();
      const formattedFiles = files.map((file: any, index: number) => ({
        ...file,
        id: index + 1,
        filename: file.fileName,
        createdAt: new Date(file.created),
        status: 'completed',
      }));
      setBackupList(formattedFiles);
      toast({
        title: "备份成功",
        description: "备份已成功创建",
      });
    } catch (error) {
      toast({
        title: "备份失败",
        description: "创建备份时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteBackup = async (file: BackupFileWithMeta) => {
    try {
      await backupApi.deleteFile(file.fileName);
      setBackupList(prev => prev.filter(b => b.fileName !== file.fileName));
      toast({
        title: "删除成功",
        description: "备份文件已删除",
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: "删除备份文件时发生错误",
        variant: "destructive",
      });
    }
    setDeleteTarget(null);
  };

  const handleDownload = (backup: BackupFileWithMeta) => {
    // Use the download URL from API
    window.open(backup.downloadUrl, '_blank');
  };

  const handleDeleteClick = (backup: BackupFileWithMeta) => {
    setDeleteTarget(backup);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    handleDeleteBackup(deleteTarget);
  };

  const showWebDAVConfig = Array.isArray(config.backup_method?.value)
    ? config.backup_method.value.includes('web_dav')
    : String(config.backup_method?.value || '').includes('web_dav');
  
  // 如果启用了 WebDAV 备份方式，确保 WebDAV 配置字段存在
  if (showWebDAVConfig) {
    // 创建默认的 WebDAV 配置字段
    if (!config.webdav_url) {
      config.webdav_url = {
        type: 'text',
        label: 'WebDAV URL',
        value: '' as ConfigValue,
        placeholder: '请输入 WebDAV 服务器地址',
        description: 'WebDAV 服务器地址',
        required: false,
        disabled: false,
      };
    }
    if (!config.webdav_username) {
      config.webdav_username = {
        type: 'text',
        label: 'WebDAV 用户名',
        value: '' as ConfigValue,
        placeholder: '请输入用户名',
        description: 'WebDAV 服务器用户名',
        required: false,
        disabled: false,
      };
    }
    if (!config.webdav_password) {
      config.webdav_password = {
        type: 'password',
        label: 'WebDAV 密码',
        value: '' as ConfigValue,
        placeholder: '请输入密码',
        description: 'WebDAV 服务器密码',
        required: false,
        disabled: false,
      };
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="w-6 h-6 text-primary" />
            </div>
            备份管理
          </h1>
          <p className="text-muted-foreground mt-1">配置数据备份策略和管理备份文件</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveSettings} disabled={!hasChanges || isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
          <Button onClick={handleBackupNow} disabled={isBackingUp}>
            <Play className="w-4 h-4 mr-2" />
            {isBackingUp ? '备份中...' : '立即备份'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Archive className="w-4 h-4" />
            备份设置
          </TabsTrigger>
          <TabsTrigger value="downloads" className="gap-2">
            <Download className="w-4 h-4" />
            备份下载
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
              <CardDescription>配置备份方式和时间计划</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                {Object.entries(config)
                  .filter(([key]) => {
                    // 排除 backup_dir，在备份内容中单独处理
                    // 排除 WebDAV 配置，在下方单独展示
                    return key !== 'backup_dir' &&
                           key !== 'webdav_url' &&
                           key !== 'webdav_username' &&
                           key !== 'webdav_password';
                  })
                  .map(([key, field]) => (
                    <ConfigField
                      key={key}
                      fieldKey={key}
                      field={field}
                      onChange={handleConfigChange}
                    />
                  ))}
              </div>

              {/* 单独的 WebDAV 配置区块 */}
              {showWebDAVConfig && (config.webdav_url || config.webdav_username || config.webdav_password) && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-4">WebDAV 配置</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                    {config.webdav_url && (
                      <ConfigField
                        fieldKey="webdav_url"
                        field={config.webdav_url}
                        onChange={handleConfigChange}
                      />
                    )}
                    {config.webdav_username && (
                      <ConfigField
                        fieldKey="webdav_username"
                        field={config.webdav_username}
                        onChange={handleConfigChange}
                      />
                    )}
                    {config.webdav_password && (
                      <ConfigField
                        fieldKey="webdav_password"
                        field={config.webdav_password}
                        onChange={handleConfigChange}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>备份内容</CardTitle>
              <CardDescription>选择需要备份的文件和文件夹</CardDescription>
            </CardHeader>
            <CardContent>
              <FileTreeSelector
                items={convertedFileTree}
                selectedPaths={selectedPaths}
                onSelectionChange={setSelectedPaths}
                className="max-h-80 overflow-auto"
              />
              <p className="text-sm text-muted-foreground mt-3">
                已选择 {selectedPaths.length} 个项目
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>备份历史</CardTitle>
              <CardDescription>管理和下载已创建的备份文件</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupList.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.filename}</TableCell>
                      <TableCell>{formatBytes(backup.size)}</TableCell>
                      <TableCell>
                        {format(backup.createdAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            backup.status === 'completed' ? 'default' : 
                            backup.status === 'in_progress' ? 'secondary' : 'destructive'
                          }
                        >
                          {backup.status === 'completed' ? '完成' : 
                           backup.status === 'in_progress' ? '进行中' : '失败'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(backup)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {backupList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无备份记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除备份</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除备份文件 <span className="font-medium text-foreground">{deleteTarget?.filename}</span> 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
