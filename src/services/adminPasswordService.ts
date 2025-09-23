import { createClient } from '@supabase/supabase-js';

// Create a service role client for admin operations
const createAdminClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing service role key for admin operations');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const adminPasswordService = {
  async resetUserPassword(userId: string, newPassword: string, currentUserId: string) {
    const adminClient = createAdminClient();
    
    if (!adminClient) {
      throw new Error('Admin service not available. Please contact system administrator.');
    }

    try {
      // First verify that the current user is an admin
      const { data: currentUserProfile, error: profileError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', currentUserId)
        .single();

      if (profileError || !currentUserProfile) {
        throw new Error('User profile not found');
      }

      if (currentUserProfile.role !== 'admin') {
        throw new Error('Only admins can reset passwords');
      }

      // Update the user's password using admin API
      const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      // Create audit log
      await adminClient.from('audit_logs').insert({
        user_id: userId,
        action: 'PASSWORD_RESET',
        table_name: 'auth.users',
        record_id: userId,
        old_data: {
          action: 'Password reset initiated',
          reset_by: currentUserId,
          timestamp: new Date().toISOString()
        },
        new_data: {
          action: 'Password reset completed',
          reset_by: currentUserId,
          timestamp: new Date().toISOString()
        }
      });

      console.log('✅ Password reset successful for user:', userId);
      
      return {
        success: true,
        message: 'Password reset successfully',
        userId: userId
      };

    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }
};


