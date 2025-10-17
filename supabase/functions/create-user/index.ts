import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Get the request data
    const requestData = await req.json();
    console.log('=== EDGE FUNCTION DEBUG ===');
    console.log('Request data received:', JSON.stringify(requestData, null, 2));
    const { email, password, full_name, employee_id, mobile, designation, department_id, project_id, zone, role, date_of_birth, team_leader_id, manager_id, created_by } = requestData;
    
    // Get department name from department_id if provided
    let departmentName = null;
    if (department_id) {
      const { data: deptData } = await supabaseAdmin
        .from('departments')
        .select('name')
        .eq('id', department_id)
        .single();
      
      departmentName = deptData?.name || null;
    }
    // Debug: Log the extracted values
    console.log('Extracted values:');
    console.log('- team_leader_id:', team_leader_id, 'type:', typeof team_leader_id);
    console.log('- manager_id:', manager_id, 'type:', typeof manager_id);
    console.log('- role:', role);
    // Validate required fields
    if (!email || !password || !full_name || !employee_id || !role) {
      console.log('❌ Validation failed: Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // No validation for team leader assignment - it's optional for all roles
    // Manager field is also optional (admin assigns directly)
    
    console.log('✅ Validation passed');
    
    // Use the provided manager_id as-is (no auto-population)
    let finalManagerId = manager_id;
    // Step 1: Create the auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        employee_id,
        role
      }
    });
    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return new Response(JSON.stringify({
        error: `Failed to create auth user: ${authError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!authData.user) {
      console.error('❌ No user returned from auth creation');
      return new Response(JSON.stringify({
        error: 'Failed to create auth user - no user returned'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const userId = authData.user.id;
    console.log('✅ Auth user created with ID:', userId);
    // Step 2: Create the user profile
    console.log('Step 2: Creating user profile...');
    // Prepare profile data with explicit logging
    const profileData = {
      id: userId,
      email,
      full_name,
      employee_id,
      mobile: mobile || null,
      designation: designation || null,
      department_id: department_id || null,
      department: departmentName, // Also set the old text column
      project_id: project_id || null,
      zone: zone || null,
      role,
      date_of_birth: date_of_birth || null,
      username: email.split('@')[0],
      is_active: true,
      team_leader_id: team_leader_id || null,
      manager_id: finalManagerId || null
    };
    console.log('Profile data to insert:', JSON.stringify(profileData, null, 2));
    console.log('team_leader_id value:', profileData.team_leader_id);
    console.log('manager_id value:', profileData.manager_id);
    const { error: profileError } = await supabaseAdmin.from('users').insert(profileData);
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      console.error('Error details:', JSON.stringify(profileError, null, 2));
      // If profile creation fails, delete the auth user to maintain consistency
      console.log('Cleaning up: Deleting auth user due to profile creation failure');
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({
        error: `Failed to create user profile: ${profileError.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ User profile created successfully');
    // Step 3: Create audit log
    if (created_by) {
      console.log('Step 3: Creating audit log...');
      try {
        await supabaseAdmin.from('audit_logs').insert({
          user_id: created_by,
          action: 'CREATE',
          table_name: 'users',
          record_id: userId,
          new_data: {
            email,
            full_name,
            employee_id,
            role,
            team_leader_id,
            manager_id
          }
        });
        console.log('✅ Audit log created');
      } catch (auditError) {
        console.error('⚠️ Audit log creation failed:', auditError);
      // Don't fail the entire operation for audit log issues
      }
    }
    // Step 4: Create welcome notification
    console.log('Step 4: Creating welcome notification...');
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title: 'Welcome to PCMC Service Support',
        message: `Your account has been created successfully. Your employee ID is ${employee_id}. You can now log in with your email and password.`,
        type: 'success',
        priority: 'medium'
      });
      console.log('✅ Welcome notification created');
    } catch (notificationError) {
      console.error('⚠️ Welcome notification creation failed:', notificationError);
    // Don't fail the entire operation for notification issues
    }
    // Step 5: Notify team leader/manager about new team member
    if (team_leader_id) {
      console.log('Step 5a: Notifying team leader...');
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: team_leader_id,
          title: 'New Team Member Added',
          message: `${full_name} (${employee_id}) has been added to your team as a ${role.replace('_', ' ')}.`,
          type: 'info',
          priority: 'low'
        });
        console.log('✅ Team leader notification created');
      } catch (error) {
        console.error('⚠️ Team leader notification failed:', error);
      }
    }
    if (manager_id) {
      console.log('Step 5b: Notifying manager...');
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: manager_id,
          title: 'New Team Member Added',
          message: `${full_name} (${employee_id}) has been added to your team as a ${role.replace('_', ' ')}.`,
          type: 'info',
          priority: 'low'
        });
        console.log('✅ Manager notification created');
      } catch (error) {
        console.error('⚠️ Manager notification failed:', error);
      }
    }
    // Return success response
    console.log('✅ All operations completed successfully');
    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      message: 'User created successfully',
      user: {
        email,
        full_name,
        employee_id,
        role,
        team_leader_id,
        manager_id
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
