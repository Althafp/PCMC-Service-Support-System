import React from 'react';
import { MapPin, CheckCircle } from 'lucide-react';

interface LocationDetailsProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function LocationDetails({ data, onUpdate }: LocationDetailsProps) {
  const isAutoFilled = !!data.rfp_no;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Step 2: Location Details</h2>
        {isAutoFilled && (
          <span className="flex items-center text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-1" />
            Auto-filled from RFP: {data.rfp_no}
          </span>
        )}
      </div>

      {!isAutoFilled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Please select an RFP Number in Step 1 to auto-fill these location details.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Phase - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Phase * {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.project_phase || ''}
            onChange={(e) => onUpdate({ project_phase: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            required
            readOnly={isAutoFilled}
          />
        </div>

        {/* Zone - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zone * {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.zone || ''}
            onChange={(e) => onUpdate({ zone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            required
            readOnly={isAutoFilled}
          />
        </div>

        {/* Location - Auto-filled */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location * {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            required
            readOnly={isAutoFilled}
          />
        </div>

        {/* Ward Number - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ward Number {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.ward_no || ''}
            onChange={(e) => onUpdate({ ward_no: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            readOnly={isAutoFilled}
          />
        </div>

        {/* PS Limits - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PS Limits {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.ps_limits || ''}
            onChange={(e) => onUpdate({ ps_limits: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            readOnly={isAutoFilled}
          />
        </div>

        {/* Pole ID - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pole ID {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.pole_id || ''}
            onChange={(e) => onUpdate({ pole_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            readOnly={isAutoFilled}
          />
        </div>

        {/* JB SL Number - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JB SL Number {isAutoFilled && <span className="text-green-600 text-xs">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.jb_sl_no || ''}
            onChange={(e) => onUpdate({ jb_sl_no: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            placeholder="Will auto-fill from RFP"
            readOnly={isAutoFilled}
          />
        </div>

        {/* Location Latitude (from DB) - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Location Latitude (DB) {isAutoFilled && <span className="text-green-600 text-xs ml-1">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.location_latitude || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            placeholder="From location_details table"
          />
          <p className="text-xs text-gray-500 mt-1">From location_details table</p>
        </div>

        {/* Location Longitude (from DB) - Auto-filled */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Location Longitude (DB) {isAutoFilled && <span className="text-green-600 text-xs ml-1">(Auto-filled)</span>}
          </label>
          <input
            type="text"
            value={data.location_longitude || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
            placeholder="From location_details table"
          />
          <p className="text-xs text-gray-500 mt-1">From location_details table</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ About Location Details:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All fields are auto-filled when you select an RFP Number in Step 1</li>
          <li>• Location coordinates are from the location_details database table</li>
          <li>• Device GPS (Step 1) = Where you are now</li>
          <li>• Location GPS (Step 2) = Where the equipment is installed</li>
        </ul>
      </div>
    </div>
  );
}
