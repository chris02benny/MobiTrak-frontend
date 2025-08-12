import React from 'react'
import { motion } from 'framer-motion'

const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  onClick,
  className = "",
  children 
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer group ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-200 mb-1">{title}</h3>
          {value && (
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-3xl text-primary ml-4 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>

      {trend && trendValue && (
        <div className="flex items-center">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {trend === 'up' && '↗'} 
            {trend === 'down' && '↘'} 
            {trend === 'neutral' && '→'} 
            {trendValue}
          </span>
          <span className="text-xs text-gray-500 ml-2">vs last month</span>
        </div>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </motion.div>
  )
}

export default DashboardCard
