import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting initial session:', error)
          setUser(null)
          setUserRole(null)
        } else {
          console.log('Initial session:', session?.user?.email || 'no user')
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchUserRole(session.user.id)
          } else {
            setUserRole(null)
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'no user')

        // Skip processing during initial load to prevent duplicate role fetching
        if (initializing) {
          console.log('Skipping auth change during initialization')
          return
        }

        // Skip INITIAL_SESSION event as it's handled by getInitialSession
        if (event === 'INITIAL_SESSION') {
          console.log('Skipping INITIAL_SESSION event')
          return
        }

        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state')
          setUser(null)
          setUserRole(null)
          setLoading(false)

          // Force clear any remaining session data
          try {
            localStorage.removeItem('supabase.auth.token')
            sessionStorage.removeItem('supabase.auth.token')
          } catch (error) {
            console.warn('Error clearing storage:', error)
          }
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in or token refreshed')
          setUser(session?.user ?? null)

          if (session?.user) {
            // Handle email confirmation and role update
            if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
              await handleEmailConfirmation(session.user)
            }
            await fetchUserRole(session.user.id)
          } else {
            setUserRole(null)
          }
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleEmailConfirmation = async (user) => {
    try {
      // Check if user has role in metadata (from registration)
      const roleFromMetadata = user.user_metadata?.role

      if (roleFromMetadata) {
        // Update the user profile with the correct role
        const { error } = await supabase
          .from('user_profiles')
          .update({ role: roleFromMetadata })
          .eq('id', user.id)

        if (error) {
          console.error('Error updating user role:', error)
        }
      }
    } catch (error) {
      console.error('Error handling email confirmation:', error)
    }
  }

  const fetchUserRole = async (userId) => {
    try {
      console.log('Fetching user role for:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        return
      }

      console.log('User role fetched:', data?.role)
      setUserRole(data?.role)
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const signUp = async (email, password, role) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role // Store role in user metadata
          }
        }
      })

      if (error) throw error

      // The user profile will be created by the database trigger
      // but we need to update it with the correct role
      if (data.user && !data.user.email_confirmed_at) {
        // For unconfirmed users, we'll update the role after email confirmation
        // Store the role in user metadata for now
        console.log('User registered, email verification required')
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { data, error }

      // Check if email is verified (except for OAuth users)
      if (data.user && !data.user.email_confirmed_at) {
        // Sign out the user immediately
        await supabase.auth.signOut()
        return {
          data: null,
          error: {
            message: 'Please verify your email before signing in. Check your inbox for a verification link.',
            code: 'email_not_verified'
          }
        }
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      console.log('Current user before signout:', user?.email)

      // Set loading state to prevent UI flashes
      setLoading(true)

      // Clear local state immediately to prevent UI flashes
      setUser(null)
      setUserRole(null)

      // Force clear all storage
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')

        // Clear all localStorage keys that might contain auth data
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.includes('supabase')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.warn('Error clearing storage:', error)
      }

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SignOut timeout after 5 seconds')), 5000)
      })

      // Race between signOut and timeout
      const signOutPromise = supabase.auth.signOut()

      console.log('Calling supabase.auth.signOut()...')
      const { error } = await Promise.race([signOutPromise, timeoutPromise])

      if (error) {
        console.error('Supabase signOut error:', error)
      } else {
        console.log('Supabase signOut successful')
      }

      // Ensure state is cleared regardless of Supabase response
      setUser(null)
      setUserRole(null)
      setLoading(false)

      console.log('Sign out process completed')
      return { error: null }
    } catch (error) {
      console.error('Sign out catch error:', error)

      // Force clear everything on error
      setUser(null)
      setUserRole(null)
      setLoading(false)

      // Force clear storage again
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (storageError) {
        console.warn('Error force clearing storage:', storageError)
      }

      console.log('Force sign out completed')
      return { error: null }
    }
  }

  const resendVerification = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const forceSignOut = async () => {
    try {
      console.log('Force signout initiated...')

      // Clear local state immediately
      setUser(null)
      setUserRole(null)

      // Try to clear Supabase session in background (don't wait)
      supabase.auth.signOut().catch(error => {
        console.warn('Background signout failed:', error)
      })

      // Clear any stored tokens manually
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
      }

      console.log('Force signout completed')
      return { error: null }
    } catch (error) {
      console.error('Force signout error:', error)
      return { error: null } // Return success anyway
    }
  }

  const value = {
    user,
    userRole,
    loading,
    initializing,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    forceSignOut,
    resendVerification,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
