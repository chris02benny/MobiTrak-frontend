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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`enterprise-card p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group ${className}`}
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
          <div className="text-2xl text-[#fabb24] ml-4 group-hover:text-[#facc4d] transition-colors duration-200">
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
