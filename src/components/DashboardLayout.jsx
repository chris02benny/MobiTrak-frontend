import React from 'react';
import { motion } from 'framer-motion';
import ResponsiveNavbar from './ResponsiveNavbar';
import StickySidebar from './StickySidebar';

const DashboardLayout = ({ children, title, sidebarItems = [] }) => {

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      {/* Sticky Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <StickySidebar sidebarItems={sidebarItems} />
      </div>

      {/* Responsive Navbar */}
      <ResponsiveNavbar title={title} />

      {/* Main Content */}
      <main className="lg:ml-64 pt-24 px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
