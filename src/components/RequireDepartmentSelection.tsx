import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartment } from '../contexts/DepartmentContext';
import { useAuth } from '../contexts/AuthContext';

interface RequireDepartmentSelectionProps {
  children: React.ReactNode;
}

export function RequireDepartmentSelection({ children }: RequireDepartmentSelectionProps) {
  const { user } = useAuth();
  const { selectedDepartment, isLoading } = useDepartment();
  const navigate = useNavigate();

  useEffect(() => {
    // Only managers need department selection
    if (user?.role === 'manager' && !isLoading && !selectedDepartment) {
      console.log('No department selected, redirecting to selection page...');
      navigate('/manager/select-department');
    }
  }, [user, selectedDepartment, isLoading, navigate]);

  // Show loading while checking department
  if (user?.role === 'manager' && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If manager but no department, show loading (will redirect)
  if (user?.role === 'manager' && !selectedDepartment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to department selection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

