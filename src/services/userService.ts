import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';

/**
 * User service that handles secure user data fetching
 * This bypasses RLS issues by using specific database functions
 */

export const userService = {
  /**
   * Get the current user's own profile
   */
  async getOwnProfile(userId: string): Promise<{ data: User | null; error: any }> {
    try {
      console.log('Attempting to fetch profile via RPC for user:', userId);
      const { data, error } = await supabase.rpc('get_own_profile', {
        user_id: userId
      });

      if (error) {
        console.error('RPC Error fetching own profile:', error);
        console.log('Falling back to direct query...');
        
        // Fallback to direct query
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('is_active', true)
            .single();

          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            return { data: null, error: fallbackError };
          }

          console.log('Fallback query successful:', fallbackData?.full_name);
          return { data: fallbackData, error: null };
        } catch (fallbackError) {
          console.error('Fallback query exception:', fallbackError);
          return { data: null, error: fallbackError };
        }
      }

      console.log('RPC query successful:', data?.[0]?.full_name);
      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Error in getOwnProfile:', error);
      return { data: null, error };
    }
  },

  /**
   * Get team members for a manager (team leaders + technicians under them)
   */
  async getManagerTeam(managerId: string): Promise<{ data: User[]; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_manager_team', {
        manager_id: managerId
      });

      if (error) {
        console.error('Error fetching manager team:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getManagerTeam:', error);
      return { data: [], error };
    }
  },

  /**
   * Get only team leaders for a manager (for hierarchical display)
   */
  async getManagerTeamLeaders(managerId: string): Promise<{ data: User[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', managerId)
        .eq('role', 'team_leader')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching manager team leaders:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getManagerTeamLeaders:', error);
      return { data: [], error };
    }
  },

  /**
   * Get technicians under a specific team leader (for hierarchical display)
   */
  async getTechniciansUnderTeamLeader(teamLeaderId: string): Promise<{ data: User[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('team_leader_id', teamLeaderId)
        .in('role', ['technician', 'technical_executive'])
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching technicians under team leader:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getTechniciansUnderTeamLeader:', error);
      return { data: [], error };
    }
  },

  /**
   * Get team members for a team leader (technicians/technical executives under them)
   */
  async getTeamLeaderTeam(teamLeaderId: string): Promise<{ data: User[]; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_team_leader_team', {
        team_leader_id: teamLeaderId
      });

      if (error) {
        console.error('Error fetching team leader team:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getTeamLeaderTeam:', error);
      return { data: [], error };
    }
  },

  /**
   * Get all users (for admins only)
   */
  async getAllUsersAdmin(adminId: string): Promise<{ data: User[]; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_all_users_admin', {
        admin_id: adminId
      });

      if (error) {
        console.error('Error fetching all users (admin):', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllUsersAdmin:', error);
      return { data: [], error };
    }
  },

  /**
   * Update user profile (for own profile only)
   */
  async updateOwnProfile(userId: string, updates: Partial<User>): Promise<{ data: User | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateOwnProfile:', error);
      return { data: null, error };
    }
  },

  /**
   * Get reports for manager's team
   */
  async getManagerTeamReports(managerId: string): Promise<{ data: any[]; error: any }> {
    try {
      // First get the team member IDs
      const { data: teamMembers, error: teamError } = await this.getManagerTeam(managerId);
      if (teamError || !teamMembers.length) {
        return { data: [], error: teamError };
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Then get reports for those team members
      const { data, error } = await supabase
        .from('service_reports')
        .select('*')
        .in('technician_id', teamMemberIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching manager team reports:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getManagerTeamReports:', error);
      return { data: [], error };
    }
  },

  /**
   * Get reports for team leader's team
   */
  async getTeamLeaderReports(teamLeaderId: string): Promise<{ data: any[]; error: any }> {
    try {
      // First get the team member IDs
      const { data: teamMembers, error: teamError } = await this.getTeamLeaderTeam(teamLeaderId);
      if (teamError || !teamMembers.length) {
        return { data: [], error: teamError };
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Then get reports for those team members
      const { data, error } = await supabase
        .from('service_reports')
        .select('*')
        .in('technician_id', teamMemberIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team leader reports:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getTeamLeaderReports:', error);
      return { data: [], error };
    }
  }
};
