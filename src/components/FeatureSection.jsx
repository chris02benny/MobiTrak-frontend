import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const FeatureSection = ({ 
  label, 
  title, 
  description, 
  ctaText, 
  ctaLink, 
  imagePosition = 'right',
  bgColor = 'transparent',
  icon,
  features = []
}) => {
  const isImageRight = imagePosition === 'right'
  
  return (
    <section className={`py-20 relative ${bgColor}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${!isImageRight ? 'lg:grid-flow-col-dense' : ''}`}>
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageRight ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={`${!isImageRight ? 'lg:col-start-2' : ''}`}
          >
            {label && (
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                {label}
              </span>
            )}
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
              {title}
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {description}
            </p>

            {/* Feature List */}
            {features.length > 0 && (
              <div className="mb-8 space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            )}
            
            {ctaText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                {ctaLink ? (
                  <Link
                    to={ctaLink}
                    className="group enterprise-button px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300 inline-flex items-center"
                  >
                    {ctaText}
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                ) : (
                  <button className="group enterprise-button px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300 inline-flex items-center">
                    {ctaText}
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Image/Visual Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageRight ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className={`relative ${!isImageRight ? 'lg:col-start-1' : ''}`}
          >
            <div className="relative group">
              {/* Main Image Card */}
              <div className="enterprise-card p-8 hover:scale-105 transition-all duration-500 group-hover:shadow-2xl">
                <div className="w-full h-80 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Icon or Placeholder */}
                  <div className="text-8xl opacity-50 group-hover:opacity-70 transition-opacity duration-300">
                    {icon || '🚗'}
                  </div>
                  
                  {/* Overlay Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                  <div className="absolute bottom-6 left-6 w-3 h-3 bg-primary/60 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                
                {/* Card Footer */}
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Feature Preview</h3>
                  <p className="text-gray-400 text-sm">Interactive dashboard mockup</p>
                </div>
              </div>

              {/* Floating Accent Cards */}
              <div className="absolute -top-6 -right-6 w-24 h-24 enterprise-card p-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-full bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-20 h-20 enterprise-card p-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-full bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 bg-primary/5 rounded-lg blur-3xl -z-10 group-hover:bg-primary/10 transition-colors duration-500"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
