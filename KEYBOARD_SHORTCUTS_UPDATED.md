# Keyboard Shortcuts - Updated (Browser-Compatible)

## ✅ Working Keyboard Shortcuts

Only shortcuts that don't conflict with browser defaults are enabled.

---

## Universal Shortcuts (All Platforms)

### ⌘/Ctrl + K - Command Palette
**Platform:** macOS, Windows, Linux  
**Function:** Opens command palette for quick access

**How to use:**
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- Search and navigate requests, collections, actions
- Use arrow keys to select, Enter to open

---

### ⌘/Ctrl + S - Save Request
**Platform:** macOS, Windows, Linux  
**Function:** Saves the current request to database

**Behavior:**
- **New requests:** Opens collection selector dialog
- **Existing requests:** Updates immediately

**How to use:**
- Make changes to your request
- Press `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux)
- Request is persisted to MongoDB

---

### ⌘/Ctrl + Enter - Send Request
**Platform:** macOS, Windows, Linux  
**Function:** Executes the HTTP request

**How to use:**
- Fill in request URL and details
- Press `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows/Linux)
- Request executes and response appears

**Requirements:**
- Valid URL must be entered
- Request must not be loading

---

### ⌘/Ctrl + D - Delete Request
**Platform:** macOS, Windows, Linux  
**Function:** Deletes saved request from database

**How to use:**
- Open a saved request (not new/unsaved)
- Press `Cmd+D` (Mac) or `Ctrl+D` (Windows/Linux)
- Confirm deletion in dialog

**Note:** Only works for saved requests, not new ones

---

## Windows/Linux Only Shortcuts

### Ctrl + T - New Request Tab
**Platform:** Windows, Linux (NOT macOS)  
**Function:** Creates a new blank request

**Why Mac doesn't work:**
- Cmd+T opens new browser tab (browser default)
- Cannot be overridden by web applications

**How to use on Windows/Linux:**
- Press `Ctrl+T`
- New "Untitled Request" tab opens

**Mac Alternative:**
- Click "New Request" button in sidebar
- Use Command Palette (Cmd+K) → type "new"

---

## Removed/Not Working Shortcuts

### ❌ Cmd+T (macOS) - New Tab
**Issue:** Opens browser tab instead of app tab  
**Solution:** Use "New Request" button or Command Palette

### ❌ Cmd+W / Ctrl+W - Close Tab
**Issue:** Closes browser tab/window  
**Solution:** Click X button on tab or use mouse

### ❌ Cmd+Shift+S / Ctrl+Shift+S - Save As
**Issue:** Conflicts with browser "Save Page As"  
**Solution:** Click "Save As" button (copy icon)

---

## Keyboard Shortcuts Quick Reference

| Shortcut | Mac | Windows/Linux | Function |
|----------|-----|---------------|----------|
| **Command Palette** | ⌘ + K | Ctrl + K | ✅ Open command palette |
| **Save Request** | ⌘ + S | Ctrl + S | ✅ Save current request |
| **Send Request** | ⌘ + Enter | Ctrl + Enter | ✅ Execute HTTP request |
| **Delete Request** | ⌘ + D | Ctrl + D | ✅ Delete saved request |
| **New Request** | ❌ Not available | Ctrl + T | ⚠️ Windows/Linux only |
| **Close Tab** | ❌ Use mouse | ❌ Use mouse | ❌ Conflicts with browser |
| **Save As** | ❌ Use button | ❌ Use button | ❌ Conflicts with browser |

---

## Why Some Shortcuts Don't Work

### Browser Default Shortcuts Take Priority

Web applications **cannot override** these browser shortcuts:
- `Cmd+T` / `Ctrl+T` (partially) - New browser tab
- `Cmd+W` / `Ctrl+W` - Close browser tab
- `Cmd+N` - New browser window
- `Cmd+Shift+T` - Reopen closed tab
- `Cmd+Shift+S` - Save page

