import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, User } from '../lib/supabase';
import { userService } from '../services/userService';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profileError: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const fetchingProfile = useRef(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          console.log('No session found, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Only fetch profile if it's a different user or we don't have a user
          if (currentUserId.current !== session.user.id || !user) {
            currentUserId.current = session.user.id;
            setProfileError(false);
            await fetchUserProfile(session.user.id);
          }
        } else {
          console.log('Session cleared, resetting user state');
          setUser(null);
          setProfileError(false);
          setLoading(false);
          currentUserId.current = null;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    // Prevent multiple simultaneous fetches
    if (fetchingProfile.current) {
      console.log('Profile fetch already in progress, skipping...');
      return;
    }

    // Don't fetch if we already have the user data for this ID
    if (user && currentUserId.current === userId) {
      console.log('User data already available, skipping fetch...');
      return;
    }

    try {
      fetchingProfile.current = true;
      setLoading(true);
      console.log('Fetching user profile for:', userId);
      
      // Reduce timeout to 5 seconds for faster response
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000); // 5 second timeout
      });

      const profilePromise = userService.getOwnProfile(userId);
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching user profile:', error);
        console.log('User ID that failed:', userId);
        setProfileError(true);
        setUser(null);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('User profile fetched successfully:', data.full_name, data.role);
        setUser(data);
        setProfileError(false);
        setLoading(false);
      } else {
        console.log('No user profile found for:', userId);
        setProfileError(true);
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't set profile error on timeout, just set loading to false
      if (error.message === 'Profile fetch timeout') {
        console.log('Profile fetch timed out, but continuing...');
        setLoading(false);
      } else {
        setProfileError(true);
        setUser(null);
        setLoading(false);
      }
    } finally {
      fetchingProfile.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setLoading(false);
        return { error };
      } else {
        console.log('Sign in successful:', data.user?.id);
        // The onAuthStateChange will handle the profile fetching
        return { error: null };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfileError(false);
      currentUserId.current = null;
      fetchingProfile.current = false;
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    profileError,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}