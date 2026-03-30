import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Plus, Copy, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: string[];
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  options,
}: TagsInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listValue = Array.isArray(value) ? value : [];

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !listValue.includes(trimmed)) {
      onChange([...listValue, trimmed]);
    }
    setSearchQuery('');
  };

  const handleRemoveTag = (index: number) => {
    onChange(listValue.filter((_, i) => i !== index));
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      handleAddTag(searchQuery);
    }
  };

  // 截断文本到指定宽度（中文字符宽度为1，其他字符宽度为0.5）
  const truncateToWidth = (text: string, maxWidth: number = 12): string => {
    const chineseRegex = /[\u4e00-\u9fa5]/g;
    const chineseCount = (text.match(chineseRegex) || []).length;
    const otherCount = text.length - chineseCount;
    const totalWidth = chineseCount + otherCount * 0.5;
    
    if (totalWidth <= maxWidth) return text;
    
    let result = '';
    let currentWidth = 0;
    for (const char of text) {
      const charWidth = chineseRegex.test(char) ? 1 : 0.5;
      if (currentWidth + charWidth > maxWidth) break;
      result += char;
      currentWidth += charWidth;
    }
    return result + '...';
  };

  // 过滤选项（排除已选中的，支持搜索）
  const filteredOptions = options?.filter(opt => 
    !listValue.includes(opt) && 
    (!searchQuery || opt.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // 过滤标签（支持搜索）
  const filteredTags = searchQuery
    ? listValue.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : listValue;

  return (
    <div className="border rounded-md bg-background/30 backdrop-blur-sm h-10">
      <div className="flex items-center gap-2 px-3 h-full">
        {/* 已添加的标签列表 */}
        {listValue.map((item, index) => (
          <div
            key={index}
            className="flex items-center rounded-full border border-transparent bg-secondary/30 text-secondary-foreground hover:bg-secondary/50 backdrop-blur-sm gap-1 h-6 text-xs px-2.5 py-0.5 font-semibold transition-colors max-w-[300px] shrink-0 overflow-hidden"
          >
            <span className="truncate min-w-0">
              {truncateToWidth(item)}
            </span>
            <button
              onClick={() => handleRemoveTag(index)}
              className="hover:text-destructive shrink-0 flex-shrink-0"
              disabled={disabled}
              title="删除"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* 输入框和添加按钮 */}
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            placeholder={listValue.length === 0 ? (placeholder || '输入并回车添加...') : ''}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground min-w-[80px] pl-1"
          />
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={disabled}
              >
                <Plus className="w-3 h-3 mr-1" />
                更多
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  已添加的标签 ({listValue.length})
                </div>
                {listValue.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">暂无标签</div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {listValue.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group"
                      >
                        <span className="flex-1 truncate text-sm">{item}</span>
                        <button
                          onClick={() => handleCopy(item, index)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                          title="复制"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveTag(index)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded hover:text-destructive"
                          title="删除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 选项列表 */}
              {options && options.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="搜索可选值..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredOptions.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2 text-center">
                        {searchQuery ? '没有匹配的可选值' : '所有选项都已添加'}
                      </div>
                    ) : (
                      filteredOptions.map((opt) => (
                        <div
                          key={opt}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => {
                            handleAddTag(opt);
                            setIsOpen(false);
                          }}
                        >
                          <span className="flex-1 truncate text-sm">{opt}</span>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
