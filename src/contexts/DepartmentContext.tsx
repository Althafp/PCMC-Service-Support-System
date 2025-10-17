import React, { createContext, useContext, useState, useEffect } from 'react';

interface Department {
  id: string;
  name: string;
}

interface DepartmentContextType {
  selectedDepartment: Department | null;
  setSelectedDepartment: (department: Department | null) => void;
  clearDepartment: () => void;
  isLoading: boolean;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartment, setSelectedDepartmentState] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedDepartment');
    if (stored) {
      try {
        setSelectedDepartmentState(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading department from storage:', error);
        localStorage.removeItem('selectedDepartment');
      }
    }
    setIsLoading(false);
  }, []);

  const setSelectedDepartment = (department: Department | null) => {
    setSelectedDepartmentState(department);
    if (department) {
      localStorage.setItem('selectedDepartment', JSON.stringify(department));
    } else {
      localStorage.removeItem('selectedDepartment');
    }
  };

  const clearDepartment = () => {
    setSelectedDepartmentState(null);
    localStorage.removeItem('selectedDepartment');
  };

  return (
    <DepartmentContext.Provider
      value={{
        selectedDepartment,
        setSelectedDepartment,
        clearDepartment,
        isLoading,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
}

