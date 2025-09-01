import React, { useRef, useEffect, useState } from 'react';
import { PenTool, Check, X, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DigitalSignaturesProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function DigitalSignatures({ data, onUpdate }: DigitalSignaturesProps) {
  const { user } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  const openSignatureModal = (field: string) => {
    setCurrentSignatureField(field);
    setShowSignatureModal(true);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    setCurrentSignatureField(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1f2937';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const saveSignature = () => {
    if (!currentSignatureField || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    onUpdate({ [currentSignatureField]: dataURL });
    closeSignatureModal();
  };

  const isTeamLeader = user?.role === 'team_leader';
  const isTechnical = user?.role === 'technician' || user?.role === 'technical_executive';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Digital Signatures</h2>
      <p className="text-gray-600">Capture digital signatures from the technician and team leader</p>

      {/* Team Leader Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Team Leader Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Leader Name *
            </label>
            <input
              type="text"
              value={data.tl_name || ''}
              onChange={(e) => handleChange('tl_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter team leader name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Leader Mobile *
            </label>
            <input
              type="tel"
              value={data.tl_mobile || ''}
              onChange={(e) => handleChange('tl_mobile', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter mobile number"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Leader Signature *
          </label>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
            {data.tl_signature ? (
              <div className="space-y-3">
                <img 
                  src={data.tl_signature} 
                  alt="Team Leader Signature" 
                  className="max-w-full h-20 object-contain mx-auto border border-gray-200 rounded"
                />
                <p className="text-sm text-blue-600">Signature captured successfully</p>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onUpdate({ tl_signature: null })}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                  >
                    Clear signature
                  </button>
                  {isTeamLeader && (
                    <button
                      onClick={() => openSignatureModal('tl_signature')}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50"
                    >
                      Re-sign
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <PenTool className="w-8 h-8 mx-auto text-gray-400" />
                <button
                  onClick={() => openSignatureModal('tl_signature')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 rounded border border-blue-300 hover:bg-blue-50"
                >
                  {isTeamLeader ? 'Sign as Team Leader' : 'Capture Team Leader Signature'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Team Leader Approval Section */}
        {isTeamLeader && data.tl_signature && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Report Approval</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Decision *
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => onUpdate({ approval_status: 'approve' })}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      data.approval_status === 'approve'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'
                    }`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => onUpdate({ approval_status: 'reject' })}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      data.approval_status === 'reject'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50'
                    }`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>

              {data.approval_status === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Remarks *
                  </label>
                  <textarea
                    value={data.rejection_remarks || ''}
                    onChange={(e) => handleChange('rejection_remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide detailed reasons for rejection..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {data.approval_status === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={data.approval_notes || ''}
                    onChange={(e) => handleChange('approval_notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Any additional notes or comments..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Engineer Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-4">Technical Engineer Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Engineer Name *
            </label>
            <input
              type="text"
              value={data.tech_engineer || ''}
              onChange={(e) => handleChange('tech_engineer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter technical engineer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Engineer Mobile *
            </label>
            <input
              type="tel"
              value={data.tech_mobile || ''}
              onChange={(e) => handleChange('tech_mobile', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter mobile number"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technical Engineer Signature *
          </label>
          <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
            {data.tech_signature ? (
              <div className="space-y-3">
                <img 
                  src={data.tech_signature} 
                  alt="Technical Engineer Signature" 
                  className="max-w-full h-20 object-contain mx-auto border border-gray-200 rounded"
                />
                <p className="text-sm text-green-600">Signature captured successfully</p>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onUpdate({ tech_signature: null })}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                  >
                    Clear signature
                  </button>
                  {isTechnical && (
                    <button
                      onClick={() => openSignatureModal('tech_signature')}
                      className="text-sm text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50"
                    >
                      Re-sign
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <PenTool className="w-8 h-8 mx-auto text-gray-400" />
                <button
                  onClick={() => openSignatureModal('tech_signature')}
                  className="text-sm font-medium text-green-600 hover:text-green-700 px-4 py-2 rounded border border-green-300 hover:bg-green-50"
                >
                  {isTechnical ? 'Sign as Technical Engineer' : 'Capture Technical Engineer Signature'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentSignatureField === 'tl_signature' ? 'Team Leader' : 'Technical Engineer'} Signature
            </h3>
            
            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full h-48 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={clearSignature}
                className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={closeSignatureModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Both signatures are required before submitting the report</li>
          <li>• Team Leader must approve or reject the report after signing</li>
          <li>• If rejected, detailed remarks are required</li>
          <li>• Ensure all contact information is accurate</li>
          <li>• Signatures confirm the completion and accuracy of the service work</li>
        </ul>
      </div>
    </div>
  );
}