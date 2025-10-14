import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { businessSidebarItems } from '../../config/businessSidebarConfig';

const BusinessProfilePage = () => {
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const imageRef = useRef(null);
  const cropContainerRef = useRef(null);
  const [cropCircleSize, setCropCircleSize] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  const previewSize = 512; // output square size

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const updateCircleSize = useCallback(() => {
    const el = cropContainerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const base = Math.min(w, h);
    const size = Math.max(160, Math.min(360, Math.floor(base * 0.8)));
    setCropCircleSize(size);
  }, []);

  useEffect(() => {
    if (showCropper) {
      updateCircleSize();
      const onResize = () => updateCircleSize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [showCropper, updateCircleSize]);

  const clampOffsets = useCallback(() => {
    const img = imageRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const drawW = naturalW * cropZoom;
    const drawH = naturalH * cropZoom;
    const radius = cropCircleSize / 2;
    const centerX = 0; // offsets are applied relative to center
    const centerY = 0;
    const minX = - (drawW / 2 - radius);
    const maxX =   (drawW / 2 - radius);
    const minY = - (drawH / 2 - radius);
    const maxY =   (drawH / 2 - radius);
    setCropX(prev => clamp(prev, minX, maxX));
    setCropY(prev => clamp(prev, minY, maxY));
  }, [cropZoom, cropCircleSize]);

  useEffect(() => {
    if (showCropper) clampOffsets();
  }, [cropZoom, cropCircleSize, showCropper, clampOffsets]);
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching business profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('business_profiles')
        .select('business_name, business_email, business_phone, business_address, bio, profile_picture_url, profile_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business profile:', error);
        throw error;
      }

      if (data) {
        console.log('Business profile found:', data);
        setBusinessName(data.business_name || '');
        setBusinessEmail(data.business_email || '');
        setBusinessPhone(data.business_phone || '');
        setBusinessAddress(data.business_address || '');
        setBio(data.bio || '');
        setProfilePictureUrl(data.profile_picture_url || '');
        setProfileComplete(data.profile_complete || false);
      } else {
        console.log('No business profile found, creating one...');
        // No profile exists yet, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('business_profiles')
          .insert([{ 
            user_id: user.id,
            business_name: '',
            business_email: user.email || '',
            business_phone: '',
            business_address: '',
            bio: '',
            profile_picture_url: '',
            profile_complete: false
          }])
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating business profile:', insertError);
          showToast(`Failed to create business profile: ${insertError.message}`, 'error');
        } else {
          console.log('Business profile created successfully:', newProfile);
          // Set the form fields with the new profile data
          setBusinessName(newProfile.business_name || '');
          setBusinessEmail(newProfile.business_email || '');
          setBusinessPhone(newProfile.business_phone || '');
          setBusinessAddress(newProfile.business_address || '');
          setBio(newProfile.bio || '');
          setProfilePictureUrl(newProfile.profile_picture_url || '');
          setProfileComplete(newProfile.profile_complete || false);
        }
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      showToast(`Failed to load business profile: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: businessName,
          business_email: businessEmail,
          business_phone: businessPhone,
          business_address: businessAddress,
          bio: bio,
          profile_picture_url: profilePictureUrl || null
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update profile completion status
      const isComplete = businessName && businessEmail && businessPhone && businessAddress;
      if (isComplete) {
        await supabase
          .from('business_profiles')
          .update({ profile_complete: true })
          .eq('user_id', user.id);
      }

      showToast('Business profile updated successfully!', 'success');
      navigate('/dashboard/business');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <DashboardLayout title="Business Profile" sidebarItems={businessSidebarItems}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="enterprise-card p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary text-black p-2 rounded-full cursor-pointer shadow-md" aria-label="Upload profile image">
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropImageSrc(reader.result?.toString() || '');
                      setCropZoom(1);
                      setCropX(0);
                      setCropY(0);
                      setShowCropper(true);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{businessName || user?.email}</h1>
              <p className="text-gray-400 capitalize">{userRole} Account</p>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${profileComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${profileComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                  {profileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Profile Form */}
        <div className="enterprise-card p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Business Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-gray-300 text-sm font-bold mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  className="enterprise-input w-full"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Legal business name</p>
              </div>

              {/* Business Phone */}
              <div>
                <label htmlFor="businessPhone" className="block text-gray-300 text-sm font-bold mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  id="businessPhone"
                  className="enterprise-input w-full"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="Enter business phone number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Primary business contact number</p>
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label htmlFor="businessEmail" className="block text-gray-300 text-sm font-bold mb-2">
                Business Email *
              </label>
              <input
                type="email"
                id="businessEmail"
                className="enterprise-input w-full"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="Enter business email address"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Official business email</p>
            </div>

            {/* Business Address */}
            <div>
              <label htmlFor="businessAddress" className="block text-gray-300 text-sm font-bold mb-2">
                Business Address *
              </label>
              <input
                type="text"
                id="businessAddress"
                className="enterprise-input w-full"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Enter complete business address"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Primary business location</p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                className="enterprise-input w-full h-28 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your business (max 500 chars)"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                className="enterprise-button flex-1 py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                    Updating Profile...
                  </div>
                ) : (
                  'Update Business Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/business')}
                className="enterprise-button-secondary flex-1 py-3"
                disabled={loading}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>

        {/* Image Cropper Modal */}
        {showCropper && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
            <div className="bg-gray-900 w-full max-w-xl rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Adjust profile photo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  <div
                    ref={cropContainerRef}
                    className="w-full aspect-square bg-black relative rounded-lg overflow-hidden touch-none select-none"
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = -e.deltaY / 500;
                      setCropZoom((z) => clamp(z + delta, 1, 4));
                    }}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      dragStartRef.current = { x: e.clientX, y: e.clientY };
                      posStartRef.current = { x: cropX, y: cropY };
                    }}
                    onMouseMove={(e) => {
                      if (!isDragging) return;
                      const dx = e.clientX - dragStartRef.current.x;
                      const dy = e.clientY - dragStartRef.current.y;
                      setCropX(posStartRef.current.x + dx);
                      setCropY(posStartRef.current.y + dy);
                    }}
                    onMouseUp={() => { setIsDragging(false); clampOffsets(); }}
                    onMouseLeave={() => { if (isDragging) { setIsDragging(false); clampOffsets(); } }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) {
                        const t = e.touches[0];
                        setIsDragging(true);
                        dragStartRef.current = { x: t.clientX, y: t.clientY };
                        posStartRef.current = { x: cropX, y: cropY };
                      } else if (e.touches.length === 2) {
                        pinchRef.current.active = true;
                        const [t1, t2] = e.touches;
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        pinchRef.current.startDist = Math.hypot(dx, dy);
                        pinchRef.current.startZoom = cropZoom;
                      }
                    }}
                    onTouchMove={(e) => {
                      if (pinchRef.current.active && e.touches.length === 2) {
                        e.preventDefault();
                        const [t1, t2] = e.touches;
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        const dist = Math.hypot(dx, dy);
                        const delta = (dist - pinchRef.current.startDist) / 300;
                        setCropZoom(clamp(pinchRef.current.startZoom + delta, 1, 4));
                      } else if (isDragging && e.touches.length === 1) {
                        const t = e.touches[0];
                        const dx = t.clientX - dragStartRef.current.x;
                        const dy = t.clientY - dragStartRef.current.y;
                        setCropX(posStartRef.current.x + dx);
                        setCropY(posStartRef.current.y + dy);
                      }
                    }}
                    onTouchEnd={() => {
                      pinchRef.current.active = false;
                      if (isDragging) { setIsDragging(false); clampOffsets(); }
                    }}
                  >
                    {cropImageSrc && (
                      <img
                        ref={imageRef}
                        src={cropImageSrc}
                        alt="To crop"
                        className="absolute top-1/2 left-1/2 select-none pointer-events-none"
                        style={{
                          transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px)) scale(${cropZoom})`,
                          transformOrigin: 'center',
                          maxWidth: 'none',
                          willChange: 'transform'
                        }}
                      />
                    )}
                    <svg className="absolute inset-0 w-full h-full" aria-hidden>
                      <defs>
                        <mask id="circleMask">
                          <rect x="0" y="0" width="100%" height="100%" fill="white" />
                          <circle cx="50%" cy="50%" r={cropCircleSize / 2} fill="black" />
                        </mask>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#circleMask)" />
                      <circle cx="50%" cy="50%" r={cropCircleSize / 2} fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="w-full mt-4">
                    <label className="text-xs text-gray-400">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.01"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center">
                    {cropImageSrc && (
                      <img
                        src={cropImageSrc}
                        alt="Preview"
                        className="select-none"
                        style={{
                          transform: `translate(${cropX}px, ${cropY}px) scale(${cropZoom})`,
                          transformOrigin: 'center',
                          maxWidth: 'none'
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Preview</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="enterprise-button-secondary px-4 py-2"
                  onClick={() => setShowCropper(false)}
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
                <button
                  className="enterprise-button px-4 py-2 flex items-center gap-2"
                  disabled={uploadingImage}
                  onClick={async () => {
                    if (!cropImageSrc || !user?.id) return;
                    try {
                      setUploadingImage(true);
                      // Draw cropped square to canvas with circular clip (WhatsApp-like)
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      const blob = await new Promise((resolve, reject) => {
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const size = previewSize;
                          canvas.width = size;
                          canvas.height = size;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return reject(new Error('Canvas context not available'));
                          ctx.clearRect(0, 0, size, size);
                          // Circular clip
                          ctx.save();
                          ctx.beginPath();
                          ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
                          ctx.closePath();
                          ctx.clip();
                          const scale = cropZoom;
                          const drawW = img.width * scale;
                          const drawH = img.height * scale;
                          const dx = size/2 - drawW/2 + cropX;
                          const dy = size/2 - drawH/2 + cropY;
                          ctx.drawImage(img, dx, dy, drawW, drawH);
                          ctx.restore();
                          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png', 0.95);
                        };
                        img.onerror = reject;
                        img.src = cropImageSrc;
                      });

                      // Upload blob (PNG to preserve transparent corners)
                      const fileExt = 'png';
                      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from('profile-pictures')
                        .upload(filePath, blob, { contentType: 'image/png', upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: publicData } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(filePath);
                      const publicUrl = publicData?.publicUrl || '';
                      setProfilePictureUrl(publicUrl);
                      await supabase
                        .from('business_profiles')
                        .update({ profile_picture_url: publicUrl })
                        .eq('user_id', user.id);
                      showToast('Profile image updated', 'success');
                      setShowCropper(false);
                    } catch (err) {
                      console.error(err);
                      showToast('Image crop/upload failed', 'error');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfilePage;
