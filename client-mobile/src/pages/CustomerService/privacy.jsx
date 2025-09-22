// src/pages/CustomerService/Privacy.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, FileText, Mail, Phone, MapPin, ChevronRight, ArrowUp } from 'lucide-react';
import { Button } from '../../components/ui/button';

const Privacy = () => {
  const [activeSection, setActiveSection] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      // Update active section based on scroll position
      const sections = document.querySelectorAll('[data-section]');
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(section.getAttribute('data-section'));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const tableOfContents = [
    { id: 'introduction', title: 'Introduction', icon: Shield },
    { id: 'information-collection', title: 'Information We Collect', icon: Eye },
    { id: 'information-use', title: 'How We Use Your Information', icon: FileText },
    { id: 'information-sharing', title: 'Information Sharing', icon: Lock },
    { id: 'data-retention', title: 'Data Retention', icon: FileText },
    { id: 'your-rights', title: 'Your Rights and Choices', icon: Shield },
    { id: 'data-security', title: 'Data Security', icon: Lock },
    { id: 'cookies', title: 'Cookies and Tracking', icon: Eye },
    { id: 'contact', title: 'Contact Information', icon: Mail },
  ];

  return (
    <div className="min-h-dvh bg-gray-50" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mr-3" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Privacy Policy
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Your privacy is important to us. Learn how we collect, use, and protect your personal information.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm text-gray-500 mt-4"
            >
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left flex items-center p-2 sm:p-3 rounded-lg transition-colors ${
                          activeSection === item.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-12">
                
                {/* Introduction */}
                <section id="introduction" data-section="introduction">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">1. Introduction</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Welcome to GymTonic ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our website, mobile application, and services (collectively, the "Service").
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      We are committed to protecting your privacy and handling your personal information in accordance with applicable Canadian privacy laws, including the Personal Information Protection and Electronic Documents Act (PIPEDA).
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Mail className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                          <ul className="text-blue-800 text-sm space-y-1">
                            <li>Email: contact@gymtonic.ca</li>
                            <li>Phone: +1 (555) 123-4567</li>
                            <li>Website: www.gymtonic.ca</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Information We Collect */}
                <section id="information-collection" data-section="information-collection">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">2. Information We Collect</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information You Provide</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Name (first and last)</li>
                            <li>• Email address</li>
                            <li>• Phone number</li>
                            <li>• Password (encrypted)</li>
                            <li>• Profile picture</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Fitness Profile</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Fitness goals and preferences</li>
                            <li>• Experience level</li>
                            <li>• Workout types</li>
                            <li>• Health questionnaire responses</li>
                            <li>• Gym preferences and location</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Billing address</li>
                            <li>• Payment method details</li>
                            <li>• Transaction history</li>
                            <li>• Subscription status</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Communication Data</h4>
                          <ul className="text-gray-700 text-sm space-y-1">
                            <li>• Messages sent through platform</li>
                            <li>• Customer support inquiries</li>
                            <li>• Email marketing preferences</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Information Automatically Collected</h3>
                      <p className="text-gray-700 mb-4">
                        We automatically collect certain information when you use our Service, including usage data, technical information, and location data when enabled.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
                      <p className="text-gray-700 mb-4">
                        We may receive information from social login services (like Google OAuth), analytics providers, and other third-party services we integrate with.
                      </p>
                    </div>
                  </div>
                </section>

                {/* How We Use Your Information */}
                <section id="information-use" data-section="information-use">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">3. How We Use Your Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        Service Provision
                      </h3>
                      <ul className="text-gray-700 text-sm space-y-1">
                        <li>• Create and manage your account</li>
                        <li>• Process payments and subscriptions</li>
                        <li>• Provide personalized recommendations</li>
                        <li>• Enable social features and matching</li>
                        <li>• Deliver customer support</li>
                      </ul>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-blue-600" />
                        Communication
                      </h3>
                      <ul className="text-gray-700 text-sm space-y-1">
                        <li>• Send service-related notifications</li>
                        <li>• Provide marketing communications</li>
                        <li>• Respond to inquiries and support</li>
                        <li>• Send subscription updates</li>
                      </ul>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-blue-600" />
                        Analytics & Improvement
                      </h3>
                      <ul className="text-gray-700 text-sm space-y-1">
                        <li>• Analyze usage patterns</li>
                        <li>• Conduct research and development</li>
                        <li>• Monitor performance and security</li>
                        <li>• Generate anonymized reports</li>
                      </ul>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        Legal & Safety
                      </h3>
                      <ul className="text-gray-700 text-sm space-y-1">
                        <li>• Comply with legal obligations</li>
                        <li>• Protect against fraud and abuse</li>
                        <li>• Enforce our Terms of Service</li>
                        <li>• Ensure user safety and security</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Information Sharing */}
                <section id="information-sharing" data-section="information-sharing">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">4. Information Sharing and Disclosure</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1 Service Providers</h3>
                      <p className="text-gray-700 mb-4">We share information with trusted third-party service providers:</p>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Lock className="w-5 h-5 text-yellow-600 mt-1 mr-3" />
                            <div>
                              <h4 className="font-semibold text-yellow-900">Payment Processing</h4>
                              <p className="text-yellow-800 text-sm">Stripe Inc. - for secure payment processing</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FileText className="w-5 h-5 text-yellow-600 mt-1 mr-3" />
                            <div>
                              <h4 className="font-semibold text-yellow-900">Cloud Storage</h4>
                              <p className="text-yellow-800 text-sm">Supabase - for data storage and management</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Eye className="w-5 h-5 text-yellow-600 mt-1 mr-3" />
                            <div>
                              <h4 className="font-semibold text-yellow-900">Analytics</h4>
                              <p className="text-yellow-800 text-sm">Google Analytics and Google AdSense</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Retention */}
                <section id="data-retention" data-section="data-retention">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">5. Data Retention</h2>
                  <p className="text-gray-700 mb-4">
                    We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce agreements.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Specific Retention Periods:</h4>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Account information:</strong> Until account deletion + 30 days</li>
                      <li>• <strong>Payment records:</strong> 7 years (for tax and legal requirements)</li>
                      <li>• <strong>Marketing data:</strong> Until unsubscribe + 2 years</li>
                      <li>• <strong>Usage analytics:</strong> 26 months (anonymized after 14 months)</li>
                    </ul>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" data-section="your-rights">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">6. Your Rights and Choices</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">Account Management</h3>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• Update your profile information</li>
                        <li>• Change privacy settings</li>
                        <li>• Manage notification preferences</li>
                        <li>• Download your data</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Privacy Rights (PIPEDA)</h3>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• <strong>Access:</strong> Request a copy of your data</li>
                        <li>• <strong>Correction:</strong> Update inaccurate information</li>
                        <li>• <strong>Withdrawal:</strong> Withdraw consent</li>
                        <li>• <strong>Deletion:</strong> Request account deletion</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-700 text-sm">
                      To exercise your rights, contact us at <strong>contact@gymtonic.ca</strong>
                    </p>
                  </div>
                </section>

                {/* Data Security */}
                <section id="data-security" data-section="data-security">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">7. Data Security</h2>
                  <p className="text-gray-700 mb-6">
                    We implement comprehensive security measures to protect your personal information:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-blue-600" />
                        Technical Safeguards
                      </h3>
                      <p className="text-gray-700 text-sm">
                        SSL/TLS encryption, secure password hashing, regular security audits, and access controls.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        Operational Safeguards
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Staff training, background checks, incident response procedures, and regular backup testing.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                        Physical Safeguards
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Secure data centers with restricted access, environmental controls, and equipment disposal procedures.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" data-section="cookies">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">8. Cookies and Tracking Technologies</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Types of Cookies We Use</h3>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• <strong>Essential Cookies:</strong> Authentication, security, session management</li>
                        <li>• <strong>Analytics Cookies:</strong> Google Analytics for usage statistics</li>
                        <li>• <strong>Advertising Cookies:</strong> Google AdSense for relevant advertising</li>
                      </ul>
                    </div>
                    
                    <p className="text-gray-700">
                      You can control cookies through your browser settings or our cookie preference center. Note that disabling certain cookies may affect Service functionality.
                    </p>
                  </div>
                </section>

                {/* Contact Information */}
                <section id="contact" data-section="contact">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">9. Contact Information</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <Mail className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                        <p className="text-gray-700">contact@gymtonic.ca</p>
                      </div>
                      <div className="text-center">
                        <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
                        <p className="text-gray-700">+1 (555) 123-4567</p>
                      </div>
                      <div className="text-center">
                        <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy Commissioner</h3>
                        <p className="text-gray-700 text-sm">File a complaint at priv.gc.ca</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Footer Note */}
                <div className="border-t border-gray-200 pt-8">
                  <p className="text-sm text-gray-500 text-center">
                    This Privacy Policy is designed to comply with Canadian privacy laws and international best practices. 
                    It should be reviewed by legal counsel before implementation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          style={{ bottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

export default Privacy;