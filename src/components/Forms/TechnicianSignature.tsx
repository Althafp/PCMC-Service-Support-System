import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TechnicianSignatureProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function TechnicianSignature({ data, onUpdate }: TechnicianSignatureProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);

  // Auto-fill technician details and load signature from profile
  useEffect(() => {
    if (user) {
      // Auto-fill name and mobile
      onUpdate({
        tech_engineer: user.full_name,
        tech_mobile: user.mobile || '',
        technician_id: user.id
      });

      // Fetch signature directly from database
      const fetchSignature = async () => {
        console.log('🔍 Fetching signature from database for user:', user.id);
        const { data: userData, error } = await supabase
          .from('users')
          .select('signature')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('❌ Error fetching signature from database:', error);
          return;
        }
        
        console.log('📊 Database signature query result:', userData);
        const userSignature = userData?.signature || (user as any).signature;
        
        if (userSignature && !data.tech_signature) {
          console.log('✅ Signature found! Length:', userSignature.length);
          console.log('📝 Loading signature after delay...');
          
          // Wait for canvas to be mounted and ready
          setTimeout(() => {
            loadSignatureFromProfile(userSignature);
          }, 200);
        } else if (data.tech_signature) {
          console.log('ℹ️ Using signature from draft/report data');
        } else {
          console.log('ℹ️ No signature found');
        }
      };
      
      fetchSignature();
    }
  }, [user]);

  // Load saved signature if continuing draft
  useEffect(() => {
    if (data.tech_signature && canvasRef.current && !hasSignature) {
      console.log('📝 Loading signature from draft...');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          console.log('✅ Draft signature loaded, dimensions:', img.width, 'x', img.height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Scale image to fit canvas
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          console.log('✅ Draft signature displayed on canvas');
          setHasSignature(true);
          setSignatureLoaded(true);
        };
        img.onerror = (error) => {
          console.error('❌ Error loading draft signature:', error);
          console.log('Signature data:', data.tech_signature?.substring(0, 100));
        };
        img.src = data.tech_signature;
      }
    }
  }, [data.tech_signature]);

  const loadSignatureFromProfile = (signatureData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not ready for signature loading');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context not available');
      return;
    }

    console.log('📝 Loading signature from profile...');
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('Signature preview:', signatureData?.substring(0, 50) + '...');

    const img = new Image();
    img.onload = () => {
      console.log('✅ Signature image loaded, size:', img.width, 'x', img.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      console.log('Drawing at position:', x, y, 'with scale:', scale);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      console.log('✅ Signature displayed on canvas');
      
      setHasSignature(true);
      setSignatureLoaded(true);
      
      // Save to form data
      onUpdate({ tech_signature: signatureData });
    };
    img.onerror = (error) => {
      console.error('❌ Error loading signature image:', error);
      console.log('Signature data:', signatureData?.substring(0, 100));
    };
    
    // Set the image source
    img.src = signatureData;
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
    setHasSignature(true);
    setSignatureLoaded(false); // Mark as custom drawn
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureLoaded(false);
    onUpdate({ tech_signature: null });
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onUpdate({ tech_signature: signatureData });
    alert('Signature saved!');
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
        setHasSignature(true);
    setSignatureLoaded(false);
      };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Step 6: Technician Signature</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engineer Name - Auto-filled, Read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Engineer Name * <span className="text-green-600 text-xs">(Auto-filled from profile)</span>
            </label>
              <input
                type="text"
                value={data.tech_engineer || user?.full_name || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                required
              />
          </div>

        {/* Mobile Number - Auto-filled */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number <span className="text-green-600 text-xs">(Auto-filled from profile)</span>
            </label>
              <input
            type="text"
                value={data.tech_mobile || user?.mobile || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Signature Canvas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technician Signature * 
          {signatureLoaded && (
            <span className="text-green-600 text-xs ml-2">(Auto-loaded from profile)</span>
          )}
        </label>
        
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full border border-gray-200 rounded cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
          <button
            type="button"
            onClick={clearSignature}
                className="flex items-center px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
                <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>

          <button
            type="button"
            onClick={saveSignature}
                disabled={!hasSignature}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
                <Check className="w-4 h-4 mr-1" />
            Save Signature
          </button>
        </div>

        {hasSignature && (
              <span className="text-green-600 text-sm font-medium flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Signature {signatureLoaded ? 'loaded' : 'captured'}
              </span>
            )}
          </div>
        </div>

        {!hasSignature && (
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Please sign above or your profile signature will be used automatically
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ About Signature:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your signature is auto-loaded from your profile</li>
          <li>• You can draw a new signature if needed (temporary for this report only)</li>
          <li>• To permanently update your signature, go to your Profile settings</li>
          <li>• Use mouse or touch to draw your signature</li>
        </ul>
      </div>

      {/* Workflow Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">📋 Signature Workflow:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Step 1:</strong> You (Technician) sign the report before submission</li>
          <li>• <strong>Step 2:</strong> Report is sent to your Team Leader for approval</li>
          <li>• <strong>Step 3:</strong> Team Leader reviews, signs, and approves/rejects</li>
          <li>• <strong>Note:</strong> Team Leader signature will be added during approval process</li>
        </ul>
      </div>
    </div>
  );
}
