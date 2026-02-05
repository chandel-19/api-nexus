import { useState, useEffect, useRef } from 'react';

export const useEnvAutocomplete = (value, onChange, currentEnv, inputRef) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchText, setSearchText] = useState('');
  const suggestionsRef = useRef(null);
  const lastSearchRef = useRef('');
  const lastSuggestionsRef = useRef([]);

  // Get available variables from current environment
  const getVariables = () => {
    if (!currentEnv || !currentEnv.variables) return [];
    return currentEnv.variables
      .filter(v => v.enabled !== false && v.key)
      .map(v => v.key);
  };

  // Find the position of {{ pattern before cursor
  const findVariableStart = (text, cursorPos) => {
    // Look backwards from cursor for {{
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '{' && i > 0 && text[i - 1] === '{') {
        return i - 1; // Start of {{
      }
      if (text[i] === '}') {
        // Found closing }, stop searching
        return -1;
      }
    }
    return -1;
  };

  // Extract search text between {{ and cursor
  const extractSearchText = (text, startPos, cursorPos) => {
    if (startPos === -1) return '';
    const searchStart = startPos + 2; // After {{
    return text.substring(searchStart, cursorPos).trim();
  };

  // Update suggestions based on current input
  useEffect(() => {
    if (!inputRef?.current) return;

    const updateSuggestions = () => {
      const text = value || '';
      const cursorPos = inputRef.current.selectionStart || text.length;
      const varStart = findVariableStart(text, cursorPos);

      if (varStart !== -1) {
        const search = extractSearchText(text, varStart, cursorPos);
        setSearchText(search);
        setCursorPosition(varStart);

        const variables = getVariables();
        const filtered = variables.filter(v => 
          v.toLowerCase().includes(search.toLowerCase())
        );

        if (filtered.length > 0) {
          setSuggestions(filtered);
          setShowSuggestions(true);
          const prevSearch = lastSearchRef.current;
          const prevSuggestionsKey = (lastSuggestionsRef.current || []).join('|');
          const nextSuggestionsKey = filtered.join('|');
          if (search !== prevSearch || nextSuggestionsKey !== prevSuggestionsKey) {
            setSelectedIndex(0);
          }
          lastSearchRef.current = search;
          lastSuggestionsRef.current = filtered;
        } else {
          setShowSuggestions(false);
          lastSearchRef.current = '';
          lastSuggestionsRef.current = [];
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        lastSearchRef.current = '';
        lastSuggestionsRef.current = [];
      }
    };

    updateSuggestions();

    // Also update on selection change (cursor movement)
    const input = inputRef.current;
    input.addEventListener('keyup', updateSuggestions);
    input.addEventListener('click', updateSuggestions);

    return () => {
      input.removeEventListener('keyup', updateSuggestions);
      input.removeEventListener('click', updateSuggestions);
    };
  }, [value, currentEnv, inputRef]);

  // Insert variable at cursor position
  const insertVariable = (variableName) => {
    if (!inputRef?.current) return;

    const text = value || '';
    const cursorPos = inputRef.current.selectionStart || text.length;
    const varStart = findVariableStart(text, cursorPos);

    if (varStart !== -1) {
      const before = text.substring(0, varStart);
      const after = text.substring(cursorPos);
      const newValue = before + `{{${variableName}}}` + after;
      
      onChange({ target: { value: newValue } });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = varStart + variableName.length + 4; // {{ + name + }}
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }

    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertVariable(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return {
    showSuggestions,
    suggestions,
    selectedIndex,
    searchText,
    insertVariable,
    handleKeyDown,
    suggestionsRef,
    closeSuggestions: () => setShowSuggestions(false)
  };
};
