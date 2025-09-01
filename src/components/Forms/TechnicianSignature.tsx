import React, { useState, useRef } from 'react';
import { Pen, RotateCcw, Save, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TechnicianSignatureProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function TechnicianSignature({ data, onUpdate }: TechnicianSignatureProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!data.tech_signature);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onUpdate({ tech_signature: null });
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    setHasSignature(true);
    onUpdate({ 
      tech_signature: signatureData,
      tech_engineer: user?.full_name || '',
      tech_mobile: user?.mobile || ''
    });
  };

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp lines
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Set drawing properties for smooth lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';

    // Smooth out the drawing
    ctx.imageSmoothingEnabled = true;

    // Load existing signature if available
    if (data.tech_signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = data.tech_signature;
    }
  }, [data.tech_signature]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Technician Signature</h2>
      
      {/* Technician Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Technician Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician Name *
            </label>
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                value={data.tech_engineer || user?.full_name || ''}
                onChange={(e) => onUpdate({ tech_engineer: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter technician name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number *
            </label>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="tel"
                value={data.tech_mobile || user?.mobile || ''}
                onChange={(e) => onUpdate({ tech_mobile: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mobile number"
                pattern="[0-9]{10}"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Digital Signature *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please sign below to confirm the completion of service work. This signature will be saved with your report.
        </p>
        
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="w-full h-48 border border-gray-200 rounded cursor-crosshair touch-none"
            style={{ 
              touchAction: 'none',
              width: '100%',
              height: '192px'
            }}
          />
          
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              Click and drag to sign • Touch and drag on mobile devices
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </button>

          <button
            type="button"
            onClick={saveSignature}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Signature
          </button>
        </div>

        {hasSignature && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Signature saved successfully
            </div>
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Your signature confirms the completion and accuracy of the service work</li>
          <li>• After submission, this report will be sent to your Team Leader for review</li>
          <li>• Your Team Leader will add their signature during the approval process</li>
          <li>• Ensure all contact information is accurate for future reference</li>
          <li>• Once submitted, you cannot modify the signature</li>
        </ul>
      </div>

      {/* Team Leader Signature Section (Read-only for technicians) */}
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Team Leader Signature</h3>
        <p className="text-sm text-gray-600 mb-4">
          This section will be completed by your Team Leader during the approval process.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Leader Name
            </label>
            <input
              type="text"
              value=""
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              placeholder="Will be filled during approval"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Leader Mobile
            </label>
            <input
              type="tel"
              value=""
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              placeholder="Will be filled during approval"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Signature
          </label>
          <div className="w-full h-32 border border-gray-200 rounded-lg bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Team Leader will sign during approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}
