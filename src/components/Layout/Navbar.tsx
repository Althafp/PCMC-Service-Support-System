import React, { useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { UserProfileModal } from '../Profile/UserProfileModal';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">PCMC Service Support</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <NotificationCenter />

            {/* User Profile Section */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm text-left">
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </button>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="User Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Modal */}
          {showProfileModal && (
            <UserProfileModal 
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
            />
          )}
        </div>
      </div>
    </nav>
  );
}