import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useEnvAutocomplete } from '../hooks/useEnvAutocomplete';

const AutocompleteInput = ({ 
  value, 
  onChange, 
  currentEnv, 
  placeholder,
  className,
  type = 'input', // 'input' or 'textarea'
  ...props 
}) => {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const {
    showSuggestions,
    suggestions,
    selectedIndex,
    insertVariable,
    handleKeyDown,
    suggestionsRef,
    closeSuggestions
  } = useEnvAutocomplete(value, onChange, currentEnv, inputRef);

  const valueMap = useMemo(() => {
    const map = {};
    if (currentEnv?.variables) {
      currentEnv.variables.forEach((v) => {
        if (v.key) {
          map[v.key] = v.value ?? '';
        }
      });
    }
    return map;
  }, [currentEnv]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Don't close if clicking on suggestions
        if (suggestionsRef.current && suggestionsRef.current.contains(event.target)) {
          return;
        }
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestionsRef, closeSuggestions]);

  // Calculate position for suggestions dropdown
  const [suggestionPosition, setSuggestionPosition] = useState({ width: 0 });

  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setSuggestionPosition({
        width: rect.width
      });
    }
  }, [showSuggestions, value]);

  const handleKeyDownWithAutocomplete = (e) => {
    handleKeyDown(e);
    // Call original onKeyDown if provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';
  const effectiveClassName = className;
  const [activeVar, setActiveVar] = useState(null);
  const [showVarTooltip, setShowVarTooltip] = useState(false);

  const getVarAtIndex = (text, cursorPos) => {
    if (!text || typeof text !== 'string') return null;
    const regex = /\{\{([a-zA-Z0-9_.-]+)\}\}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (cursorPos >= start && cursorPos <= end) {
        return match[1];
      }
    }
    return null;
  };

  const getCaretIndexFromMouse = (event) => {
    if (!inputRef?.current) return 0;
    const input = inputRef.current;
    const rect = input.getBoundingClientRect();
    const style = window.getComputedStyle(input);
    const paddingLeft = parseFloat(style.paddingLeft || '0');
    const borderLeft = parseFloat(style.borderLeftWidth || '0');
    const x = event.clientX - rect.left - paddingLeft - borderLeft;
    const text = value || '';
    if (!text) return 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const width = ctx.measureText(text.slice(0, mid)).width;
      if (width < x) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return Math.max(0, Math.min(text.length, low));
  };

  const updateActiveVarFromMouse = (event) => {
    if (type !== 'input') return;
    const text = value || '';
    const index = getCaretIndexFromMouse(event);
    const varName = getVarAtIndex(text, index);
    setActiveVar(varName);
  };


  return (
    <div ref={containerRef} className="relative w-full">
      <InputComponent
        {...props}
        ref={inputRef}
        type={type === 'input' ? 'text' : undefined}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDownWithAutocomplete}
        placeholder={placeholder}
        className={effectiveClassName}
        onMouseMove={updateActiveVarFromMouse}
        onMouseEnter={() => setShowVarTooltip(true)}
        onMouseLeave={() => setShowVarTooltip(false)}
      />
      {showVarTooltip && activeVar && valueMap[activeVar] !== undefined && (
        <div className="absolute left-2 top-full mt-1 z-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 shadow-md">
          <span className="font-mono">{valueMap[activeVar] || '(empty)'}</span>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-zinc-200 rounded-lg shadow-xl max-h-60 overflow-y-auto min-w-[200px] mt-1"
          style={{
            top: '100%',
            left: 0,
            width: suggestionPosition.width > 200 ? `${suggestionPosition.width}px` : '100%'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              onMouseDown={(e) => {
                // Prevent input blur before selecting suggestion
                e.preventDefault();
                insertVariable(suggestion);
              }}
              onClick={() => insertVariable(suggestion)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-zinc-900">{`{{${suggestion}}}`}</span>
                {valueMap[suggestion] !== undefined && (
                  <span className="text-xs text-zinc-500 truncate max-w-[220px]">
                    {valueMap[suggestion] === '' ? '(empty)' : valueMap[suggestion]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
