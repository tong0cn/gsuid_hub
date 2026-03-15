import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, Folder, FolderOpen, File } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// #TODO: Replace with actual API types
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FileTreeNode[];
}

interface FileTreeSelectorProps {
  items: FileTreeNode[];
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  className?: string;
}

// Helper to get all descendant paths
function getAllDescendantPaths(node: FileTreeNode): string[] {
  const paths = [node.path];
  if (node.children) {
    node.children.forEach(child => {
      paths.push(...getAllDescendantPaths(child));
    });
  }
  return paths;
}

// Helper to check selection state
function getSelectionState(
  node: FileTreeNode,
  selectedPaths: Set<string>
): 'checked' | 'unchecked' | 'indeterminate' {
  if (node.type === 'file') {
    return selectedPaths.has(node.path) ? 'checked' : 'unchecked';
  }

  const allDescendants = getAllDescendantPaths(node).filter(p => p !== node.path);
  if (allDescendants.length === 0) {
    return selectedPaths.has(node.path) ? 'checked' : 'unchecked';
  }

  const selectedCount = allDescendants.filter(p => selectedPaths.has(p)).length;
  
  if (selectedCount === 0) return 'unchecked';
  if (selectedCount === allDescendants.length) return 'checked';
  return 'indeterminate';
}

interface TreeNodeProps {
  node: FileTreeNode;
  selectedPaths: Set<string>;
  onToggle: (node: FileTreeNode) => void;
  level: number;
}

function TreeNode({ node, selectedPaths, onToggle, level }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const state = getSelectionState(node, selectedPaths);
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;

  const handleCheckChange = () => {
    onToggle(node);
  };

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer",
        level > 0 && "ml-4"
      )}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
    >
      {hasChildren ? (
        <CollapsibleTrigger asChild>
          <button 
            className="p-0.5 hover:bg-accent rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-90"
              )} 
            />
          </button>
        </CollapsibleTrigger>
      ) : (
        <span className="w-5" />
      )}
      
      <Checkbox
        checked={state === 'checked'}
        ref={(el) => {
          if (el) {
            (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = state === 'indeterminate';
          }
        }}
        onCheckedChange={handleCheckChange}
        className="data-[state=indeterminate]:bg-primary/50"
      />

      {isFolder ? (
        isOpen ? (
          <FolderOpen className="w-4 h-4 text-primary" />
        ) : (
          <Folder className="w-4 h-4 text-primary" />
        )
      ) : (
        <File className="w-4 h-4 text-muted-foreground" />
      )}

      <span className="text-sm select-none">{node.name}</span>
    </div>
  );

  if (!hasChildren) {
    return content;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {content}
      <CollapsibleContent>
        {node.children?.map(child => (
          <TreeNode
            key={child.id}
            node={child}
            selectedPaths={selectedPaths}
            onToggle={onToggle}
            level={level + 1}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FileTreeSelector({
  items,
  selectedPaths,
  onSelectionChange,
  className
}: FileTreeSelectorProps) {
  const selectedSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

  const handleToggle = useCallback((node: FileTreeNode) => {
    const allPaths = getAllDescendantPaths(node);
    const state = getSelectionState(node, selectedSet);
    
    let newSelected: string[];
    
    if (state === 'checked') {
      // Deselect all
      newSelected = selectedPaths.filter(p => !allPaths.includes(p));
    } else {
      // Select all
      const toAdd = allPaths.filter(p => !selectedSet.has(p));
      newSelected = [...selectedPaths, ...toAdd];
    }
    
    onSelectionChange(newSelected);
  }, [selectedPaths, selectedSet, onSelectionChange]);

  return (
    <div className={cn("border rounded-lg bg-background p-2", className)}>
      {items.map(item => (
        <TreeNode
          key={item.id}
          node={item}
          selectedPaths={selectedSet}
          onToggle={handleToggle}
          level={0}
        />
      ))}
    </div>
  );
}
