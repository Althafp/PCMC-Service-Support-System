import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Filter, Eye, Map } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Location {
  id: string;
  project_phase: string;
  location_type: string;
  rfp_no: string;
  zone: string;
  location: string;
  ward_no: string;
  ps_limits: string;
  no_of_pole: number;
  pole_id: string;
  jb_sl_no: string;
  no_of_cameras: number;
  fix_box: number;
  ptz: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export function ManagerLocationManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPhase, setFilterPhase] = useState('');

  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('location_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = 
      location.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.rfp_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.pole_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.ward_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesZone = !filterZone || location.zone === filterZone;
    const matchesType = !filterType || location.location_type === filterType;
    const matchesPhase = !filterPhase || location.project_phase === filterPhase;
    
    return matchesSearch && matchesZone && matchesType && matchesPhase;
  });

  const uniqueZones = [...new Set(locations.map(l => l.zone).filter(Boolean))];
  const uniqueTypes = [...new Set(locations.map(l => l.location_type).filter(Boolean))];
  const uniquePhases = [...new Set(locations.map(l => l.project_phase).filter(Boolean))];

  if (loading) {
    return <div className="animate-pulse">Loading locations...</div>;
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
        <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
        <div></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search locations, RFP, poles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Zones</option>
              {uniqueZones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Phases</option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterZone('');
                setFilterType('');
                setFilterPhase('');
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Locations</h2>
          <p className="text-sm text-gray-600">View all project locations and their details</p>
        </div>
        
        {filteredLocations.length === 0 ? (
          <div className="p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-500">
              {searchTerm || filterZone || filterType || filterPhase 
                ? 'Try adjusting your search criteria'
                : 'No locations have been added yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Infrastructure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{location.location}</div>
                      <div className="text-sm text-gray-500">Zone: {location.zone}</div>
                      <div className="text-sm text-gray-500">Ward: {location.ward_no || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Phase: {location.project_phase}</div>
                      <div className="text-sm text-gray-500">Type: {location.location_type}</div>
                      <div className="text-sm text-gray-500">RFP: {location.rfp_no || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Poles: {location.no_of_pole}</div>
                      <div className="text-sm text-gray-500">Pole ID: {location.pole_id || 'N/A'}</div>
                      <div className="text-sm text-gray-500">JB: {location.jb_sl_no || 'N/A'}</div>
                      <div className="text-sm text-gray-500">Cameras: {location.no_of_cameras}</div>
                      <div className="text-sm text-gray-500">Fix Box: {location.fix_box}, PTZ: {location.ptz}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {location.latitude && location.longitude ? (
                          <span className="flex items-center">
                            <Map className="w-4 h-4 mr-1" />
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div className="text-sm text-gray-500">PS Limits: {location.ps_limits || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(location.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-semibold text-gray-900">{locations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Map className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Zones</p>
              <p className="text-2xl font-semibold text-gray-900">{uniqueZones.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Poles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {locations.reduce((sum, loc) => sum + (loc.no_of_pole || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cameras</p>
              <p className="text-2xl font-semibold text-gray-900">
                {locations.reduce((sum, loc) => sum + (loc.no_of_cameras || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
