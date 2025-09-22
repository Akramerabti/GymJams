import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import { 
  Mail, Phone, MessageSquare, Send, Info, CheckCircle, Search, Home, ArrowRight, UserPlus
} from 'lucide-react';
import applicationService from '../../services/application.service';
import supportTicketService from '../../services/supportTicket.service';
import { toast } from 'sonner';

import { ApplicationForm } from '../CustomerService/application';
import { FAQSection } from '../CustomerService/faq';
import { ReturnsSection } from '../CustomerService/returns';
import { AboutSection } from '../CustomerService/about';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextArea } from "@/components/ui/TextArea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Contact = () => {
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('contact');
  const [searchTerm, setSearchTerm] = useState('');
  const [faqSearchTerm, setFaqSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqCategoryTab, setFaqCategoryTab] = useState('general');
  const [showCollapseButtons, setShowCollapseButtons] = useState({
    aboutUs: false,
    faq: false,
    returns: false,
    application: false
  });
  const [faqScrollPosition, setFaqScrollPosition] = useState(0);
  const faqScrollRef = useRef(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    applicationType: '',
    message: '',
    portfolioUrl: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Scrolling effect for tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Save FAQ scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (faqScrollRef.current) {
        setFaqScrollPosition(faqScrollRef.current.scrollTop);
      }
    };

    const scrollContainer = faqScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [activeTab]);

  // Restore FAQ scroll position when returning to FAQ tab
  useEffect(() => {
    if (activeTab === 'faq' && faqScrollRef.current) {
      faqScrollRef.current.scrollTop = faqScrollPosition;
    }
  }, [activeTab, faqScrollPosition]);
  useEffect(() => {
    if (user) {
      //('User data loaded in Contact component:', user);
      const userData = user?.user || user; // Handle nested user structure
      setApplicationForm(prev => ({
        ...prev,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : (userData.name || userData.fullName || userData.userName || ''),
        email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || ''
      }));
    } else {
      //('No user data available in Contact component');
    }
  }, [user]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
   
      const isJobApplication = contactForm.subject === 'career' || contactForm.subject === 'job' || contactForm.subject === 'application';
      
      if (isJobApplication) {
       
        const applicationData = {
          name: contactForm.name,
          email: contactForm.email,
          applicationType: 'general',
          message: contactForm.message
        };
        
        // Send the application to backend
        await applicationService.submitApplication(applicationData);
      } else {
        // For support requests, use the support ticket service
        const ticketData = {
          subject: contactForm.subject,
          userName: contactForm.name,
          userEmail: contactForm.email,
          message: contactForm.message
        };
        
        // Use the supportTicket service
        await supportTicketService.createSupportTicket(ticketData);
      }
      
      // Show success message
      setSubmitted(true);
      
      // Reset form
      setContactForm({
        name: '',
        email: '',
        subject: 'general',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactChange = (e) => {
    setContactForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Application form handlers
  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (value) => {
    setApplicationForm(prev => ({
      ...prev,
      applicationType: value
    }));
    
    if (errors.applicationType) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.applicationType;
        return newErrors;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        resume: 'File size should be less than 5MB'
      }));
      return;
    }
    
    // Validate file type (PDF, DOC, DOCX)
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        resume: 'Only PDF, DOC, and DOCX files are allowed'
      }));
      return;
    }
    
    setResumeFile(file);
    if (errors.resume) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.resume;
        return newErrors;
      });
    }
  };

  const validateApplicationForm = () => {
    const newErrors = {};
    
    if (!applicationForm.name.trim()) newErrors.name = 'Name is required';
    if (!applicationForm.email.trim()) newErrors.email = 'Email is required';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (applicationForm.email && !emailRegex.test(applicationForm.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!applicationForm.applicationType) newErrors.applicationType = 'Please select an application type';
    if (!applicationForm.message.trim()) newErrors.message = 'Please provide some details about your application';
    
    // For coach and taskforce applications, resume is required
    if ((applicationForm.applicationType === 'coach' || applicationForm.applicationType === 'taskforce') && !resumeFile) {
      newErrors.resume = 'Resume is required for this position';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateApplicationForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && document.getElementsByName(firstErrorField)[0]) {
        document.getElementsByName(firstErrorField)[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }
    
    setApplicationSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', applicationForm.name);
      formDataToSend.append('email', applicationForm.email);
      if (applicationForm.phone) formDataToSend.append('phone', applicationForm.phone);
      formDataToSend.append('applicationType', applicationForm.applicationType);
      formDataToSend.append('message', applicationForm.message);
      if (applicationForm.portfolioUrl) formDataToSend.append('portfolioUrl', applicationForm.portfolioUrl);
      if (resumeFile) formDataToSend.append('resume', resumeFile);
      
      const response = await applicationService.submitApplication(formDataToSend);
        // Show success message
      setSuccessMessage('Your application has been successfully submitted! We will review it and get back to you soon.');
      
      // Clear form after successful submission while preserving user data
      const userData = user?.user || user; // Handle nested user structure
      setApplicationForm({
        // Re-populate with user data if available
        name: userData?.firstName && userData?.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : (userData?.name || userData?.fullName || userData?.userName || ''),
        email: userData?.email || '',
        phone: userData?.phone || userData?.phoneNumber || '',
        // Reset application-specific fields
        applicationType: '',
        message: '',
        portfolioUrl: '',
      });
      setResumeFile(null);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application. Please try again later.');
    } finally {
      setApplicationSubmitting(false);
    }
  };

  // Breadcrumb navigation
  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('contact')}>
          <Home className="h-3 w-3 mr-1" />
          Support
        </Button>
        {activeTab !== 'contact' && (
          <>
            <ArrowRight className="h-3 w-3 mx-1" />
            <span className="capitalize">{activeTab}</span>
          </>
        )}
      </div>
    );
  };

  // Contact section
  const renderContactSection = () => {
    return (
      <div className="space-y-8">
        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <Mail className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-2">Email Us</h3>
            <p className="text-gray-600">contact@gymtonic.ca</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <Phone className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-2">Call Us</h3>
            <p className="text-gray-600">+1 (555) 123-4567</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600">Available 9am-5pm EST</p>
          </div>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Us a Message</CardTitle>
            <CardDescription>
              Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={contactForm.name}
                  onChange={handleContactChange}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={contactForm.email}
                  onChange={handleContactChange}
                  placeholder="Your email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                >
                  <option value="general" className='text-black'>General Inquiry</option>
                  <option value="support"className='text-black'>Technical Support</option>
                  <option value="billing"className='text-black'>Billing Question</option>
                  <option value="feature"className='text-black'>Feature Request</option>
                  <option value="other"className='text-black'>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <TextArea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={handleContactChange}
                  placeholder="How can we help you?"
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {submitted && (
              <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <AlertDescription>
                  Thank you for your message! We'll get back to you soon.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Explore More Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6 text-center">Explore More Support Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('faq')}>
              <CardContent className="p-6 cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">FAQ</h3>
                  <p className="text-sm text-gray-500">Browse our frequently asked questions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('returns')}>
              <CardContent className="p-6 cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Returns & Refunds</h3>
                  <p className="text-sm text-gray-500">Learn about our return policy</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('about')}>
              <CardContent className="p-6 cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">About Us</h3>
                  <p className="text-sm text-gray-500">Learn more about GymJams</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" onClick={() => setActiveTab('application')}>
              <CardContent className="p-6 cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Join Our Team</h3>
                  <p className="text-sm text-gray-500">Apply for open positions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] md:min-h-screen mt-10  bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Support</h1>
          <p className="text-xl text-gray-600">How can we help you today?</p>
        </div>

        {/* Main Tabs */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 mb-4">
              <Button
                variant={activeTab === 'contact' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('contact')}
                className="gap-2 rounded-md"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Contact</span>
              </Button>
              <Button
                variant={activeTab === 'faq' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('faq')}
                className="gap-2 rounded-md"
              >
                <Search className="h-4 w-4" />
                <span>FAQ</span>
              </Button>
              <Button
                variant={activeTab === 'returns' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('returns')}
                className="gap-2 rounded-md"
              >
                <Mail className="h-4 w-4" />
                <span>Returns</span>
              </Button>
              <Button
                variant={activeTab === 'about' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('about')}
                className="gap-2 rounded-md"
              >
                <Info className="h-4 w-4" />
                <span>About</span>
              </Button>
              <Button
                variant={activeTab === 'application' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('application')}
                className="gap-2 rounded-md"
              >
                <UserPlus className="h-4 w-4" />
                <span>Apply</span>
              </Button>
            </div>
          </div>
          
          {/* Breadcrumb shown only for non-contact tabs */}
          {activeTab !== 'contact' && renderBreadcrumb()}
        </div>
        
        {/* Tab Content */}
        <div className="bg-white shadow-sm rounded-lg p-6 md:p-8">
          {activeTab === 'contact' && renderContactSection()}
          
          {activeTab === 'faq' && (
            <FAQSection
              searchTerm={faqSearchTerm}
              setSearchTerm={setFaqSearchTerm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              faqScrollRef={faqScrollRef}
            />
          )}
          
          {activeTab === 'returns' && (
            <ReturnsSection
              showCollapseButtons={showCollapseButtons}
              setShowCollapseButtons={setShowCollapseButtons}
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'about' && (
            <AboutSection
              showCollapseButtons={showCollapseButtons}
              setShowCollapseButtons={setShowCollapseButtons}
              setActiveTab={setActiveTab}
            />
          )}
            {activeTab === 'application' && (
            <ApplicationForm
              successMessage={successMessage}
              applicationForm={applicationForm}
              errors={errors}
              applicationSubmitting={applicationSubmitting}
              resumeFile={resumeFile}
              handleApplicationChange={handleApplicationChange}
              handleTypeChange={handleTypeChange}
              handleFileChange={handleFileChange}
              handleApplicationSubmit={handleApplicationSubmit}
              fileInputRef={fileInputRef}
              user={user?.user || user}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;