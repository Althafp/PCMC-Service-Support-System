import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireDepartmentSelection } from './components/RequireDepartmentSelection';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementHierarchical } from './pages/admin/UserManagementHierarchical';
import { AdminReportView } from './pages/admin/AdminReportView';
import { ReportsManagement } from './pages/admin/ReportsManagement';
import { LocationView } from './pages/technician/LocationView';
import { ReportView } from './pages/technician/ReportView';
import { LocationManagement } from './pages/admin/LocationManagement';
import { AuditLogs } from './pages/admin/AuditLogs';
import { GeneralSettings } from './pages/admin/GeneralSettings';
import { SystemSettings } from './pages/admin/SystemSettings';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { DepartmentSelection } from './pages/manager/DepartmentSelection';
import { TeamManagementNew } from './pages/manager/TeamManagementNew';
import { ReportsOverview } from './pages/manager/ReportsOverview';
import { ManagerReportView } from './pages/manager/ManagerReportView';
import { ManagerLocationManagement } from './pages/manager/LocationManagement';
import { Analytics } from './pages/manager/Analytics';
import { TeamLeaderDashboard } from './pages/team-leader/TeamLeaderDashboard';
import { EnhancedReportApproval } from './pages/team-leader/EnhancedReportApproval';
import { ReportApprovalList } from './pages/team-leader/ReportApprovalList';
import { TeamReports } from './pages/team-leader/TeamReports';
import { TeamMembers } from './pages/team-leader/TeamMembers';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { EnhancedNewReport } from './pages/technician/EnhancedNewReport';
import { MyReports } from './pages/technician/MyReports';
import { Drafts } from './pages/technician/Drafts';
import { UnifiedReportView } from './pages/UnifiedReportView';
import { useAuth } from './contexts/AuthContext';

// Root route component that handles authentication redirects
function RootRedirect() {
  const { user, loading, profileError } = useAuth();
  const [timeoutReached, setTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached in RootRedirect');
        setTimeoutReached(true);
      }
    }, 8000); // 8 second timeout (reduced from 15)

    return () => clearTimeout(timeout);
  }, [loading]);

  // If timeout reached and still loading, show error
  if (timeoutReached && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Loading Timeout</div>
          <p className="text-gray-600 mb-4">
            The application is taking longer than expected to load. 
            This might be due to a network issue or database connection problem.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (user && !profileError) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <UserManagementHierarchical />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ReportsManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/report-view/:reportId" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <UnifiedReportView />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/locations" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <LocationManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/general-settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <GeneralSettings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Manager Routes */}
            <Route path="/manager/select-department" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DepartmentSelection />
              </ProtectedRoute>
            } />
            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />
            <Route path="/manager/team" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <TeamManagementNew />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />
            <Route path="/manager/reports" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <ReportsOverview />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />
            <Route path="/manager/report-view/:reportId" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <UnifiedReportView />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />
            <Route path="/manager/locations" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <ManagerLocationManagement />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />
            <Route path="/manager/analytics" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <RequireDepartmentSelection>
                  <Layout>
                    <Analytics />
                  </Layout>
                </RequireDepartmentSelection>
              </ProtectedRoute>
            } />

            {/* Team Leader Routes */}
            <Route path="/team-leader" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <TeamLeaderDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-leader/approvals" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <ReportApprovalList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-leader/approvals/:reportId" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <EnhancedReportApproval />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-leader/reports" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <TeamReports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-leader/team" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <TeamMembers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-leader/report-view/:reportId" element={
              <ProtectedRoute allowedRoles={['team_leader']}>
                <Layout>
                  <UnifiedReportView />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Technician Routes */}
            <Route path="/technician" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <TechnicianDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/technician/new-report" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <EnhancedNewReport />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/technician/reports" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <MyReports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/technician/drafts" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <Drafts />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/technician/locations" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <LocationView />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/technician/report-view/:reportId" element={
              <ProtectedRoute allowedRoles={['technician', 'technical_executive']}>
                <Layout>
                  <UnifiedReportView />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;