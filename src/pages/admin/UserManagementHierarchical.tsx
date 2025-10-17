import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Filter, Key, ChevronDown, ChevronUp, Users, Shield } from 'lucide-react';
import { supabase, User, UserRole } from '../../lib/supabase';
import { AddUserModal } from '../../components/Admin/AddUserModal';
import { EditUserModal } from '../../components/Admin/EditUserModal';
import { PasswordResetModal } from '../../components/Admin/PasswordResetModal';

interface Department {
  id: string;
  name: string;
}

interface ManagerDepartment {
  manager_id: string;
  department_id: string;
  department: Department;
}

interface ManagerGroup {
  manager: User;
  departments: {
    department: Department;
    technicians: User[];
  }[];
}

export function UserManagementHierarchical() {
  const [users, setUsers] = useState<User[]>([]);
  const [managerDepartments, setManagerDepartments] = useState<ManagerDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
    fetchManagerDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('manager_departments')
        .select(`
          manager_id,
          department_id,
          department:departments!manager_departments_department_id_fkey(id, name)
        `);

      if (error) throw error;
      setManagerDepartments(data as any || []);
    } catch (error) {
      console.error('Error fetching manager departments:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      alert(`User "${userName}" deleted successfully.`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const toggleManagerExpand = (managerId: string) => {
    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

  const toggleDepartmentExpand = (key: string) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Group users hierarchically: Manager → Departments → Technicians
  const groupUsersByManagerAndDepartment = (): ManagerGroup[] => {
    const managers = users.filter(u => u.role === 'manager');
    
    return managers.map(manager => {
      // Get all departments for this manager
      const depts = managerDepartments
        .filter(md => md.manager_id === manager.id)
        .map(md => {
          // Get ALL technicians in this department (not just those assigned to this manager)
          const techsInDept = users.filter(u => 
            (u.role === 'technician' || u.role === 'team_leader') &&
            (u as any).department_id === md.department_id
          );
          
          return {
            department: md.department,
            technicians: techsInDept
          };
        });
      
      return {
        manager,
        departments: depts
      };
    });
  };

  const getOtherUsers = () => {
    return users.filter(u => u.role !== 'manager' && u.role !== 'technician' && u.role !== 'team_leader');
  };

  const getUnassignedTechnicians = () => {
    // Technicians/Team Leaders without a department are considered unassigned
    return users.filter(u => 
      (u.role === 'technician' || u.role === 'team_leader') && 
      !(u as any).department_id
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const renderUserRow = (user: User, indent: boolean = false) => (
    <tr key={user.id} className={`hover:bg-gray-50 ${indent ? 'bg-blue-50' : ''}`}>
      <td className={`px-6 py-4 whitespace-nowrap ${indent ? 'pl-12' : ''}`}>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400">ID: {user.employee_id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
          {user.role.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.department || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => setEditingUser(user)}
          className="text-blue-600 hover:text-blue-900"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleUserStatus(user.id, user.is_active)}
          className="text-yellow-600 hover:text-yellow-900"
        >
          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setPasswordResetUser(user)}
          className="text-purple-600 hover:text-purple-900"
        >
          <Key className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteUser(user.id, user.full_name)}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  if (loading) {
    return <div className="animate-pulse">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowAddUser(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'hierarchical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hierarchical
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'flat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Hierarchical View */}
      {viewMode === 'hierarchical' ? (
        <div className="space-y-6">
          {/* Managers → Departments → Technicians */}
          {groupUsersByManagerAndDepartment()
            .filter(group => {
              if (roleFilter === 'all' || roleFilter === 'manager' || roleFilter === 'technician') {
                const matchesManagerSearch = group.manager.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             group.manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             group.manager.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesManagerSearch || group.departments.length > 0;
              }
              return false;
            })
            .map((group) => (
              <div key={group.manager.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Manager Header */}
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleManagerExpand(group.manager.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.manager.full_name}</h3>
                      <p className="text-sm text-gray-600">{group.manager.email}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">ID: {group.manager.employee_id}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                          Manager
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          group.manager.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {group.manager.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {group.departments.length} Department{group.departments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingUser(group.manager);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserStatus(group.manager.id, group.manager.is_active);
                      }}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                    >
                      {group.manager.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPasswordResetUser(group.manager);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {expandedManagers.has(group.manager.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Departments under this manager */}
                {expandedManagers.has(group.manager.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    {group.departments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic py-4 text-center">
                        No departments assigned to this manager
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {group.departments.map((dept) => {
                          const deptKey = `${group.manager.id}-${dept.department.id}`;
                          const isExpanded = expandedDepartments.has(deptKey);
                          
                          return (
                            <div key={deptKey} className="bg-white rounded-lg border border-blue-200">
                              {/* Department Header */}
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50"
                                onClick={() => toggleDepartmentExpand(deptKey)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{dept.department.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      {dept.technicians.length} Member{dept.technicians.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>

                              {/* Members in this department */}
                              {isExpanded && (
                                <div className="border-t border-blue-100 bg-blue-50 p-3 space-y-2">
                                  {dept.technicians.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic text-center py-2">
                                      No members in this department
                                    </p>
                                  ) : (
                                    dept.technicians.map((tech) => (
                                      <div
                                        key={tech.id}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium text-xs">
                                              {tech.full_name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <p className="text-sm font-medium text-gray-900">{tech.full_name}</p>
                                              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded capitalize ${
                                                tech.role === 'team_leader' 
                                                  ? 'bg-purple-100 text-purple-800' 
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}>
                                                {tech.role.replace('_', ' ')}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-600">{tech.employee_id}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => setEditingUser(tech)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => toggleUserStatus(tech.id, tech.is_active)}
                                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                                          >
                                            {tech.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                          </button>
                                          <button
                                            onClick={() => setPasswordResetUser(tech)}
                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                                          >
                                            <Key className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => deleteUser(tech.id, tech.full_name)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

          {/* Unassigned Technicians */}
          {getUnassignedTechnicians().length > 0 && (roleFilter === 'all' || roleFilter === 'technician') && (
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200">
              <div className="p-6 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unassigned Members ({getUnassignedTechnicians().length})
                </h3>
                <p className="text-sm text-yellow-700">These technicians/team leaders don't have a department assigned</p>
              </div>
              <div className="p-4 space-y-2">
                {getUnassignedTechnicians().map((tech) => renderUserRow(tech))}
              </div>
            </div>
          )}

          {/* Other Users (Admins, Team Leaders, etc.) */}
          {getOtherUsers().filter(u => {
            if (roleFilter === 'all') return true;
            return u.role === roleFilter;
          }).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Other Users</h3>
                <p className="text-sm text-gray-600">Admins and other roles</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getOtherUsers()
                      .filter(u => {
                        if (roleFilter === 'all') return true;
                        return u.role === roleFilter;
                      })
                      .filter(u =>
                        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => renderUserRow(user))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat Table View */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => renderUserRow(user))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSuccess={fetchUsers}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={fetchUsers}
        user={editingUser}
      />

      <PasswordResetModal
        isOpen={!!passwordResetUser}
        onClose={() => setPasswordResetUser(null)}
        user={passwordResetUser}
      />
    </div>
  );
}

