import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin } from 'lucide-react';

interface BasicInformationProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BasicInformation({ data, onUpdate }: BasicInformationProps) {
  const [rfpOptions, setRfpOptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const hasInitialized = useRef(false); // Persists across remounts
  const [localComplaintNo, setLocalComplaintNo] = useState(data.complaint_no || '');

  // Fetch RFP options from location_details
  useEffect(() => {
    fetchRfpOptions();
  }, []);

  // Auto-get GPS location on mount
  useEffect(() => {
    if (!data.latitude && !data.longitude) {
      getDeviceLocation();
    }
  }, []);

  // Auto-generate complaint number and date if not set (only once)
  useEffect(() => {
    // Exit if already initialized (prevents React Strict Mode double-run)
    if (hasInitialized.current) {
      console.log('⏭️ Skipping - already initialized');
      return;
    }
    
    // Exit if data already has complaint_no (continuing draft/clone)
    if (data.complaint_no || localComplaintNo) {
      console.log('⏭️ Skipping - complaint number already exists:', data.complaint_no || localComplaintNo);
      hasInitialized.current = true;
      setLocalComplaintNo(data.complaint_no || localComplaintNo);
      return;
    }
    
    console.log('🚀 INITIALIZING form data...');
    const timestamp = Date.now();
    
    // Generate complaint number
    const autoComplaintNo = `COMP-${timestamp}`;
    console.log('✅ AUTO-GENERATING complaint number:', autoComplaintNo);
    
    // Auto-set date to today if not set
    const today = data.date || new Date().toISOString().split('T')[0];
    console.log('✅ AUTO-SETTING date to today:', today);
    
    const updates = {
      complaint_no: autoComplaintNo,
      date: today
    };
    
    // Mark as initialized (ref persists across remounts)
    hasInitialized.current = true;
    setLocalComplaintNo(autoComplaintNo);
    
    // Update parent state
    onUpdate(updates);
    console.log('✅ Updates sent to parent:', updates);
  }, []); // Run only once on mount
  
  // Sync local state with prop changes (for draft/clone)
  useEffect(() => {
    if (data.complaint_no && data.complaint_no !== localComplaintNo) {
      console.log('📥 Syncing complaint number from parent:', data.complaint_no);
      setLocalComplaintNo(data.complaint_no);
    }
  }, [data.complaint_no]);

  const handleChange = (field: string, value: string) => {
    console.log(`📝 Field changed: ${field} = ${value}`);
    if (field === 'complaint_no') {
      setLocalComplaintNo(value);
    }
    onUpdate({ [field]: value });
  };

  const fetchRfpOptions = async () => {
    try {
      const { data: locations, error } = await supabase
        .from('location_details')
        .select('rfp_no, project_phase, zone, location, ward_no, ps_limits, pole_id, jb_sl_no, latitude, longitude')
        .order('rfp_no');

      if (error) throw error;
      setRfpOptions(locations || []);
    } catch (error) {
      console.error('Error fetching RFP options:', error);
    }
  };

  const getDeviceLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude.toFixed(8),
            longitude: position.coords.longitude.toFixed(8)
          };
          console.log('📍 GPS coordinates obtained:', coords);
          console.log('📊 Current data before GPS update:', data);
          onUpdate(coords);
          console.log('✅ GPS coordinates sent to parent');
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get device location. Please enable location services.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  };

  const handleRfpSelect = (rfpNo: string) => {
    const selectedLocation = rfpOptions.find(loc => loc.rfp_no === rfpNo);
    if (selectedLocation) {
      // Update all fields from location_details
      onUpdate({
        rfp_no: rfpNo,
        // Auto-fill Step 2 fields from location_details
        project_phase: selectedLocation.project_phase,
        zone: selectedLocation.zone,
        location: selectedLocation.location,
        ward_no: selectedLocation.ward_no,
        ps_limits: selectedLocation.ps_limits,
        pole_id: selectedLocation.pole_id,
        jb_sl_no: selectedLocation.jb_sl_no,
        location_latitude: selectedLocation.latitude,
        location_longitude: selectedLocation.longitude
      });
    }
  };

  const filteredRfpOptions = rfpOptions.filter(loc =>
    loc.rfp_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Step 1: Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complaint Number - Auto-generated but editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Number *
          </label>
          <input
            type="text"
            value={localComplaintNo}
            onChange={(e) => handleChange('complaint_no', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Auto-generated COMP-{timestamp}"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {localComplaintNo?.startsWith('DRAFT-') ? (
              <span className="text-yellow-600">
                ⚠️ Draft format - Will convert to COMP- format on submit
              </span>
            ) : localComplaintNo ? (
              <span className="text-green-600">✓ {localComplaintNo}</span>
            ) : (
              'Auto-generating...'
            )}
          </p>
        </div>

        {/* RFP Number - Searchable Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RFP Number *
          </label>
          <input
            type="text"
            value={searchTerm || data.rfp_no || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchTerm('')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search RFP number..."
            required
          />
          {searchTerm && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredRfpOptions.length > 0 ? (
                filteredRfpOptions.map((loc) => (
                  <button
                    key={loc.rfp_no}
                    type="button"
                    onClick={() => {
                      handleRfpSelect(loc.rfp_no);
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100"
                  >
                    <div className="font-medium">{loc.rfp_no}</div>
                    <div className="text-sm text-gray-600">{loc.location} - {loc.zone}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No RFP numbers found</div>
              )}
            </div>
          )}
          {data.rfp_no && !searchTerm && (
            <p className="text-xs text-green-600 mt-1">✓ Selected: {data.rfp_no}</p>
          )}
        </div>

        {/* Complaint Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Type *
          </label>
          <select
            value={data.complaint_type || ''}
            onChange={(e) => handleChange('complaint_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select complaint type</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Repair">Repair</option>
            <option value="Installation">Installation</option>
            <option value="Inspection">Inspection</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        {/* System Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Type *
          </label>
          <select
            value={data.system_type || ''}
            onChange={(e) => handleChange('system_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select system type</option>
            <option value="CCTV">CCTV</option>
            <option value="UPS">UPS</option>
            <option value="Network">Network</option>
            <option value="Power Supply">Power Supply</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={data.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            max={new Date().toISOString().split('T')[0]}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.date ? `✓ Date set: ${data.date}` : 'Will auto-set to today if not changed'}
          </p>
        </div>

        {/* Device GPS Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Latitude (GPS) *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={data.latitude || ''}
              onChange={(e) => handleChange('latitude', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto from GPS or type manually"
              required
            />
            <button
              type="button"
              onClick={getDeviceLocation}
              disabled={gettingLocation}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              title="Get current location"
            >
              {gettingLocation ? (
                <span className="text-xs">...</span>
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.latitude ? (
              <span className="text-green-600">✓ {data.latitude}</span>
            ) : (
              'Click GPS button or type manually'
            )}
          </p>
        </div>

        {/* Device GPS Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Longitude (GPS) *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={data.longitude || ''}
              onChange={(e) => handleChange('longitude', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto from GPS or type manually"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.longitude ? (
              <span className="text-green-600">✓ {data.longitude}</span>
            ) : (
              'Will auto-fill with latitude or type manually'
            )}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Complaint number is auto-generated (can be changed)</li>
          <li>• Select RFP number to auto-fill location details in Step 2</li>
          <li>• GPS coordinates: Click <MapPin className="w-3 h-3 inline" /> button for auto-capture or type manually</li>
          <li>• All fields marked with * are required</li>
        </ul>
      </div>
    </div>
  );
}