### Platform Differences

**macOS:**
- Uses `Cmd` (⌘) key as primary modifier
- Many shortcuts conflict with browser/OS
- More restrictive than Windows/Linux

**Windows/Linux:**
- Uses `Ctrl` key as primary modifier
- Fewer conflicts with browser
- `Ctrl+T` can work in some contexts

---

## Workarounds for Mac Users

### Instead of Cmd+T (New Request):
1. **Click Button:** "New Request" button in sidebar
2. **Command Palette:** Press `Cmd+K`, type "new"
3. **Menu:** Click organization dropdown area (future feature)

### Instead of Cmd+W (Close Tab):
1. **Click X:** Click X button on tab
2. **Right-click:** Right-click tab → Close (future feature)

### Instead of Cmd+Shift+S (Save As):
1. **Click Button:** Click copy icon button in toolbar
2. **Duplicate:** Right-click request → Duplicate (future feature)

---

## Visual Indicators

### Button Tooltips Show Active Shortcuts

Hover over buttons to see available shortcuts:
- **Send:** "Send Request (⌘+Enter or Ctrl+Enter)"
- **Save:** "Save (⌘+S or Ctrl+S)"
- **Save As:** "Save As" (no shortcut)
- **Delete:** "Delete (⌘+D or Ctrl+D)"

### Empty State Help Panel

When no request is open:
- Shows all working shortcuts
- Clear descriptions
- Platform-specific notes
- Tip about Ctrl+T for Windows/Linux

---

## Best Practices

### For Mac Users
- Memorize `Cmd+K` for Command Palette (most versatile)
- Use `Cmd+S` frequently to save work
- Use `Cmd+Enter` for quick testing
- Rely on buttons for actions without shortcuts

### For Windows/Linux Users
- All shortcuts work except close tab
- `Ctrl+T` is your friend for new requests
- `Ctrl+S` saves without dialog for existing requests
- `Ctrl+Enter` for rapid API testing

### For All Users
- Learn `Cmd/Ctrl+K` - it's the most powerful shortcut
- Save frequently with `Cmd/Ctrl+S`
- Test quickly with `Cmd/Ctrl+Enter`
- Use mouse for less common actions

---

## Technical Notes

### Why We Can't Override Browser Shortcuts

```javascript
// This DOES work (browser doesn't use it)
if ((e.metaKey || e.ctrlKey) && e.key === 's') {
  e.preventDefault(); // Prevents browser save dialog
  handleSave();
}

// This DOESN'T work on Mac (browser takes priority)
if (e.metaKey && e.key === 't') {
  e.preventDefault(); // Browser ignores this
  createNewRequest(); // Never executes on Mac
}

// This DOES work on Windows/Linux
if (e.ctrlKey && !e.metaKey && e.key === 't') {
  e.preventDefault(); // Works because Ctrl+T is less protected
  createNewRequest(); // Executes successfully
}
```

### Platform Detection

```javascript
// Windows/Linux only (Ctrl without Cmd)
if (e.ctrlKey && !e.metaKey && e.key === 't') {
  // This only runs on Windows/Linux
}

// Mac and Windows/Linux (either modifier)
if ((e.metaKey || e.ctrlKey) && e.key === 's') {
  // This runs on all platforms
}
```

---

## Summary

✅ **4 universal shortcuts** that work everywhere:
- `Cmd/Ctrl + K` - Command Palette
- `Cmd/Ctrl + S` - Save Request
- `Cmd/Ctrl + Enter` - Send Request
- `Cmd/Ctrl + D` - Delete Request

⚠️ **1 partial shortcut:**
- `Ctrl + T` - New Request (Windows/Linux only)

❌ **3 shortcuts removed** due to browser conflicts:
- `Cmd + T` - New Request (Mac)
- `Cmd/Ctrl + W` - Close Tab
- `Cmd/Ctrl + Shift + S` - Save As

**Focus on the working shortcuts for maximum productivity!**
