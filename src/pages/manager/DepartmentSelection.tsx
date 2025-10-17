import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartment } from '../../contexts/DepartmentContext';

interface ManagerDepartment {
  id: string;
  department_id: string;
  department: {
    id: string;
    name: string;
  };
}

export function DepartmentSelection() {
  const { user, signOut } = useAuth();
  const { setSelectedDepartment } = useDepartment();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<ManagerDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchManagerDepartments();
    }
  }, [user]);

  const fetchManagerDepartments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('manager_departments')
        .select(`
          id,
          department_id,
          department:departments!manager_departments_department_id_fkey(id, name)
        `)
        .eq('manager_id', user.id);

      if (error) throw error;

      console.log('Manager departments:', data);
      setDepartments(data as any || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Error loading departments. Please contact admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = (dept: { id: string; name: string }) => {
    console.log('Selected department:', dept);
    setSelectedDepartment(dept);
    navigate('/manager');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Department</h1>
          <p className="text-gray-600">
            Welcome, {user?.full_name}! Please select which department you want to manage.
          </p>
        </div>

        {/* No Departments Assigned */}
        {departments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Departments Assigned</h2>
            <p className="text-gray-600 mb-6">
              You don't have any departments assigned yet. Please contact your administrator to assign departments to your account.
            </p>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.department)}
                  className="group bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-200 text-left hover:scale-105 hover:bg-blue-50 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {dept.department.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Click to manage this department
                  </p>
                </button>
              ))}
            </div>

            {/* Helper Text */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">About Department Selection</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Select a department to view and manage its teams and members</li>
                    <li>• You can switch departments anytime from the dashboard</li>
                    <li>• Each department has its own teams and technicians</li>
                    <li>• Changes made in one department don't affect others</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sign Out Option */}
            <div className="text-center mt-6">
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

