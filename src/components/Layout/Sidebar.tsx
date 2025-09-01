import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  MapPin, 
  Settings,
  CheckSquare,
  BarChart3,
  UserCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigationItems = {
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Reports Management', href: '/admin/reports', icon: FileText },
    { name: 'Location Management', href: '/admin/locations', icon: MapPin },
    { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ],
  manager: [
    { name: 'Dashboard', href: '/manager', icon: Home },
    { name: 'Team Management', href: '/manager/teams', icon: Users },
    { name: 'Reports Overview', href: '/manager/reports', icon: FileText },
    { name: 'Location Management', href: '/manager/locations', icon: MapPin },
    { name: 'Analytics', href: '/manager/analytics', icon: BarChart3 },
  ],
  team_leader: [
    { name: 'Dashboard', href: '/team-leader', icon: Home },
    { name: 'Report Approvals', href: '/team-leader/approvals', icon: CheckSquare },
    { name: 'Team Reports', href: '/team-leader/reports', icon: FileText },
    { name: 'Team Members', href: '/team-leader/team', icon: Users },
  ],
  technical_executive: [
    { name: 'Dashboard', href: '/technician', icon: Home },
    { name: 'Service Reports', href: '/technician/reports', icon: FileText },
    { name: 'New Report', href: '/technician/new-report', icon: CheckSquare },
    { name: 'Locations', href: '/technician/locations', icon: MapPin },
  ],
  technician: [
    { name: 'Dashboard', href: '/technician', icon: Home },
    { name: 'My Reports', href: '/technician/reports', icon: FileText },
    { name: 'New Report', href: '/technician/new-report', icon: CheckSquare },
    { name: 'Locations', href: '/technician/locations', icon: MapPin },
  ],
};

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const userNavigation = navigationItems[user.role] || [];

  return (
    <div className="w-64 bg-white shadow-sm h-full border-r border-gray-200">
      <nav className="mt-8">
        <div className="px-3">
          {userNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 mb-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}