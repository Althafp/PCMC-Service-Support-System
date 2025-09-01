import React, { useState, useEffect } from 'react';
import { MapPin, Search, Eye } from 'lucide-react';
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
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export function LocationView() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Locations</h1>
          <p className="text-gray-600 mt-1">Browse available service locations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search locations, RFP, pole ID..."
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
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Locations</h2>
          <p className="text-sm text-gray-600">Click view to see detailed information</p>
        </div>
        
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
                  Equipment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedLocation(location)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-500">
              {searchTerm || filterZone || filterType || filterPhase
                ? 'Try adjusting your search criteria'
                : 'No locations are currently available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Location Details</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{selectedLocation.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zone:</span>
                      <span className="font-medium">{selectedLocation.zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ward:</span>
                      <span className="font-medium">{selectedLocation.ward_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PS Limits:</span>
                      <span className="font-medium">{selectedLocation.ps_limits || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phase:</span>
                      <span className="font-medium">{selectedLocation.project_phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{selectedLocation.location_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">RFP No:</span>
                      <span className="font-medium">{selectedLocation.rfp_no || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Equipment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Poles:</span>
                      <span className="font-medium">{selectedLocation.no_of_pole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pole ID:</span>
                      <span className="font-medium">{selectedLocation.pole_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">JB SL No:</span>
                      <span className="font-medium">{selectedLocation.jb_sl_no || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Surveillance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cameras:</span>
                      <span className="font-medium">{selectedLocation.no_of_cameras}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fix Box:</span>
                      <span className="font-medium">{selectedLocation.fix_box}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PTZ:</span>
                      <span className="font-medium">{selectedLocation.ptz}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedLocation.latitude && selectedLocation.longitude && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Coordinates</h4>
                  <div className="text-sm text-gray-600">
                    Latitude: {selectedLocation.latitude}, Longitude: {selectedLocation.longitude}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
