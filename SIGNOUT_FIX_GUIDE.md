# SignOut Fix Guide - mobiTrak

## 🔧 **SignOut Issues & Solutions**

### **Common SignOut Problems:**
1. **SignOut appears to work but user state doesn't clear**
2. **Navigation doesn't happen after signout**
3. **Toast notifications don't show**
4. **User can still access protected routes**

### **Root Causes:**
1. **Auth state change listener not handling SIGNED_OUT event**
2. **Local state not being cleared properly**
3. **Navigation happening before state updates**
4. **Supabase session persistence issues**

## 🛠 **Fixes Applied**

### **1. Enhanced AuthContext SignOut Function**
```javascript
const signOut = async () => {
  try {
    console.log('Starting sign out process...')
    console.log('Current user before signout:', user?.email)
    
    // Sign out from Supabase first
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase signOut error:', error)
      return { error }
    }
    
    console.log('Supabase signOut successful')
    
    // Clear local state (this should also happen via the auth state change listener)
    setUser(null)
    setUserRole(null)
    
    console.log('Local state cleared')
    return { error: null }
  } catch (error) {
    console.error('Sign out catch error:', error)
    return { error }
  }
}
```

### **2. Improved Auth State Change Listener**
```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('Auth state change:', event, session?.user?.email || 'no user')
    
    if (event === 'SIGNED_OUT') {
      console.log('User signed out, clearing state')
      setUser(null)
      setUserRole(null)
      setLoading(false)
      return
    }
    
    // ... rest of the logic
  }
)
```

### **3. Better SignOut Handlers with Delays**
```javascript
const handleSignOutConfirm = async () => {
  setSigningOut(true)
  console.log('Dashboard signout initiated...')
  
  try {
    const { error } = await signOut()
    
    if (error) {
      console.error('SignOut error:', error)
      showToast('Error signing out. Please try again.', 'error')
    } else {
      console.log('SignOut successful, navigating to home...')
      showToast('Successfully signed out', 'success')
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        navigate('/')
      }, 500)
    }
  } catch (error) {
    console.error('SignOut catch error:', error)
    showToast('Error signing out. Please try again.', 'error')
  } finally {
    setSigningOut(false)
    setShowSignOutModal(false)
  }
}
```

## 🧪 **Testing SignOut**

### **Method 1: Use the Test Component**
1. Log in to the application
2. Look for the "SignOut Test" component in the top-right corner
3. Try both "Test Context SignOut" and "Test Supabase Direct" buttons
4. Check browser console for debug messages

### **Method 2: Use Dashboard SignOut**
1. Log in and go to any dashboard
2. Click "Sign Out" in the sidebar
3. Confirm in the modal
4. Check if:
   - Toast notification appears
   - User is redirected to home page
   - Navigation shows login button instead of user info

### **Method 3: Use Landing Page SignOut**
1. Log in and go to landing page
2. Click "Sign Out" in navigation
3. Confirm in the modal
4. Check if user state is cleared

## 🔍 **Debugging Steps**

### **1. Check Browser Console**
Look for these debug messages:
- "Starting sign out process..."
- "Auth state change: SIGNED_OUT"
- "User signed out, clearing state"
- "SignOut successful, navigating to home..."

### **2. Check Network Tab**
- Look for POST request to Supabase auth/logout endpoint
- Should return 204 No Content on success

### **3. Check Application State**
- User should be null after signout
- UserRole should be null after signout
- Navigation should show login button

## 🚀 **Quick Fix Commands**

If signout is still not working, try these:

### **Force Clear Browser Storage**
```javascript
// Run in browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### **Test Supabase Connection**
```javascript
// Run in browser console
import { supabase } from './src/utils/supabase.js'
console.log('Supabase URL:', supabase.supabaseUrl)
console.log('Current session:', await supabase.auth.getSession())
```

## 📋 **Checklist for Working SignOut**

- [ ] Console shows "Starting sign out process..."
- [ ] Console shows "Auth state change: SIGNED_OUT"
- [ ] Toast notification appears
- [ ] User is redirected to home page
- [ ] Navigation shows login button
- [ ] Protected routes redirect to login
- [ ] No console errors

## 🔧 **Alternative SignOut Method**

If the context-based signout doesn't work, use direct Supabase signout:

```javascript
const forceSignOut = async () => {
  try {
    await supabase.auth.signOut()
    // Force page reload to clear all state
    window.location.href = '/'
  } catch (error) {
    console.error('Force signout error:', error)
  }
}
```

## 📞 **Still Having Issues?**

1. **Check Supabase Dashboard** - Look at auth logs
2. **Verify Environment Variables** - Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
3. **Clear Browser Cache** - Hard refresh (Ctrl+Shift+R)
4. **Check Network Connectivity** - Ensure you can reach Supabase servers
5. **Update Dependencies** - Make sure @supabase/supabase-js is up to date

The signout functionality should now work properly with better error handling and debugging information!
