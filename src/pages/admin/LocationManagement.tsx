import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Search, Edit, Trash2, Filter, Eye, X } from 'lucide-react';
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

export function LocationManagement() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    project_phase: '',
    location_type: '',
    rfp_no: '',
    zone: '',
    location: '',
    ward_no: '',
    ps_limits: '',
    no_of_pole: 0,
    pole_id: '',
    jb_sl_no: '',
    no_of_cameras: 0,
    fix_box: 0,
    ptz: 0,
    latitude: null as number | null,
    longitude: null as number | null,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Prepare data with proper type conversion
      const locationData = {
        ...formData,
        // Ensure all numeric fields are properly typed
        no_of_pole: Number(formData.no_of_pole) || 0,
        no_of_cameras: Number(formData.no_of_cameras) || 0,
        fix_box: Number(formData.fix_box) || 0,
        ptz: Number(formData.ptz) || 0,
        latitude: formData.latitude !== null ? Number(formData.latitude) || null : null,
        longitude: formData.longitude !== null ? Number(formData.longitude) || null : null,
      };

      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('location_details')
          .update(locationData)
          .eq('id', editingLocation.id);

        if (error) throw error;

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'UPDATE',
          table_name: 'location_details',
          record_id: editingLocation.id,
          old_data: editingLocation,
          new_data: locationData,
        });

        alert('Location updated successfully!');
      } else {
        // Create new location
        const { error } = await supabase
          .from('location_details')
          .insert([locationData]);

        if (error) throw error;

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'CREATE',
          table_name: 'location_details',
          record_id: 'new',
          new_data: locationData,
        });

        alert('Location created successfully!');
      }

      setShowAddModal(false);
      setEditingLocation(null);
      resetForm();
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      project_phase: location.project_phase,
      location_type: location.location_type,
      rfp_no: location.rfp_no,
      zone: location.zone,
      location: location.location,
      ward_no: location.ward_no,
      ps_limits: location.ps_limits,
      no_of_pole: location.no_of_pole,
      pole_id: location.pole_id,
      jb_sl_no: location.jb_sl_no,
      no_of_cameras: location.no_of_cameras,
      fix_box: location.fix_box,
      ptz: location.ptz,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete location "${locationName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('location_details')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      // Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'DELETE',
        table_name: 'location_details',
        record_id: locationId,
        old_data: { location_name: locationName, deleted_at: new Date().toISOString() },
      });

      alert('Location deleted successfully!');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Error deleting location. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      project_phase: '',
      location_type: '',
      rfp_no: '',
      zone: '',
      location: '',
      ward_no: '',
      ps_limits: '',
      no_of_pole: 0,
      pole_id: '',
      jb_sl_no: '',
      no_of_cameras: 0,
      fix_box: 0,
      ptz: 0,
      latitude: null,
      longitude: null,
    });
  };

  const openAddModal = () => {
    setEditingLocation(null);
    resetForm();
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingLocation(null);
    resetForm();
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.rfp_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = !filterZone || location.zone === filterZone;
    const matchesType = !filterType || location.location_type === filterType;
    
    return matchesSearch && matchesZone && matchesType;
  });

  const uniqueZones = [...new Set(locations.map(l => l.zone))];
  const uniqueTypes = [...new Set(locations.map(l => l.location_type))];

  if (loading) {
    return <div className="animate-pulse">Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600">Manage all project locations and infrastructure details</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Location
        </button>
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
                placeholder="Search locations, RFP, zone..."
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

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterZone('');
                setFilterType('');
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{location.location}</div>
                      <div className="text-sm text-gray-500">Zone: {location.zone}</div>
                      <div className="text-sm text-gray-500">Ward: {location.ward_no}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">Phase: {location.project_phase}</div>
                      <div className="text-sm text-gray-500">RFP: {location.rfp_no}</div>
                      <div className="text-sm text-gray-500">Type: {location.location_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">Poles: {location.no_of_pole}</div>
                      <div className="text-sm text-gray-500">Cameras: {location.no_of_cameras}</div>
                      <div className="text-sm text-gray-500">PS Limits: {location.ps_limits}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      <div>Lat: {location.latitude}</div>
                      <div>Lng: {location.longitude}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit Location"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id, location.location)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
              {searchTerm || filterZone || filterType 
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first location'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Phase *
                  </label>
                  <input
                    type="text"
                    value={formData.project_phase}
                    onChange={(e) => setFormData({ ...formData, project_phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project phase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type *
                  </label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select location type</option>
                    <option value="street_lighting">Street Lighting</option>
                    <option value="traffic_signal">Traffic Signal</option>
                    <option value="cctv_surveillance">CCTV Surveillance</option>
                    <option value="smart_parking">Smart Parking</option>
                    <option value="environmental_monitoring">Environmental Monitoring</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFP Number *
                  </label>
                  <input
                    type="text"
                    value={formData.rfp_no}
                    onChange={(e) => setFormData({ ...formData, rfp_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter RFP number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone *
                  </label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter zone"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter location name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ward Number
                  </label>
                  <input
                    type="text"
                    value={formData.ward_no}
                    onChange={(e) => setFormData({ ...formData, ward_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ward number"
                  />
                </div>
              </div>

              {/* Infrastructure Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PS Limits
                  </label>
                  <input
                    type="text"
                    value={formData.ps_limits}
                    onChange={(e) => setFormData({ ...formData, ps_limits: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter PS limits"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Poles
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_pole}
                    onChange={(e) => setFormData({ ...formData, no_of_pole: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of poles"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pole ID
                  </label>
                  <input
                    type="text"
                    value={formData.pole_id}
                    onChange={(e) => setFormData({ ...formData, pole_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter pole ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JB SL Number
                  </label>
                  <input
                    type="text"
                    value={formData.jb_sl_no}
                    onChange={(e) => setFormData({ ...formData, jb_sl_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter JB SL number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Cameras
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_cameras}
                    onChange={(e) => setFormData({ ...formData, no_of_cameras: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of cameras"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fix Box
                  </label>
                  <input
                    type="number"
                    value={formData.fix_box}
                    onChange={(e) => setFormData({ ...formData, fix_box: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of fix boxes"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PTZ
                  </label>
                  <input
                    type="number"
                    value={formData.ptz}
                    onChange={(e) => setFormData({ ...formData, ptz: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of PTZ cameras"
                    min="0"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter latitude"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter longitude"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingLocation ? 'Update Location' : 'Create Location')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}