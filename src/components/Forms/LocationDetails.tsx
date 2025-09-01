import React from 'react';

interface LocationDetailsProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function LocationDetails({ data, onUpdate }: LocationDetailsProps) {
  const handleChange = (field: string, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Location Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter location"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ward Number
          </label>
          <input
            type="text"
            value={data.ward_no || ''}
            onChange={(e) => handleChange('ward_no', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter ward number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PS Limits
          </label>
          <input
            type="text"
            value={data.ps_limits || ''}
            onChange={(e) => handleChange('ps_limits', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter PS limits"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pole ID
          </label>
          <input
            type="text"
            value={data.pole_id || ''}
            onChange={(e) => handleChange('pole_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter pole ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RFP Number
          </label>
          <input
            type="text"
            value={data.rfp_no || ''}
            onChange={(e) => handleChange('rfp_no', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter RFP number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JB Serial Number
          </label>
          <input
            type="text"
            value={data.jb_sl_no || ''}
            onChange={(e) => handleChange('jb_sl_no', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter JB serial number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={data.latitude || ''}
            onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
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
            step="0.000001"
            value={data.longitude || ''}
            onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter longitude"
          />
        </div>
      </div>
    </div>
  );
}