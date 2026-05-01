import * as React from 'react';
import { useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';

// ============================================================================
// 类型定义
// ============================================================================

export interface InputWithDropdownProps {
  /** 当前值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 下拉选项列表 */
  options: string[];
  /** 占位文本 */
  placeholder?: string;
  /** 输入框占位文本 */
  inputPlaceholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义容器样式 */
  className?: string;
  /** Popover 宽度，默认 400px */
  popoverWidth?: string;
}

// ============================================================================
// 组件定义
// ============================================================================

export function InputWithDropdown({
  value,
  onChange,
  options,
  placeholder = '选择或输入',
  inputPlaceholder = '输入或选择',
  disabled = false,
  className,
  popoverWidth = 'w-[400px]',
}: InputWithDropdownProps) {
  // 根据输入值实时筛选列表
  const filteredOptions = useMemo(() => {
    if (!value.trim()) return options;
    const lowerValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(lowerValue));
  }, [value, options]);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
    // 延迟聚焦，确保 Popover 已完全渲染
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal h-10 px-3',
            className
          )}
        >
          <span className="truncate">
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(popoverWidth, 'p-0')}
        align="start"
        onOpenAutoFocus={handleOpenAutoFocus}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputPlaceholder}
            className="h-9"
          />
        </div>
        {filteredOptions.length > 0 && (
          <div
            className="max-h-[200px] overflow-y-auto border-t"
            onWheel={(e) => e.stopPropagation()}
          >
            {filteredOptions.map((option) => (
              <div
                key={option}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
                  value === option && 'bg-accent'
                )}
                onClick={() => onChange(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
        {value.trim() && filteredOptions.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground border-t">
            无匹配选项
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
