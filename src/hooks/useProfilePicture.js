import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

export const useProfilePicture = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.id || !userRole) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Determine which table to query based on user role
        let tableName = '';
        
        switch (userRole) {
          case 'driver':
            tableName = 'driver_profiles';
            break;
          case 'customer':
            tableName = 'customer_profiles';
            break;
          case 'business':
            tableName = 'business_profiles';
            break;
          default:
            console.log('Unknown user role:', userRole);
            setLoading(false);
            return;
        }

        console.log('Fetching profile picture from:', tableName, 'for user:', user.id);

        // Try to fetch profile data - use * to get all columns
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile picture:', error);
          // Set fallback even on error
          setProfilePicture({
            url: null,
            name: user.email?.split('@')[0]
          });
        } else if (data) {
          console.log('Profile data fetched:', data);
          console.log('Profile picture URL:', data.profile_picture_url);
          console.log('Full name:', data.full_name);
          
          const displayName = data.full_name || 
                             (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.first_name || data.last_name) ||
                             data.company_name || 
                             user.email?.split('@')[0];
          
          const profileData = {
            url: data.profile_picture_url || null,
            name: displayName
          };
          
          console.log('Setting profile picture state:', profileData);
          setProfilePicture(profileData);
        } else {
          console.log('No profile data found');
          setProfilePicture({
            url: null,
            name: user.email?.split('@')[0]
          });
        }
      } catch (error) {
        console.error('Error in fetchProfilePicture:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePicture();
    
    // Set up a listener for profile updates
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: userRole === 'driver' ? 'driver_profiles' : userRole === 'customer' ? 'customer_profiles' : 'business_profiles',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new) {
            setProfilePicture({
              url: payload.new.profile_picture_url,
              name: payload.new.full_name || payload.new.first_name || payload.new.last_name || payload.new.company_name || user.email?.split('@')[0]
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email, userRole]);

  return { profilePicture, loading };
};
