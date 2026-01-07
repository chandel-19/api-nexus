# How to Test the Login Flow

## Current Setup
The application is configured with Emergent Google OAuth authentication.

## Testing Steps

### 1. Access the Login Page
Navigate to: `http://localhost:3000/login` (or your deployed URL)

You should see:
- API Nexus logo (blue lightning bolt icon)
- "Welcome back" message
- "Continue with Google" button

### 2. Click "Continue with Google"
When you click the button:
- You'll be redirected to `https://auth.emergentagent.com`
- You'll see the Google OAuth consent screen
- Sign in with your Google account

### 3. After OAuth Completion
After successful Google authentication:
- You'll be redirected back to your app with a URL like: `http://your-app.com/dashboard#session_id=xxx`
- The app automatically processes this session_id
- You should see a "Completing sign in..." loading screen briefly
- Then you'll land on the dashboard

### 4. Dashboard Features
Once logged in, you'll see:
- Left sidebar with:
  - Organization switcher ("My Workspace" by default)
  - "New Request" button
  - Collections list
  - History tab
  - Settings and Environments at the bottom
- Main area with:
  - Empty state showing "No Request Open"
  - Options to create new request or browse collections
- Command palette access via ⌘K or Ctrl+K

## What Happens Behind the Scenes

1. **Login Button Click**
   - Redirects to Emergent OAuth: `https://auth.emergentagent.com/?redirect={your_dashboard_url}`
   - IMPORTANT: The redirect URL is dynamically generated using `window.location.origin`

2. **OAuth Flow**
   - User completes Google authentication
   - Emergent OAuth redirects back with session_id in URL hash

3. **Auth Callback Processing**
   - Frontend detects `#session_id=` in URL
   - Calls `/api/auth/session` with the session_id
   - Backend validates with Emergent auth service
   - Creates user in database (or updates existing)
   - Creates session token (7 days validity)
   - Sets httpOnly cookie
   - Returns user data

4. **Dashboard Load**
   - Frontend receives user data
   - Loads user's organizations
   - Loads collections, requests, environments
   - User can start testing APIs!

## Troubleshooting

### "Authentication failed" Error
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Verify MongoDB is running: `sudo supervisorctl status`
- Check if session_id is in URL after OAuth redirect

### Redirected Back to Login
- Check browser console for errors (F12 → Console tab)
- Verify cookies are enabled
- Check if `/api/auth/me` returns 401 or 200
- Clear browser cache and cookies, try again

### Backend 500 Error
- Check backend logs for detailed error
- Verify environment variables are set correctly
- Ensure MongoDB connection is working

## Testing Without Real OAuth (For Development)

If you need to test without going through Google OAuth:

### Create Test User & Session in MongoDB
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();

db.users.insertOne({
  user_id: userId,
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});

db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});

print('✓ Test user created');
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

### Test API with Session Token
```bash
# Test auth endpoint
curl -X GET http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -v

# Or set cookie in browser DevTools:
# Open DevTools → Application tab → Cookies
# Add cookie: name="session_token", value="YOUR_SESSION_TOKEN"
```

## Expected User Experience

✅ **Successful Login:**
1. Click "Continue with Google" → Google login page
2. Choose/confirm Google account → Brief loading screen
3. Redirected to dashboard → See "My Workspace" and empty state
4. Click "New Request" → Request builder opens
5. Enter URL, click "Send" → See response

✅ **Features Available After Login:**
- Create and organize API requests
- Save requests to collections
- Execute HTTP requests (GET, POST, PUT, DELETE, etc.)
- Manage headers, params, body, authentication
- Switch between personal and team workspaces
- View request history
- Manage environment variables

## Current Status
✅ Backend API: Working (22/22 tests passed)
✅ Frontend UI: Working (Raycast-inspired design)
✅ Authentication: OAuth integration complete
✅ Database: MongoDB connected
✅ Request Execution: HTTP proxy working

The app is fully functional and ready to use once you complete the Google OAuth flow!
