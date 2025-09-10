import React from 'react'
import ResponsiveNavbar from '../components/ResponsiveNavbar'
import HeroSection from '../components/HeroSection'
import FeatureSection from '../components/FeatureSection'
import StatsSection from '../components/StatsSection'
import TestimonialsSection from '../components/TestimonialsSection'

const LandingPage = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-bgBlack text-white">
      {/* Responsive Navigation */}
      <ResponsiveNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Feature Section 1 - Fleet Management */}
      <FeatureSection
        label="FLEET MANAGEMENT"
        title="Experience the Best Fleet Control"
        description="Take complete control of your fleet operations with our comprehensive management platform. Monitor vehicle performance, track maintenance schedules, and optimize routes in real-time."
        ctaText="Start Free Trial"
        ctaLink="/register"
        imagePosition="right"
        icon="🚛"
        features={[
          "Real-time vehicle tracking and monitoring",
          "Automated maintenance scheduling and alerts",
          "Advanced route optimization algorithms",
          "Comprehensive performance analytics"
        ]}
      />

      {/* Feature Section 2 - Driver Management */}
      <FeatureSection
        label="DRIVER PORTAL"
        title="Empower Your Drivers with Smart Tools"
        description="Provide your drivers with intuitive tools that enhance their productivity and safety. From route guidance to performance tracking, everything they need is at their fingertips."
        ctaText="Learn More"
        imagePosition="left"
        bgColor="bg-gray-900/30"
        icon="👨‍💼"
        features={[
          "Mobile-first driver application",
          "Turn-by-turn navigation and routing",
          "Digital trip logs and reporting",
          "Performance metrics and rewards"
        ]}
      />

      {/* Stats Section */}
      <StatsSection />

      {/* Feature Section 3 - Customer Experience */}
      <FeatureSection
        label="CUSTOMER EXPERIENCE"
        title="Deliver Exceptional Service Every Time"
        description="Keep your customers informed and satisfied with transparent tracking, accurate ETAs, and seamless communication throughout their journey."
        ctaText="See Demo"
        imagePosition="right"
        icon="👥"
        features={[
          "Real-time shipment tracking for customers",
          "Automated notifications and updates",
          "Customer feedback and rating system",
          "Transparent pricing and billing"
        ]}
      />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* About Section - Enhanced */}
      <section id="about" className="py-20 relative bg-gray-900/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                ABOUT MOBITRAK
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Revolutionizing Fleet Management for the Digital Age
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                mobiTrak is more than just a tracking platform—it's a comprehensive ecosystem that connects
                businesses, drivers, and customers through intelligent technology and seamless user experiences.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Advanced Technology</h3>
                    <p className="text-gray-300">Cutting-edge algorithms and real-time data processing for optimal fleet performance.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">User-Centric Design</h3>
                    <p className="text-gray-300">Intuitive interfaces designed for efficiency and ease of use across all user types.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-black font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Scalable Solutions</h3>
                    <p className="text-gray-300">From small businesses to enterprise fleets, our platform grows with your needs.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => scrollToSection('contact')}
                className="enterprise-button px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300"
              >
                Get in Touch
              </button>
            </div>

            {/* Right Content - Mission Cards */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Our Mission</h3>
                  <p className="text-gray-300 text-sm">Simplifying fleet management through innovative technology solutions.</p>
                </div>

                <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 mt-8">
                  <div className="text-3xl mb-4">🌟</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Our Vision</h3>
                  <p className="text-gray-300 text-sm">Creating a connected transportation ecosystem for the future.</p>
                </div>

                <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300 -mt-4">
                  <div className="text-3xl mb-4">💡</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Innovation</h3>
                  <p className="text-gray-300 text-sm">Continuously evolving with cutting-edge technology and user feedback.</p>
                </div>

                <div className="enterprise-card p-6 hover:scale-105 transition-all duration-300">
                  <div className="text-3xl mb-4">🤝</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Partnership</h3>
                  <p className="text-gray-300 text-sm">Building lasting relationships with our clients and community.</p>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 bg-primary/5 rounded-lg blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              GET IN TOUCH
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Fleet?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of businesses that have revolutionized their operations with mobiTrak.
              Start your journey today with a free consultation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="enterprise-card p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      className="enterprise-input w-full"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="enterprise-input w-full"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    className="enterprise-input w-full"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                  <input
                    type="text"
                    className="enterprise-input w-full"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    rows="4"
                    className="enterprise-input w-full"
                    placeholder="Tell us about your fleet management needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="enterprise-button w-full py-4 text-lg font-semibold hover:scale-105 transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="enterprise-card p-8 hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">Email Us</h3>
                    <p className="text-gray-300">contact@mobitrak.com</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Get in touch for general inquiries and support
                </p>
              </div>

              <div className="enterprise-card p-8 hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">Call Us</h3>
                    <p className="text-gray-300">+1 (555) 123-4567</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Speak with our team Monday to Friday, 9AM - 6PM EST
                </p>
              </div>

              <div className="enterprise-card p-8 hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary">Live Chat</h3>
                    <p className="text-gray-300">Available 24/7</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Get instant support through our live chat system
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <button className="enterprise-button w-full py-4 text-lg font-semibold hover:scale-105 transition-all duration-300">
                  Schedule a Demo
                </button>
                <button className="enterprise-button-secondary w-full py-4 text-lg font-semibold hover:scale-105 transition-all duration-300">
                  Download Brochure
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="enterprise-navbar py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-4">mobiTrak</div>
            <p className="text-gray-400 mb-4">© 2024 mobiTrak. All rights reserved.</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
