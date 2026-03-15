
import React from 'react';

interface StructuredDataViewerProps {
  data: string;
  className?: string;
}

// 颜色配置
const colors = {
  key: 'text-red-600 dark:text-red-400 font-semibold',
  string: 'text-green-600 dark:text-green-400',
  number: 'text-blue-600 dark:text-blue-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-gray-500',
  bracket: 'text-gray-500',
  className: 'text-cyan-600 dark:text-cyan-400 font-semibold',
  normal: 'text-gray-700 dark:text-gray-300',
  text: 'text-sky-500 dark:text-sky-400 font-medium'
};

const SimpleStructuredViewer: React.FC<{ text: string }> = ({ text }) => {
  // 渲染文本，使用亮蓝色
  const renderPlainText = (str: string) => {
    return <span className={colors.text} style={{ whiteSpace: 'pre-wrap' }}>{str}</span>;
  };

  // 改进的 JSON 位置查找
  const findJsonPositions = (str: string) => {
    const positions: { start: number; end: number; type: 'object' | 'array' }[] = [];
    
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{' || str[i] === '[') {
        const stack: string[] = [];
        const startType = str[i] === '{' ? 'object' : 'array';
        stack.push(str[i]);
        let j = i + 1;
        let inString = false;
        let stringChar = '';
        let escaped = false;
        
        while (j < str.length && stack.length > 0) {
          if (escaped) {
            escaped = false;
            j++;
            continue;
          }
          
          if (str[j] === '\\') {
            escaped = true;
            j++;
            continue;
          }
          
          if (inString) {
            if (str[j] === stringChar) {
              inString = false;
            }
            j++;
            continue;
          }
          
          if (str[j] === '"' || str[j] === "'") {
            inString = true;
            stringChar = str[j];
            j++;
            continue;
          }
          
          if (str[j] === '{' || str[j] === '[') {
            stack.push(str[j]);
          } else if (str[j] === '}' && stack[stack.length - 1] === '{') {
            stack.pop();
          } else if (str[j] === ']' && stack[stack.length - 1] === '[') {
            stack.pop();
          }
          j++;
        }
        
        if (stack.length === 0) {
          positions.push({ start: i, end: j, type: startType });
          i = j - 1;
        }
      }
    }
    
    return positions;
  };

  const renderJSON = (obj: any, indent: number): React.ReactNode => {
    const indentStr = '  '.repeat(indent);

    if (obj === null) {
      return <span className={colors.null}>null</span>;
    }

    if (typeof obj === 'boolean') {
      return <span className={colors.boolean}>{obj.toString()}</span>;
    }

    if (typeof obj === 'number') {
      return <span className={colors.number}>{obj}</span>;
    }

    if (typeof obj === 'string') {
      return <span className={colors.string}>"{obj}"</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className={colors.bracket}>[]</span>;
      }
      return (
        <div>
          <span className={colors.bracket}>[</span>
          <div className="ml-4">
            {obj.map((item, index) => (
              <div key={index}>
                <span style={{ whiteSpace: 'pre' }}>{indentStr}  </span>
                {renderJSON(item, indent + 1)}
                {index < obj.length - 1 && <span className={colors.bracket}>,</span>}
              </div>
            ))}
          </div>
          <span style={{ whiteSpace: 'pre' }}>{indentStr}</span>
          <span className={colors.bracket}>]</span>
        </div>
      );
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const isClassWrapper = keys.length === 2 && keys.includes('__class__') && keys.includes('args');
      
      if (isClassWrapper) {
        const className = obj.__class__;
        const args = obj.args;
        const argKeys = Object.keys(args);
        
        return (
          <div>
            <span className={colors.className}>{className}</span>
            <span className={colors.bracket}>(</span>
            {argKeys.length > 0 && (
              <div className="ml-4">
                {argKeys.map((key, index) => (
                  <div key={key} style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ whiteSpace: 'pre' }}>{indentStr}  </span>
                    <span className={colors.key}>{key}</span>
                    <span className={colors.bracket}>=</span>
                    <span> </span>
                    {renderJSON(args[key], indent + 1)}
                    {index < argKeys.length - 1 && <span className={colors.bracket}>,</span>}
                  </div>
                ))}
              </div>
            )}
            {argKeys.length > 0 && <span style={{ whiteSpace: 'pre' }}>{indentStr}</span>}
            <span className={colors.bracket}>)</span>
          </div>
        );
      }

      if (keys.length === 0) {
        return <span className={colors.bracket}>{'{}'}</span>;
      }

      return (
        <div>
          <span className={colors.bracket}>{'{'}</span>
          <div className="ml-4">
            {keys.map((key, index) => (
              <div key={key} style={{ whiteSpace: 'nowrap' }}>
                <span style={{ whiteSpace: 'pre' }}>{indentStr}  </span>
                <span className={colors.key}>"{key}"</span>
                <span className={colors.bracket}>: </span>
                {renderJSON(obj[key], indent + 1)}
                {index < keys.length - 1 && <span className={colors.bracket}>,</span>}
              </div>
            ))}
          </div>
          <span style={{ whiteSpace: 'pre' }}>{indentStr}</span>
          <span className={colors.bracket}>{'}'}</span>
        </div>
      );
    }

    return <span>{String(obj)}</span>;
  };

  const tryParseAndRender = (jsonStr: string): React.ReactNode => {
    // 特殊处理空对象和空数组
    if (jsonStr.trim() === '{}') {
      return <span className={colors.bracket}>{'{}'}</span>;
    }
    if (jsonStr.trim() === '[]') {
      return <span className={colors.bracket}>[]</span>;
    }

    // 先处理 ClassName(...) 格式
    let cleaned = jsonStr.replace(/(\w+)\(([\s\S]*?)\)/g, (match, className, args) => {
      const processedArgs = args.replace(/(\w+)=/g, '"$1": ');
      return `{"__class__": "${className}", "args": {${processedArgs}}}`;
    });

    // 智能处理单引号字符串 - 只替换不在字符串中的单引号
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        result += char;
        escaped = true;
        continue;
      }
      
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        continue;
      }
      
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        result += '"';  // 替换单引号为双引号
        continue;
      }
      
      if (char === "'" && inSingleQuote) {
        // 如果在单引号字符串内部，保留原样
        result += char;
        continue;
      }
      
      result += char;
    }
    
    cleaned = result
      .replace(/\bNone\b/g, 'null')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false');

    try {
      const obj = JSON.parse(cleaned);
      return renderJSON(obj, 0);
    } catch {
      return renderPlainText(jsonStr);
    }
  };

  const positions = findJsonPositions(text);
  
  if (positions.length === 0) {
    return renderPlainText(text);
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const pos of positions) {
    // 添加前面的文本
    if (pos.start > lastIndex) {
      const beforeText = text.substring(lastIndex, pos.start);
      const trimmedBefore = beforeText.trim();
      if (trimmedBefore) {
        elements.push(
          <div key={`text-${lastIndex}`} className="mb-1">
            {renderPlainText(beforeText)}
          </div>
        );
      } else if (beforeText) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {renderPlainText(beforeText)}
          </span>
        );
      }
    }

    const jsonStr = text.substring(pos.start, pos.end);
    elements.push(
      <div key={`json-${pos.start}`} className="mb-1">
        {tryParseAndRender(jsonStr)}
      </div>
    );

    lastIndex = pos.end;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const trimmedRemaining = remainingText.trim();
    if (trimmedRemaining) {
      elements.push(
        <div key={`text-${lastIndex}`}>
          {renderPlainText(remainingText)}
        </div>
      );
    } else if (remainingText) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {renderPlainText(remainingText)}
        </span>
      );
    }
  }

  return <>{elements}</>;
};

const StructuredDataViewer: React.FC<StructuredDataViewerProps> = ({ data, className = '' }) => {
  const hasStructure = /[\{\[\(]/.test(data);

  if (!hasStructure) {
    return <span className={className}>{data}</span>;
  }

  return (
    <div className={className}>
      <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg overflow-x-auto">
        <SimpleStructuredViewer text={data} />
      </div>
    </div>
  );
};

export { StructuredDataViewer };
export default StructuredDataViewer;
