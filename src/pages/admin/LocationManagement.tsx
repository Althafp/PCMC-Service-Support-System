import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Search, Edit, Trash2, Filter, Eye, X, Download, Upload, FileSpreadsheet } from 'lucide-react';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

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

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResults(null);
  };

  const exportToExcel = async () => {
    try {
      // Create Excel headers
      const headers = [
        'Project Phase',
        'Location Type',
        'RFP No',
        'Zone',
        'Location',
        'Ward No',
        'PS Limits',
        'No of Pole',
        'Pole ID',
        'JB SL No',
        'No of Cameras',
        'Fix Box',
        'PTZ',
        'Latitude',
        'Longitude'
      ];

      // Create Excel rows
      const excelRows = filteredLocations.map(location => [
        location.project_phase || '',
        location.location_type || '',
        location.rfp_no || '',
        location.zone || '',
        location.location || '',
        location.ward_no || '',
        location.ps_limits || '',
        location.no_of_pole || 0,
        location.pole_id || '',
        location.jb_sl_no || '',
        location.no_of_cameras || 0,
        location.fix_box || 0,
        location.ptz || 0,
        location.latitude || '',
        location.longitude || ''
      ]);

      // Create Excel workbook using SheetJS
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelRows]);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Locations');

      // Generate Excel file and download
      XLSX.writeFile(wb, `locations_export_${new Date().toISOString().split('T')[0]}.xlsx`);

      alert(`Exported ${filteredLocations.length} locations successfully!`);
    } catch (error) {
      console.error('Error exporting locations:', error);
      alert('Error exporting locations. Please try again.');
    }
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) return [];
    
    const headers = jsonData[0] as string[];
    const rows = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (row && row.some(cell => cell !== undefined && cell !== '')) {
        const rowData: any = {};
        headers.forEach((header, index) => {
          if (header) {
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
          }
        });
        rows.push(rowData);
      }
    }
    return rows;
  };

  const handleImport = async () => {
    if (!importFile || !user) return;

    setImportLoading(true);
    setImportResults(null);

    try {
      const rows = await parseExcel(importFile);
      
      const errors: string[] = [];
      let successCount = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because CSV starts from row 2 (after header)

        try {
          // Validate required fields
          if (!row.project_phase || !row.location || !row.zone) {
            errors.push(`Row ${rowNumber}: Missing required fields (Project Phase, Location, Zone)`);
            continue;
          }

          // Prepare location data
          const locationData = {
            project_phase: row.project_phase,
            location_type: row.location_type || '',
            rfp_no: row.rfp_no || '',
            zone: row.zone,
            location: row.location,
            ward_no: row.ward_no || '',
            ps_limits: row.ps_limits || '',
            no_of_pole: parseInt(row.no_of_pole) || 0,
            pole_id: row.pole_id || '',
            jb_sl_no: row.jb_sl_no || '',
            no_of_cameras: parseInt(row.no_of_cameras) || 0,
            fix_box: parseInt(row.fix_box) || 0,
            ptz: parseInt(row.ptz) || 0,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
          };

          // Insert location
          const { error } = await supabase
            .from('location_details')
            .insert([locationData]);

          if (error) {
            errors.push(`Row ${rowNumber}: ${error.message}`);
            continue;
          }

          // Create audit log
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'CREATE',
            table_name: 'location_details',
            record_id: 'bulk_import',
            new_data: locationData,
          });

          successCount++;
        } catch (error: any) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      setImportResults({
        success: successCount,
        errors: errors
      });

      if (successCount > 0) {
        fetchLocations(); // Refresh the locations list
      }

    } catch (error) {
      console.error('Error importing locations:', error);
      setImportResults({
        success: 0,
        errors: ['Failed to process the file. Please check the file format and ensure it\'s a valid Excel file.']
      });
    } finally {
      setImportLoading(false);
    }
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
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Location
          </button>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Bulk Import Locations (Excel)</h2>
              </div>
              <button
                onClick={closeImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!importResults ? (
                <>
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Download the Excel template using the Export button first</li>
                      <li>• Fill in the location details in the Excel file</li>
                      <li>• Required fields: Project Phase, Location, Zone</li>
                      <li>• Numeric fields: No of Pole, No of Cameras, Fix Box, PTZ, Latitude, Longitude</li>
                      <li>• Upload the completed Excel file below (.xlsx format)</li>
                    </ul>
                  </div>

                  {/* File Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Excel File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label
                        htmlFor="excel-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {importFile ? importFile.name : 'Click to select Excel file'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Only Excel files (.xlsx, .xls) are supported
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={closeImportModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || importLoading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{importLoading ? 'Importing...' : 'Import Locations'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Results */}
                  <div className="text-center py-8">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      importResults.success > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {importResults.success > 0 ? (
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${
                      importResults.success > 0 ? 'text-green-900' : 'text-red-900'
                    }`}>
                      Import {importResults.success > 0 ? 'Successful' : 'Failed'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {importResults.success} locations imported successfully
                    </p>

                    {importResults.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                        <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <div key={index} className="mb-1">• {error}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={closeImportModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}