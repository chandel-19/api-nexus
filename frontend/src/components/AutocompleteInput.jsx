import React, { useRef, useState, useEffect } from 'react';
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
    suggestionsRef
  } = useEnvAutocomplete(value, onChange, currentEnv, inputRef);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Don't close if clicking on suggestions
        if (suggestionsRef.current && suggestionsRef.current.contains(event.target)) {
          return;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestionsRef]);

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
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto min-w-[200px] mt-1"
          style={{
            top: '100%',
            left: 0,
            width: suggestionPosition.width > 200 ? `${suggestionPosition.width}px` : '100%'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              onClick={() => insertVariable(suggestion)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              <span className="font-mono">{`{{${suggestion}}}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
