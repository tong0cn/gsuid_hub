import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
}: TagsInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const listValue = Array.isArray(value) ? value : [];
  
  const filteredTags = searchQuery
    ? listValue.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : listValue;
  
  const hiddenCount = visibleCount !== null ? Math.max(0, listValue.length - visibleCount) : 0;
  const hasOverflow = visibleCount !== null && visibleCount < listValue.length;

  // 计算可见标签数量
  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current || listValue.length === 0) {
      setVisibleCount(null);
      return;
    }

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerPadding = 24;
    const triggerWidth = hasOverflow ? 60 : 40;
    const gap = 6;
    const availableWidth = containerWidth - containerPadding - triggerWidth - gap;

    let currentWidth = 0;
    let visible = 0;

    const badgeWidths: number[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.className = 'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold gap-1 h-6 text-xs';
    document.body.appendChild(tempDiv);

    for (const item of listValue) {
      tempDiv.textContent = item;
      const width = tempDiv.offsetWidth + 8;
      badgeWidths.push(width);
    }

    document.body.removeChild(tempDiv);

    for (let i = 0; i < badgeWidths.length; i++) {
      const width = badgeWidths[i] + (visible > 0 ? gap : 0);
      if (currentWidth + width <= availableWidth) {
        currentWidth += width;
        visible++;
      } else {
        break;
      }
    }

    if (visible <= 2 && listValue.length > 2) {
      visible = listValue.length;
    }

    setVisibleCount(visible < listValue.length ? visible : null);
  }, [listValue, hasOverflow]);

  useEffect(() => {
    calculateVisibleCount();
    
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleCount();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [calculateVisibleCount]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !listValue.includes(trimmed)) {
      onChange([...listValue, trimmed]);
    }
    setSearchQuery('');
  }, [listValue, onChange]);

  const handleRemoveTag = (index: number) => {
    onChange(listValue.filter((_, i) => i !== index));
  };

  const displayedTags = visibleCount !== null ? listValue.slice(0, visibleCount) : listValue;
  const showAddPrompt = searchQuery.trim() && !listValue.includes(searchQuery.trim());

  return (
    <div 
      ref={containerRef}
      className="border rounded-md bg-background min-h-[38px]"
    >
      <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] px-3 py-1.5">
        {displayedTags.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className="gap-1 h-6 text-xs max-w-[200px] truncate"
          >
            {item}
            <button
              onClick={() => handleRemoveTag(listValue.indexOf(item))}
              className="ml-0.5 hover:text-destructive shrink-0"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-1 h-6 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors border rounded-full hover:bg-secondary"
            >
              {hasOverflow ? (
                <>
                  +{hiddenCount}
                  <Search className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  添加
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="flex items-center gap-2 px-4 py-2 border-b">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder || '搜索或添加标签...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    handleAddTag(searchQuery);
                    setIsOpen(false);
                  }
                }}
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground pl-2"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredTags.length === 0 && !showAddPrompt ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  暂无标签
                </div>
              ) : (
                <>
                  {showAddPrompt && (
                    <div
                      className="flex items-center gap-2 px-2 py-2 rounded-md bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      onClick={() => {
                        handleAddTag(searchQuery);
                        setIsOpen(false);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-sm">添加 "{searchQuery}"</span>
                      <span className="ml-auto text-xs opacity-70">按 Enter</span>
                    </div>
                  )}
                  
                  {filteredTags.map((item) => {
                    const actualIndex = listValue.indexOf(item);
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
                      >
                        <span className="flex-1 truncate text-sm">{item}</span>
                        <span className="text-xs text-muted-foreground">
                          {actualIndex < (visibleCount ?? listValue.length) ? '已显示' : ''}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(actualIndex);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                          disabled={disabled}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
