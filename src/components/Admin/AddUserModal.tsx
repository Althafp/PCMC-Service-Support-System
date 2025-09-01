import React, { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase, User, UserRole } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    employee_id: '',
    mobile: '',
    designation: '',
    department: '',
    zone: '',
    role: 'technician' as UserRole,
    date_of_birth: '',
    team_leader_id: '',
    manager_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form data when modal opens
      setFormData({
        full_name: '',
        email: '',
        password: '',
        employee_id: '',
        mobile: '',
        designation: '',
        department: '',
        zone: '',
        role: 'technician',
        date_of_birth: '',
        team_leader_id: '',
        manager_id: '',
      });
      
      fetchAvailableLeaders();
      fetchAvailableManagers();
    }
  }, [isOpen]);

  const fetchAvailableLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id, zone')
        .eq('role', 'team_leader')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      // Cast the partial data to User[] since we only need these fields for display
      setAvailableLeaders((data as User[]) || []);
    } catch (error) {
      console.error('Error fetching team leaders:', error);
    }
  };

  const fetchAvailableManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, employee_id, zone')
        .eq('role', 'manager')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      // Cast the partial data to User[] since we only need these fields for display
      setAvailableManagers((data as User[]) || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Validation check - Role:', formData.role);
    console.log('Validation check - Team Leader ID:', formData.team_leader_id);
    console.log('Validation check - Manager ID:', formData.manager_id);
    console.log('Full form data:', JSON.stringify(formData, null, 2));
    
    // Validate leader assignment
    if ((formData.role === 'technician' || formData.role === 'technical_executive') && !formData.team_leader_id) {
      console.log('❌ Validation failed: Technical role needs team leader');
      alert('Please assign a Team Leader for technical roles.');
      return;
    }

    if (formData.role === 'team_leader' && !formData.manager_id) {
      console.log('❌ Validation failed: Team leader needs manager');
      alert('Please assign a Manager for Team Leader role.');
      return;
    }

    console.log('✅ Validation passed - proceeding with user creation');

    setLoading(true);
    try {
      console.log('Creating user automatically...', formData.email);
             console.log('Form data being sent:', {
         ...formData,
         password: '[HIDDEN]',
         team_leader_id: formData.team_leader_id,
         manager_id: formData.manager_id
       });
       
       // Debug: Check the actual form state
       console.log('Raw form state:', formData);
       console.log('Manager ID type:', typeof formData.manager_id);
       console.log('Manager ID length:', formData.manager_id?.length);
       console.log('Manager ID === empty string:', formData.manager_id === '');

      // Call the Supabase Edge Function to create both auth user and profile
      const { data: functionResult, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          employee_id: formData.employee_id,
          mobile: formData.mobile,
          designation: formData.designation,
          department: formData.department,
          zone: formData.zone,
          role: formData.role,
          date_of_birth: formData.date_of_birth,
          team_leader_id: formData.team_leader_id || null,
          manager_id: formData.manager_id || null,
          created_by: currentUser.id,
        },
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`Failed to create user: ${functionError.message}`);
      }

      if (!functionResult.success) {
        throw new Error(functionResult.error || 'Failed to create user');
      }

      // Create audit log
      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        action: 'CREATE',
        table_name: 'users',
        record_id: functionResult.user_id || 'new',
        new_data: {
          email: formData.email,
          full_name: formData.full_name,
          employee_id: formData.employee_id,
          role: formData.role,
          team_leader_id: formData.team_leader_id,
          manager_id: formData.manager_id,
          created_by: currentUser.id
        },
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      });

      // Success!
      alert(
        `User created successfully! 🎉\n\n` +
        `✅ Auth user created\n` +
        `✅ Profile created\n` +
        `✅ Welcome notification sent\n\n` +
        `📧 Email: ${formData.email}\n` +
        `🆔 Employee ID: ${formData.employee_id}\n` +
        `🔐 Password: ${formData.password}\n` +
        `👥 Role: ${formData.role.replace('_', ' ')}\n` +
        `${formData.team_leader_id ? `👨‍💼 Team Leader: ${availableLeaders.find(l => l.id === formData.team_leader_id)?.full_name}\n` : ''}` +
        `${formData.manager_id ? `👔 Manager: ${availableManagers.find(m => m.id === formData.manager_id)?.full_name}\n` : ''}` +
        `\nThe user can now log in immediately!`
      );
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        employee_id: '',
        mobile: '',
        designation: '',
        department: '',
        zone: '',
        role: 'technician',
        date_of_birth: '',
        team_leader_id: '',
        manager_id: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(
        `❌ Failed to create user\n\n` +
        `Error: ${errorMessage}\n\n` +
        `Please check:\n` +
        `• Email is not already in use\n` +
        `• Employee ID is unique\n` +
        `• All required fields are filled\n` +
        `• Leader/Manager is assigned (if required)\n` +
        `• Your internet connection\n\n` +
        `If the problem persists, contact your system administrator.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter employee ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile *
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter designation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter department"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone
              </label>
              <input
                type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter zone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role and Leader Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setFormData({ 
                    ...formData, 
                    role: newRole,
                    // Only clear leader assignments when switching to roles that don't need them
                    team_leader_id: (newRole === 'technician' || newRole === 'technical_executive') ? formData.team_leader_id : '',
                    manager_id: newRole === 'team_leader' ? formData.manager_id : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="technician">Technician</option>
                <option value="technical_executive">Technical Executive</option>
                <option value="team_leader">Team Leader</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Team Leader Assignment for Technical Roles */}
            {(formData.role === 'technician' || formData.role === 'technical_executive') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Leader *
                </label>
                <select
                  value={formData.team_leader_id}
                  onChange={(e) => setFormData({ ...formData, team_leader_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Team Leader</option>
                  {availableLeaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.full_name} - {leader.employee_id} ({leader.zone})
                    </option>
                  ))}
                </select>
                {availableLeaders.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No team leaders available. Please create team leaders first.
                  </p>
                )}
              </div>
            )}

            {/* Manager Assignment for Team Leaders */}
            {formData.role === 'team_leader' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager *
                </label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => {
                    console.log('Manager dropdown changed:', e.target.value);
                    console.log('Previous manager_id:', formData.manager_id);
                    setFormData({ ...formData, manager_id: e.target.value });
                    console.log('New manager_id set to:', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Manager</option>
                  {availableManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} - {manager.employee_id} ({manager.zone})
                    </option>
                  ))}
                </select>
                {availableManagers.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No managers available. Please create managers first.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Generate Password
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter or generate password"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
