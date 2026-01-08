# Keyboard Shortcuts - API Nexus

## ✅ All Keyboard Shortcuts Implemented

Cross-platform keyboard shortcuts work on **macOS** (⌘), **Windows** (Ctrl), and **Linux** (Ctrl).

---

## Global Shortcuts (Work Anywhere)

### ⌘/Ctrl + K - Command Palette
**Works:** Everywhere in the app  
**Function:** Opens the command palette for quick access to:
- Recent requests
- All requests in current organization
- Collections
- Quick actions

**How to use:**
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Search bar appears
3. Type to filter requests/collections
4. Use arrow keys to navigate
5. Press Enter to select

---

### ⌘/Ctrl + T - New Request Tab
**Works:** Everywhere in the app  
**Function:** Creates a new blank request in a new tab

**How to use:**
1. Press `Cmd+T` (Mac) or `Ctrl+T` (Windows/Linux)
2. New "Untitled Request" tab opens
3. Start building your request immediately

---

## Request Tab Shortcuts (Work in Active Tab Only)

These shortcuts only work when you're on a request tab:

### ⌘/Ctrl + S - Save Request
**Works:** When a request tab is active  
**Function:** 
- **New requests:** Opens collection selector dialog
- **Existing requests:** Updates the request in database immediately

**How to use:**
1. Make changes to your request (URL, headers, body, etc.)
2. Press `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux)
3. If new request: Select collection and save
4. If existing: Changes saved automatically

**Visual Feedback:**
- Success toast: "Request saved"
- Save button tooltip shows shortcut

---

### ⌘/Ctrl + Shift + S - Save As
**Works:** When a request tab is active  
**Function:** Creates a copy of the current request with a new name

**How to use:**
1. Open any existing request
2. Press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)
3. Dialog opens with pre-filled name (adds " (Copy)")
4. Edit name if desired
5. Select target collection
6. Click "Save As New"

**Use Cases:**
- Create variations of a request
- Copy request to different collection
- Test different configurations without losing original

**Visual Feedback:**
- Success toast: "{Name} has been created successfully"
- Copy button tooltip shows shortcut

---

### ⌘/Ctrl + Enter - Send Request
**Works:** When a request tab is active  
**Function:** Executes the HTTP request

**Requirements:**
- Must have a valid URL entered
- Request must not be loading already

**How to use:**
1. Fill in request URL and details
2. Press `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows/Linux)
3. Request executes via backend proxy
4. Response appears in right panel

**Visual Feedback:**
- Loading spinner while request is in progress
- Success toast: "{METHOD} request completed in {time}ms"
- Send button tooltip shows shortcut

---

### ⌘/Ctrl + W - Close Tab
**Works:** When a request tab is active  
**Function:** Closes the current request tab

**How to use:**
1. Focus on any request tab
2. Press `Cmd+W` (Mac) or `Ctrl+W` (Windows/Linux)
3. Tab closes immediately
4. Previous tab becomes active (or next if first tab)

**Behavior:**
- Works for both saved and unsaved requests
- Does not prompt for confirmation
- Does not delete the request from database (only closes the tab)

---

### ⌘/Ctrl + D - Delete Request
**Works:** When a **saved** request tab is active  
**Function:** Permanently deletes the request from database

**Requirements:**
- Only works for saved requests (not new/unsaved ones)

**How to use:**
1. Open a saved request
2. Press `Cmd+D` (Mac) or `Ctrl+D` (Windows/Linux)
3. Confirmation dialog appears
4. Click "Delete Request" to confirm

**Visual Feedback:**
- Alert dialog: "Are you sure you want to delete...?"
- Success toast: "{Name} has been deleted successfully"
- Tab closes automatically after deletion
- Delete button tooltip shows shortcut

---

## Keyboard Shortcuts Cheat Sheet

| Shortcut | Mac | Windows/Linux | Function |
|----------|-----|---------------|----------|
| **Command Palette** | ⌘ + K | Ctrl + K | Open command palette |
| **New Request** | ⌘ + T | Ctrl + T | Create new request tab |
| **Save** | ⌘ + S | Ctrl + S | Save current request |
| **Save As** | ⌘ + ⇧ + S | Ctrl + Shift + S | Save as new request |
| **Send Request** | ⌘ + Enter | Ctrl + Enter | Execute HTTP request |
| **Close Tab** | ⌘ + W | Ctrl + W | Close active tab |
| **Delete Request** | ⌘ + D | Ctrl + D | Delete saved request |

---

## Visual Indicators

### Button Tooltips
All action buttons show their keyboard shortcuts on hover:

- **Send button:** "Send Request (⌘+Enter or Ctrl+Enter)"
- **Save button:** "Save (⌘+S or Ctrl+S)"
- **Save As button:** "Save As (⌘+Shift+S or Ctrl+Shift+S)"
- **Delete button:** "Delete (⌘+D or Ctrl+D)"

### Empty State Help Panel
When no request is open, the center shows:
- 🚀 Icon and welcome message
- Grid of all available shortcuts
- Both Mac and Windows/Linux notations
- Clear descriptions for each shortcut

---

## Technical Implementation

### Cross-Platform Detection
```javascript
// Works on all platforms
const handleKeyDown = (e) => {
  // Mac uses metaKey (⌘), Windows/Linux use ctrlKey
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    handleSave();
  }
};
```

