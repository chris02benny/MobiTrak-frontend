import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useProfilePicture } from '../hooks/useProfilePicture';
// Notifications disabled until API implemented
import {
  User,
  Settings,
  LogOut,
  Crown
} from 'lucide-react';

const ResponsiveNavbar = ({ title = "mobiTrak" }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const { user, userRole, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const { profilePicture } = useProfilePicture();
  
  // Debug log
  useEffect(() => {
    console.log('ResponsiveNavbar - Profile picture state:', profilePicture);
  }, [profilePicture]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isProfileDropdownOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isProfileDropdownOpen]);

  // Keep dropdown anchored correctly while scrolling
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleScroll = () => {
      calculateDropdownPosition();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileDropdownOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Successfully signed out', 'success');
      navigate('/');
    } catch (error) {
      showToast('Error signing out', 'error');
    }
    setIsProfileDropdownOpen(false);
  };

  const calculateDropdownPosition = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({
        // For position: fixed, use viewport coordinates (no scrollY)
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Align right edge with button
      });
    }
  };

  const toggleProfileDropdown = () => {
    if (!isProfileDropdownOpen) {
      calculateDropdownPosition();
    }
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 py-2 lg:left-64 lg:w-[calc(100%-16rem)]">
        <div className="max-w-7xl mx-auto">
          <div className="enterprise-navbar rounded-2xl shadow-lg border border-gray-600/50 backdrop-blur-md overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 relative rounded-2xl">
              <div className="flex justify-between items-center h-14">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center"
                >
                  <span className="text-2xl font-bold text-primary">mobiTrak</span>
                </motion.div>

                {/* Right side items */}
                <div className="flex items-center space-x-4">
                  {user ? (
                    <>
                      {/* Upgrade button for business users */}
                      {userRole === 'business' && (
                        <motion.button
                          onClick={() => navigate('/business/subscription')}
                          className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-primary to-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:from-yellow-400 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Crown className="w-4 h-4" />
                          <span>Upgrade</span>
                        </motion.button>
                      )}
                      
                      {/* Notifications removed */}
                      
                      {/* Profile dropdown for desktop */}
                      <div className="hidden md:block relative z-50" ref={profileRef}>
                        <button
                          onClick={toggleProfileDropdown}
                          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                            {profilePicture?.url ? (
                              <img 
                                src={profilePicture.url} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-black font-semibold text-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm">{profilePicture?.name || user?.email?.split('@')[0]}</span>
                        </button>

                        {/* Dropdown will be rendered outside navbar */}
                      </div>

                      {/* Mobile profile button */}
                      <div className="md:hidden">
                        <button
                          onClick={toggleProfileDropdown}
                          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        >
                          {profilePicture?.url ? (
                            <img 
                              src={profilePicture.url} 
                              alt="Profile" 
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <User size={20} />
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="enterprise-button"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {isProfileDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[60] bg-gray-800 border border-gray-600 rounded-lg shadow-xl min-w-[200px]"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
            }}
          >
            <div className="p-2">
              <div className="px-4 py-3 border-b border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    {profilePicture?.url ? (
                      <img 
                        src={profilePicture.url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-black font-semibold text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{profilePicture?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <hr className="my-1 border-gray-600" />
              <button
                onClick={() => {
                  handleSignOut();
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResponsiveNavbar;
