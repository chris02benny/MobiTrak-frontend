import React from 'react';
import { motion } from 'framer-motion';
import ResponsiveNavbar from './ResponsiveNavbar';

const ResponsiveLayout = ({ children, title, className = "" }) => {
  return (
    <div className="min-h-screen bg-bgBlack text-white">
      {/* Responsive Navbar */}
      <ResponsiveNavbar title={title} />
      
      {/* Main Content */}
      <main className={`pt-24 px-4 sm:px-6 lg:px-8 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[calc(100vh-6rem)]"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
