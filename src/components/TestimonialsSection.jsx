import React from 'react'
import { motion } from 'framer-motion'

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fleet Manager",
      company: "LogiTech Solutions",
      content: "mobiTrak has revolutionized our fleet operations. The real-time tracking and analytics have improved our efficiency by 40%.",
      avatar: "👩‍💼",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Operations Director",
      company: "Urban Delivery Co.",
      content: "The platform is intuitive and powerful. Our drivers love the mobile app, and we've reduced fuel costs significantly.",
      avatar: "👨‍💼",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "CEO",
      company: "Swift Transport",
      content: "Outstanding customer support and feature-rich platform. mobiTrak has become an essential part of our daily operations.",
      avatar: "👩‍💻",
      rating: 5
    }
  ]

  return (
    <section className="py-20 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            Customer Success Stories
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what industry leaders have to say about mobiTrak.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="enterprise-card p-8 hover:scale-105 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                {/* Rating Stars */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-primary text-xl">★</span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-300 mb-6 text-lg leading-relaxed group-hover:text-white transition-colors duration-300">
                  "{testimonial.content}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4 text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-primary transition-colors duration-300">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Quote Mark */}
              <div className="absolute top-4 right-4 text-6xl text-primary/10 group-hover:text-primary/20 transition-colors duration-300">
                "
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-8">Trusted by companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Company Logos Placeholder */}
            <div className="enterprise-card p-4 w-32 h-16 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Company A</span>
            </div>
            <div className="enterprise-card p-4 w-32 h-16 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Company B</span>
            </div>
            <div className="enterprise-card p-4 w-32 h-16 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Company C</span>
            </div>
            <div className="enterprise-card p-4 w-32 h-16 flex items-center justify-center">
              <span className="text-gray-400 font-semibold">Company D</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TestimonialsSection
