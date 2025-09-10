import React from 'react'
import { motion } from 'framer-motion'

const StatsSection = () => {
  const stats = [
    {
      number: "500+",
      label: "Active Fleets",
      description: "Businesses trust our platform",
      icon: "🚛"
    },
    {
      number: "10K+",
      label: "Vehicles Tracked",
      description: "Real-time monitoring daily",
      icon: "🗺️"
    },
    {
      number: "99.9%",
      label: "Uptime",
      description: "Reliable service guarantee",
      icon: "⚡"
    },
    {
      number: "24/7",
      label: "Support",
      description: "Always here to help",
      icon: "🛟"
    }
  ]

  return (
    <section className="py-20 relative bg-gray-900/50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            Trusted by Industry Leaders
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Numbers That Speak for Themselves
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of businesses that have transformed their fleet operations with mobiTrak
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="enterprise-card p-8 hover:scale-105 transition-all duration-300 hover:bg-white/10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:text-white transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="enterprise-card p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Join Our Growing Community?
            </h3>
            <p className="text-gray-300 mb-6">
              Start your free trial today and see why industry leaders choose mobiTrak for their fleet management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="enterprise-button px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300">
                Start Free Trial
              </button>
              <button className="enterprise-button-secondary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection
