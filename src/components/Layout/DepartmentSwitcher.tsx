import React, { useState } from 'react';
import { Building2, ChevronDown, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDepartment } from '../../contexts/DepartmentContext';

export function DepartmentSwitcher() {
  const { selectedDepartment, clearDepartment } = useDepartment();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleSwitchDepartment = () => {
    clearDepartment();
    setShowMenu(false);
    navigate('/manager/select-department');
  };

  if (!selectedDepartment) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
      >
        <Building2 className="w-4 h-4" />
        <span className="text-sm font-medium">{selectedDepartment.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Current Department</p>
              <p className="text-sm font-semibold text-gray-900">{selectedDepartment.name}</p>
            </div>
            <div className="p-2">
              <button
                onClick={handleSwitchDepartment}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Switch Department</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

