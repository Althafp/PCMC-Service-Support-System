import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, FileText, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartment } from '../../contexts/DepartmentContext';

interface AnalyticsData {
  totalReports: number;
  approvedReports: number;
  rejectedReports: number;
  pendingReports: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  reportsByZone: { zone: string; count: number }[];
  reportsByType: { type: string; count: number }[];
  reportsByMonth: { month: string; count: number }[];
  teamPerformance: { name: string; reports: number; approvalRate: number }[];
}

export function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedDepartment } = useDepartment();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    if (user && selectedDepartment) {
      fetchAnalytics();
    }
  }, [user, selectedDepartment, selectedPeriod]);

  const fetchAnalytics = async () => {
    if (!user || !selectedDepartment) return;

    try {
      // Get team members in selected department only
      const { data: teamData, error: teamError } = await supabase
        .from('users')
        .select('id, full_name, role, zone, is_active')
        .eq('department_id', selectedDepartment.id)
        .in('role', ['technician', 'team_leader']);

      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setAnalytics({
          totalReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          pendingReports: 0,
          totalTeamMembers: 0,
          activeTeamMembers: 0,
          reportsByZone: [],
          reportsByType: [],
          reportsByMonth: [],
          teamPerformance: []
        });
        setLoading(false);
        return;
      }

      const teamIds = teamData.map(m => m.id);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      // Get reports from team members (exclude drafts)
      const { data: reportsData, error: reportsError } = await supabase
        .from('service_reports')
        .select(`
          id,
          approval_status,
          complaint_type,
          location,
          created_at,
          technician_id
        `)
        .in('technician_id', teamIds)
        .neq('status', 'draft') // Exclude drafts from analytics
        .gte('created_at', daysAgo.toISOString());

      if (reportsError) throw reportsError;

      const reports = reportsData || [];

      // Calculate analytics
      const totalReports = reports.length;
              const approvedReports = reports.filter(r => r.approval_status === 'approve').length;
        const rejectedReports = reports.filter(r => r.approval_status === 'reject').length;
      const pendingReports = totalReports - approvedReports - rejectedReports;

      // Reports by zone
      const zoneMap = new Map<string, number>();
      teamData.forEach(member => {
        if (member.zone) {
          zoneMap.set(member.zone, (zoneMap.get(member.zone) || 0) + 
            reports.filter(r => r.technician_id === member.id).length);
        }
      });
      const reportsByZone = Array.from(zoneMap.entries()).map(([zone, count]) => ({ zone, count }));

      // Reports by type
      const typeMap = new Map<string, number>();
      reports.forEach(report => {
        if (report.complaint_type) {
          typeMap.set(report.complaint_type, (typeMap.get(report.complaint_type) || 0) + 1);
        }
      });
      const reportsByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

      // Reports by month (last 6 months)
      const monthMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(monthKey, 0);
      }
      
      reports.forEach(report => {
        const reportDate = new Date(report.created_at);
        const monthKey = reportDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthMap.has(monthKey)) {
          monthMap.set(monthKey, monthMap.get(monthKey)! + 1);
        }
      });
      const reportsByMonth = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));

      // Team performance
      const teamPerformance = teamData.map(member => {
        const memberReports = reports.filter(r => r.technician_id === member.id);
        const totalMemberReports = memberReports.length;
        const approvedMemberReports = memberReports.filter(r => r.approval_status === 'approve').length;
        const approvalRate = totalMemberReports > 0 ? (approvedMemberReports / totalMemberReports) * 100 : 0;
        
        return {
          name: member.full_name,
          reports: totalMemberReports,
          approvalRate: Math.round(approvalRate)
        };
      }).sort((a, b) => b.reports - a.reports);

      setAnalytics({
        totalReports,
        approvedReports,
        rejectedReports,
        pendingReports,
        totalTeamMembers: teamData.length,
        activeTeamMembers: teamData.filter(m => m.is_active).length,
        reportsByZone,
        reportsByType,
        reportsByMonth,
        teamPerformance
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.approvedReports}</p>
              <p className="text-sm text-gray-500">
                {analytics.totalReports > 0 
                  ? `${Math.round((analytics.approvedReports / analytics.totalReports) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.pendingReports}</p>
              <p className="text-sm text-gray-500">
                {analytics.totalReports > 0 
                  ? `${Math.round((analytics.pendingReports / analytics.totalReports) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalTeamMembers}</p>
              <p className="text-sm text-gray-500">{analytics.activeTeamMembers} active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Zone</h3>
          {analytics.reportsByZone.length > 0 ? (
            <div className="space-y-3">
              {analytics.reportsByZone.map((zoneData) => (
                <div key={zoneData.zone} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{zoneData.zone}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(zoneData.count / analytics.totalReports) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{zoneData.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No zone data available</p>
          )}
        </div>

        {/* Reports by Type */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Type</h3>
          {analytics.reportsByType.length > 0 ? (
            <div className="space-y-3">
              {analytics.reportsByType.map((typeData) => (
                <div key={typeData.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{typeData.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(typeData.count / analytics.totalReports) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{typeData.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No type data available</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Report Trend</h3>
        {analytics.reportsByMonth.length > 0 ? (
          <div className="flex items-end justify-between h-32 space-x-2">
            {analytics.reportsByMonth.map((monthData) => {
              const maxCount = Math.max(...analytics.reportsByMonth.map(m => m.count));
              const height = maxCount > 0 ? (monthData.count / maxCount) * 100 : 0;
              
              return (
                <div key={monthData.month} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1">{monthData.count}</div>
                  <div 
                    className="w-full bg-blue-200 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">{monthData.month}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No monthly data available</p>
        )}
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
        {analytics.teamPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.teamPerformance.map((member) => (
                  <tr key={member.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.reports}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.approvalRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              member.approvalRate >= 80 ? 'bg-green-600' :
                              member.approvalRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${member.approvalRate}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          member.approvalRate >= 80 ? 'text-green-600' :
                          member.approvalRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.approvalRate >= 80 ? 'Excellent' :
                           member.approvalRate >= 60 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No team performance data available</p>
        )}
      </div>
    </div>
  );
}
