import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Home,
  Car,
  Users,
  BarChart3,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Phone,
  Info,
  ExternalLink,
  Crown
} from 'lucide-react';

const ResponsiveNavbar = ({ title = "mobiTrak" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const { user, userRole, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
      const scrollY = window.scrollY;
      setDropdownPosition({
        top: rect.bottom + scrollY + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Align right edge with button
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProfileDropdown = () => {
    if (!isProfileDropdownOpen) {
      calculateDropdownPosition();
    }
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: Home,
        description: 'Overview and main dashboard',
        onClick: () => navigate(`/dashboard/${userRole}`),
        highlighted: false
      }
    ];

    if (userRole === 'business') {
      return [
        ...commonItems,
        {
          id: 'fleet',
          title: 'Fleet Management',
          icon: Car,
          description: 'Manage your vehicle fleet',
          onClick: () => navigate('/business/vehicles'),
          highlighted: false
        },
        {
          id: 'drivers',
          title: 'Driver Management',
          icon: Users,
          description: 'Manage your drivers',
          onClick: () => navigate('/business/drivers'),
          highlighted: false
        },
        {
          id: 'analytics',
          title: 'Analytics & Reports',
          icon: BarChart3,
          description: 'View business analytics',
          onClick: () => showToast('Analytics coming soon!', 'info'),
          highlighted: false
        },
        {
          id: 'subscription',
          title: 'Upgrade Plan',
          icon: Crown,
          description: 'Manage your subscription',
          onClick: () => navigate('/business/subscription'),
          highlighted: true
        }
      ];
    }

    if (userRole === 'driver') {
      return [
        ...commonItems,
        {
          id: 'trips',
          title: 'My Trips',
          icon: MapPin,
          description: 'View and manage your trips',
          onClick: () => showToast('Trips feature coming soon!', 'info'),
          highlighted: false
        },
        {
          id: 'schedule',
          title: 'Schedule',
          icon: Calendar,
          description: 'Manage your availability',
          onClick: () => showToast('Schedule feature coming soon!', 'info'),
          highlighted: false
        },
        {
          id: 'earnings',
          title: 'Earnings',
          icon: CreditCard,
          description: 'Track your earnings',
          onClick: () => showToast('Earnings feature coming soon!', 'info'),
          highlighted: false
        }
      ];
    }

    if (userRole === 'customer') {
      return [
        ...commonItems,
        {
          id: 'bookings',
          title: 'My Bookings',
          icon: Calendar,
          description: 'View your ride bookings',
          onClick: () => showToast('Bookings feature coming soon!', 'info'),
          highlighted: false
        },
        {
          id: 'vehicles',
          title: 'Available Vehicles',
          icon: Truck,
          description: 'Browse available vehicles',
          onClick: () => showToast('Vehicle browsing coming soon!', 'info'),
          highlighted: false
        }
      ];
    }

    return commonItems;
  };

  const specialItems = [
    {
      id: 'profile',
      title: 'Complete Profile',
      icon: User,
      description: 'Complete your profile setup',
      onClick: () => navigate('/profile'),
      highlighted: true,
      bgColor: 'bg-primary'
    },
    {
      id: 'support',
      title: 'Customer Support',
      icon: Phone,
      description: 'Get help and support',
      onClick: () => showToast('Support feature coming soon!', 'info'),
      highlighted: true,
      bgColor: 'bg-blue-600'
    }
  ];

  const quickLinks = [
    {
      id: 'about',
      title: 'About mobiTrak',
      icon: Info,
      description: 'Learn more about our platform',
      onClick: () => navigate('/'),
      external: false
    },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: Phone,
      description: 'Get in touch with our team',
      onClick: () => showToast('Contact feature coming soon!', 'info'),
      external: false
    }
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 py-2">
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

                {/* Desktop Navigation Items - Removed Dashboard and Profile */}
                <div className="hidden md:flex items-center space-x-8">
                  {/* Navigation items removed as requested */}
                </div>

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
                      {/* Profile dropdown for desktop */}
                      <div className="hidden md:block relative z-50" ref={profileRef}>
                        <button
                          onClick={toggleProfileDropdown}
                          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-semibold text-sm">
                            {user?.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{user?.email?.split('@')[0]}</span>
                        </button>

                        {/* Dropdown will be rendered outside navbar */}
                      </div>

                      {/* Mobile Upgrade button for business users */}
                      {userRole === 'business' && (
                        <motion.button
                          onClick={() => navigate('/business/subscription')}
                          className="md:hidden p-2 bg-gradient-to-r from-primary to-yellow-400 text-black rounded-lg hover:from-yellow-400 hover:to-primary transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Upgrade Plan"
                        >
                          <Crown size={20} />
                        </motion.button>
                      )}

                      {/* Hamburger menu button */}
                      <button
                        onClick={toggleSidebar}
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        aria-label="Open menu"
                      >
                        <Menu size={24} />
                      </button>
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

      {/* Profile Dropdown - Outside navbar to avoid clipping */}
      <AnimatePresence>
        {isProfileDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="profile-dropdown fixed w-48 enterprise-card rounded-lg shadow-xl border border-gray-600/50 z-[99999]"
            style={{
              zIndex: 99999,
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <div className="py-2">
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-black transition-colors flex items-center space-x-2"
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  showToast('Settings coming soon!', 'info');
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-black transition-colors flex items-center space-x-2"
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

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              ref={sidebarRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 sm:w-96 enterprise-card border-l border-gray-600 z-[70] overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-primary">mobiTrak</div>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>
                {user && (
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user?.email?.split('@')[0]}</p>
                      <p className="text-gray-400 text-sm capitalize">{userRole} Account</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              {user && (
                <div className="p-6">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">
                    Navigation
                  </h3>
                  <div className="space-y-2">
                    {getNavigationItems().map((item) => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-all duration-200 group ${
                          item.highlighted
                            ? 'bg-gradient-to-r from-primary/20 to-yellow-400/20 text-white border border-primary/30 hover:from-primary/30 hover:to-yellow-400/30'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${
                          item.highlighted
                            ? 'bg-gradient-to-r from-primary to-yellow-400 text-black'
                            : 'bg-gray-700 group-hover:bg-gray-600'
                        }`}>
                          <item.icon size={20} className={item.highlighted ? '' : 'group-hover:text-primary transition-colors'} />
                        </div>
                        <div>
                          <p className={`font-medium ${item.highlighted ? 'text-white' : ''}`}>{item.title}</p>
                          <p className={`text-xs ${item.highlighted ? 'text-gray-200' : 'text-gray-500'}`}>{item.description}</p>
                        </div>
                        {item.highlighted && (
                          <div className="ml-auto">
                            <Crown className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Items */}
              {user && (
                <div className="px-6 pb-6">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {specialItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center space-x-3 p-4 text-left text-white rounded-lg transition-all duration-200 ${item.bgColor} hover:opacity-90`}
                      >
                        <item.icon size={20} />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs opacity-80">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="px-6 pb-6">
                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  {quickLinks.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between p-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon size={18} />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      {item.external && <ExternalLink size={16} className="text-gray-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Actions (Mobile) */}
              {user && (
                <div className="px-6 pb-6 border-t border-gray-600 pt-6">
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                      <User size={18} />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast('Settings coming soon!', 'info');
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                      <Settings size={18} />
                      <span>App Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResponsiveNavbar;