### Active Tab Detection
```javascript
// Only handle shortcuts for active tab
if (activeTab !== request.request_id) return;
```

### Event Prevention
```javascript
// Prevent browser defaults (like Cmd+S opening save dialog)
e.preventDefault();
```

---

## Shortcut Behavior Details

### Save (⌘/Ctrl + S)

**For New Requests:**
```
Press ⌘+S
  ↓
Dialog opens: "Save Request"
  ↓
Select collection from dropdown
  ↓
Click "Save Request"
  ↓
Request saved to MongoDB
  ↓
Tab updates with new request_id
  ↓
Request appears in collection sidebar
```

**For Existing Requests:**
```
Press ⌘+S
  ↓
Request updated in MongoDB immediately
  ↓
Success toast shown
  ↓
No dialog needed
```

---

### Save As (⌘/Ctrl + Shift + S)

```
Press ⌘+Shift+S
  ↓
Dialog opens: "Save As New Request"
  ↓
Name field pre-filled with "{original name} (Copy)"
  ↓
Collection dropdown shows current collection
  ↓
Edit name (optional)
  ↓
Select collection (optional)
  ↓
Click "Save As New"
  ↓
New request created in MongoDB
  ↓
Original request unchanged
  ↓
Success toast shown
```

---

### Send Request (⌘/Ctrl + Enter)

```
Press ⌘+Enter
  ↓
Check if URL is valid
  ↓
Check if not already loading
  ↓
Send button triggers
  ↓
Loading state shown
  ↓
Request sent via backend proxy
  ↓
Response received
  ↓
Response displayed in right panel
  ↓
Success toast with timing info
```

---

### Close Tab (⌘/Ctrl + W)

```
Press ⌘+W
  ↓
Current tab closes
  ↓
If multiple tabs: Previous tab becomes active
  ↓
If last tab: Empty state shown
  ↓
Request NOT deleted from database
  ↓
Can reopen from collections sidebar
```

---

### Delete Request (⌘/Ctrl + D)

```
Press ⌘+D
  ↓
Check if request is saved (not req_new_*)
  ↓
Confirmation dialog opens
  ↓
User clicks "Delete Request"
  ↓
DELETE API call to backend
  ↓
Request removed from MongoDB
  ↓
Tab closes automatically
  ↓
Collections refreshed
  ↓
Success toast shown
```

---

## Accessibility Features

### Visual Feedback
- ✅ Tooltips on all buttons with shortcuts
- ✅ Toast notifications for actions
- ✅ Loading states during operations
- ✅ Keyboard shortcuts panel in empty state

### Keyboard Navigation
- ✅ All features accessible via keyboard
- ✅ No mouse required for common operations
- ✅ Tab navigation through form fields
- ✅ Enter to confirm, Escape to cancel

### Cross-Platform
- ✅ Works on macOS (Command/⌘)
- ✅ Works on Windows (Ctrl)
- ✅ Works on Linux (Ctrl)
- ✅ Detects platform automatically
- ✅ Shows correct modifier key in UI

---

## Common Workflows with Shortcuts

### Workflow 1: Quick API Testing
```
1. ⌘+T           → New request
2. Type URL      → Enter endpoint
3. ⌘+Enter       → Send request
4. View response → Check results
5. ⌘+S           → Save if needed
6. ⌘+W           → Close tab
```

### Workflow 2: Create Request Variations
```
1. ⌘+K           → Open command palette
2. Search request → Find base request
3. Enter         → Open request
4. Modify details → Change parameters
5. ⌘+Shift+S    → Save as new
6. Name it       → Give unique name
7. Save          → Create variation
```

### Workflow 3: Organize Requests
```
1. ⌘+T           → New request
2. Build request → Add details
3. ⌘+S           → Save
4. Select collection → Choose organization
5. Save          → Request filed away
6. ⌘+W           → Close tab
```

---

## Troubleshooting

### Shortcut Not Working?

**Check 1: Is the request tab active?**
- Tab-specific shortcuts only work on the active tab
- Click the tab to make it active
- Look for highlighted tab indicator

**Check 2: Is the page focused?**
- Click anywhere in the app window
- Make sure no dialogs are open
- Ensure browser has focus (not DevTools)

**Check 3: Browser conflicts?**
- Some browsers override certain shortcuts
- Try in incognito/private mode
- Check browser extension conflicts

**Check 4: Operating System**
- Mac: Use ⌘ (Command key)
- Windows/Linux: Use Ctrl key
- Don't mix them up!

---

## Future Enhancements

Potential additional shortcuts:
- `⌘/Ctrl + /` - Toggle shortcuts help
- `⌘/Ctrl + B` - Toggle sidebar
- `⌘/Ctrl + E` - Focus environment selector
- `⌘/Ctrl + 1-9` - Switch to tab N
- `⌘/Ctrl + [` - Previous tab
- `⌘/Ctrl + ]` - Next tab
- `⌘/Ctrl + F` - Find in page
- `⌘/Ctrl + H` - Show request history

---

## Summary

✅ **7 keyboard shortcuts** implemented  
✅ **Cross-platform** support (Mac/Windows/Linux)  
✅ **Visual indicators** via tooltips  
✅ **Help panel** in empty state  
✅ **Smart detection** of active tab  
✅ **Prevents browser defaults**  
✅ **Toast notifications** for feedback  

All shortcuts are production-ready and fully functional!
