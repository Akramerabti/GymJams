import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Phone, MessageSquare, Send, Info, CheckCircle, Search, Upload, Paperclip,
  TruckIcon, ArrowLeftRight, DollarSign, Clock, MapPin, HelpCircle, ChevronDown, 
  ChevronUp, ExternalLink, Package, User, Briefcase, Link2, File, Calendar, Download,
  Home, Book, ArrowRight
} from 'lucide-react';
import applicationService from '../../services/application.service';
import { toast } from 'sonner';

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextArea } from "@/components/ui/TextArea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Contact = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
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

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Application form state
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

  // Handle Contact Form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create an application with type 'support'
      const applicationData = {
        name: contactForm.name,
        email: contactForm.email,
        applicationType: 'support', // Use 'support' type for contact form submissions
        message: contactForm.message
      };
      
      // Send the application to backend
      await applicationService.submitApplication(applicationData);
      
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
      console.error('Error submitting contact form:', error);
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
      
      // Clear form after successful submission
      setApplicationForm({
        name: '',
        email: '',
        phone: '',
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

  // FAQ items data
  const faqItems = {
    general: [
      {
        question: 'What is GymJams?',
        answer: 'GymJams is an online fitness platform that offers premium gym equipment, personalized coaching services, and fitness resources to help you achieve your fitness goals.'
      },
      {
        question: 'How do I create an account?',
        answer: 'To create an account, click on the "Login" button in the top-right corner of the page, then select "Register". Fill in your details to set up your account.'
      },
      {
        question: 'Is my personal information secure?',
        answer: 'Yes, we take data security seriously. We use industry-standard encryption and follow best practices to ensure your personal information is protected. You can review our privacy policy for more details.'
      },
      {
        question: 'How can I contact customer support?',
        answer: 'You can reach our customer support team through our Contact page, by email at support@gymjams.ca, or by phone at (555) 123-4567 during business hours.'
      },
      {
        question: 'Do you have a physical store?',
        answer: 'Currently, GymJams operates exclusively online. However, we offer virtual consultations for equipment and coaching services.'
      }
    ],
    products: [
      {
        question: 'What types of products do you sell?',
        answer: 'We offer a wide range of fitness equipment including weights, machines, accessories, and cardio equipment. All our products are carefully selected for quality and performance.'
      },
      {
        question: 'How do I know which product is right for me?',
        answer: 'Our product descriptions include detailed specifications and recommended use cases. If you need personalized guidance, consider booking a consultation with one of our fitness experts.'
      },
      {
        question: 'Do you offer product warranties?',
        answer: 'Yes, all our products come with manufacturer warranties. The warranty period varies by product and is listed on each product page.'
      },
      {
        question: 'Can I purchase replacement parts?',
        answer: 'Yes, replacement parts are available for most of our equipment. Contact our customer service team with your product model and the parts you need.'
      }
    ],
    coaching: [
      {
        question: 'How does the coaching service work?',
        answer: 'Our coaching service connects you with certified fitness professionals who provide personalized guidance. After subscribing, you\'ll complete a questionnaire about your goals and preferences, then be matched with a coach who will create a custom plan for you.'
      },
      {
        question: 'What qualifications do your coaches have?',
        answer: 'All our coaches are certified fitness professionals with relevant qualifications. Many hold degrees in exercise science, nutrition, or related fields, and all have practical experience working with diverse clients.'
      },
      {
        question: 'How often will I interact with my coach?',
        answer: 'This depends on your subscription plan. Basic plans include weekly check-ins, while premium and elite plans offer more frequent communication, including direct messaging and video calls.'
      },
      {
        question: 'Can I change my coach if we\'re not a good fit?',
        answer: 'Yes, you can request a coach change if you feel your current coach isn\'t meeting your needs. We\'ll work with you to find a better match.'
      },
      {
        question: 'How do I become a coach on GymJams?',
        answer: 'We\'re always looking for qualified coaches to join our platform. You can apply through our Careers page and complete the coach application process.'
      }
    ],
    orders: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or log in, then provide shipping and payment information to complete your order.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and Apple Pay. Payment information is securely processed through our payment partners.'
      },
      {
        question: 'How can I check my order status?',
        answer: 'Log in to your account and go to the Orders section to view the status of your current and past orders.'
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 24 hours of placing it, provided it hasn\'t shipped yet. Contact our customer service team for assistance.'
      }
    ],
    returns: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most products. Items must be in original condition and packaging. Custom or personalized products may have different return terms.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Log in to your account, go to your Orders, select the item you wish to return, and follow the return instructions. You\'ll receive a return shipping label and detailed instructions.'
      },
      {
        question: 'Who pays for return shipping?',
        answer: 'For returns due to defects or errors on our part, we\'ll cover the shipping costs. For other returns, shipping fees may be the customer\'s responsibility.'
      },
      {
        question: 'How long do refunds take to process?',
        answer: 'Once we receive your return, it takes 3-5 business days to process. Refunds typically appear in your account within 5-10 business days, depending on your payment method and financial institution.'
      }
    ],
    membership: [
      {
        question: 'What is the points system?',
        answer: 'Our points system rewards you for shopping and engaging with our platform. You earn points on purchases, completing fitness challenges, and participating in community activities. These points can be redeemed for discounts on future purchases.'
      },
      {
        question: 'How do I earn points?',
        answer: 'You earn points through purchases (1 point per dollar spent), completing your profile (100 points), subscribing to our newsletter (50 points), and participating in challenges (points vary by challenge).'
      },
      {
        question: 'How do I redeem points?',
        answer: 'During checkout, you\'ll see an option to apply points towards your purchase. Points can be redeemed in increments of 500, with each 500 points worth $5 off your order.'
      },
      {
        question: 'Do points expire?',
        answer: 'Points expire 12 months after they are earned if there is no account activity. Keeping your account active by making purchases or engaging with the platform will prevent points from expiring.'
      }
    ],
    careers: [
      {
        question: 'What positions are available at GymJams?',
        answer: 'We regularly hire for roles including Fitness Coaches, Customer Support Specialists, Product Managers, Taskforce Members, and more. Visit our Careers page to see current openings.'
      },
      {
        question: 'How do I apply for a job?',
        answer: 'To apply for a position, visit our Application page, select the appropriate application type, and submit your information along with any required documents.'
      },
      {
        question: 'What is the Taskforce team?',
        answer: 'The Taskforce team manages our product catalog, inventory, customer support cases, and general platform operations. Taskforce members have specialized access to our backend systems to ensure everything runs smoothly.'
      },
      {
        question: 'Do you offer remote work opportunities?',
        answer: 'Yes, many of our positions are remote-friendly, particularly for coaching and customer support roles. Specific location requirements are listed in each job description.'
      },
      {
        question: 'What qualities do you look for in team members?',
        answer: 'We value passion for fitness, customer-focused mindset, problem-solving abilities, and excellent communication skills. Specific qualifications vary by role, but these core qualities are important across all positions.'
      }
    ]
  };

  // Filter FAQ items based on search term
  const filteredFAQs = faqSearchTerm === '' 
    ? faqItems 
    : Object.keys(faqItems).reduce((acc, category) => {
        acc[category] = faqItems[category].filter(item => 
          item.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) || 
          item.answer.toLowerCase().includes(faqSearchTerm.toLowerCase())
        );
        return acc;
      }, {});

  // Count total matches for FAQ search
  const totalFaqMatches = Object.values(filteredFAQs).reduce(
    (sum, categoryItems) => sum + categoryItems.length, 
    0
  );

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
            <p className="text-gray-600">support@gymjams.ca</p>
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
                <Select
                  value={contactForm.subject}
                  onValueChange={(value) => setContactForm(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    <HelpCircle className="h-6 w-6 text-blue-600" />
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
                    <TruckIcon className="h-6 w-6 text-blue-600" />
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
                    <User className="h-6 w-6 text-blue-600" />
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

  // About section
  const renderAboutSection = () => {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <img 
            src="/images/about-hero.jpg" // Replace with your image
            alt="GymJams Team" 
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/1200x400?text=GymJams+Team';
            }}
          />
        </div>
        
        <Collapsible 
          open={!showCollapseButtons.aboutUs} 
          onOpenChange={(open) => setShowCollapseButtons(prev => ({ ...prev, aboutUs: !open }))}
        >
          <div className="prose prose-lg max-w-none mb-6">
            <h2>Our Mission</h2>
            <p>
              At GymJams, we believe that everyone deserves access to high-quality fitness equipment and expert guidance. 
              Our mission is to make fitness accessible, enjoyable, and effective for people of all levels.
            </p>
          </div>
          
          <CollapsibleContent>
            <div className="prose prose-lg max-w-none mb-6">
              <h2>Our Story</h2>
              <p>
                Founded in 2022, GymJams started as a small online store selling premium fitness equipment. 
                As we grew, we recognized the need for personalized coaching to help our customers maximize their results.
                Today, we offer a comprehensive platform that combines top-tier products with expert coaching services.
              </p>
              
              <h2>Our Team</h2>
              <p>
                Our team consists of passionate fitness enthusiasts, certified coaches, and industry experts who are dedicated to helping you achieve your fitness goals. 
                From product specialists to personal trainers, every member of the GymJams family is committed to your success.
              </p>
            </div>
          </CollapsibleContent>
          
          <CollapsibleTrigger className="w-full flex justify-center">
            <Button variant="ghost" className="text-blue-600">
              {showCollapseButtons.aboutUs ? (
                <span className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" /> Read More
                </span>
              ) : (
                <span className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Quality Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We curate only the best fitness equipment, ensuring durability, functionality, and value for your investment.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Expert Coaching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our certified coaches provide personalized guidance to help you reach your fitness goals safely and effectively.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Community Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Join our community of fitness enthusiasts who motivate and inspire each other on their fitness journeys.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-blue-50 p-8 rounded-lg text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
          <p className="text-gray-600 mb-6">
            Passionate about fitness? We're always looking for talented individuals to join our growing team.
          </p>
          <Button size="lg" onClick={() => setActiveTab('application')}>
            View Open Positions
          </Button>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            We're here to help! Check out our FAQ or get in touch with our support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="outline" onClick={() => setActiveTab('faq')}>
              View FAQ
            </Button>
            <Button onClick={() => setActiveTab('contact')}>
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // FAQ section
  const renderFaqSection = () => {
    const categories = [
      'general',
      'products',
      'coaching',
      'orders',
      'returns',
      'membership',
      'careers'
    ];

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search for answers..."
              className="pl-10"
              value={faqSearchTerm}
              onChange={(e) => setFaqSearchTerm(e.target.value)}
            />
          </div>
          {faqSearchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Found {totalFaqMatches} {totalFaqMatches === 1 ? 'result' : 'results'} for "{faqSearchTerm}"
            </p>
          )}
        </div>
        
        <Tabs value={faqCategoryTab} onValueChange={setFaqCategoryTab}>
          <ScrollArea className="w-full mb-6">
            <TabsList className="w-full justify-start">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize"
                  disabled={filteredFAQs[category]?.length === 0}
                >
                  {category}
                  {faqSearchTerm && filteredFAQs[category]?.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {filteredFAQs[category].length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <ScrollArea className="h-[60vh]" ref={faqScrollRef}>
            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                {filteredFAQs[category]?.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQs[category].map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No FAQ items found for this category.</p>
                  </div>
                )}
                
                {/* Add application link for relevant categories */}
                {(category === 'coaching' || category === 'careers') && (
                  <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                      {category === 'coaching' ? 'Interested in becoming a coach?' : 'Want to join our team?'}
                    </h3>
                    <p className="mb-4 text-gray-600">
                      {category === 'coaching' 
                        ? 'We\'re always looking for qualified fitness professionals to join our coaching team.' 
                        : 'Check out our current openings and submit your application today.'}
                    </p>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => setActiveTab('application')}
                    >
                      Apply Now
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
        
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">
            If you couldn't find the answer to your question, feel free to reach out to our support team.
          </p>
          <Button onClick={() => setActiveTab('contact')}>
            Contact Us
          </Button>
        </div>
      </div>
    );
  };

  // Returns section
  const renderReturnsSection = () => {
    return (
      <div className="space-y-8">
        <Alert className="mb-8">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            For questions about returns, please <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('contact')}>contact our support team</Button> or call us at (555) 123-4567.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">30-Day Returns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Return eligible items within 30 days of delivery for a full refund.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Free Return Shipping</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                For defective or incorrect items, return shipping is on us.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Fast Refunds</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Refunds are processed within 3-5 business days after we receive your return.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Collapsible 
          open={!showCollapseButtons.returns} 
          onOpenChange={(open) => setShowCollapseButtons(prev => ({ ...prev, returns: !open }))}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-6">Return Policy</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="policy-1">
                <AccordionTrigger>Eligible Items</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Most unused items in their original packaging can be returned within 30 days of delivery. Exceptions include:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Opened supplements and nutrition products</li>
                    <li>Personalized or custom-made equipment</li>
                    <li>Hygiene products where the seal has been broken</li>
                    <li>Digital products and services</li>
                    <li>Gift cards and merchandise credits</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="policy-2">
                <AccordionTrigger>Return Conditions</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">To be eligible for a return, your item must be:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>In the same condition that you received it</li>
                    <li>In the original packaging</li>
                    <li>Complete with all parts and accessories</li>
                    <li>Accompanied by the receipt or proof of purchase</li>
                  </ul>
                  <p className="mt-2">
                    Items that are damaged, incomplete, or show signs of use beyond inspection may not qualify for a full refund.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <CollapsibleContent>
            <div className="mb-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="policy-3">
                  <AccordionTrigger>Refund Process</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Once we receive your return, we'll inspect it and notify you of the status of your refund. If approved:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your refund will be processed to the original method of payment</li>
                      <li>Credit card refunds typically take 5-10 business days to appear on your statement</li>
                      <li>Store credit refunds are processed immediately</li>
                    </ul>
                    <p className="mt-2">
                      Shipping costs are non-refundable except in cases of defective or incorrectly shipped items.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="policy-4">
                  <AccordionTrigger>Exchanges</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      If you need to exchange an item for the same item in a different size or color, please return the original item for a refund and place a new order for the replacement item. This ensures the quickest processing time.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="policy-5">
                  <AccordionTrigger>Digital Products & Subscriptions</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Our digital products and subscription policies:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Digital downloads are non-refundable once accessed or downloaded</li>
                      <li>Coaching subscriptions can be cancelled within 10 days of purchase for a full refund if no sessions have been conducted</li>
                      <li>Monthly membership plans can be cancelled at any time, with service continuing until the end of the current billing period</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CollapsibleContent>
          
          <CollapsibleTrigger className="w-full flex justify-center">
            <Button variant="ghost" className="text-blue-600">
              {showCollapseButtons.returns ? (
                <span className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" /> View More Policy Details
                </span>
              ) : (
                <span className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">How to Return an Item</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Online Purchases
              </h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <span className="font-medium">Initiate Return:</span> Log in to your account, go to "Order History," select the order and item to return, and follow the on-screen instructions.
                </li>
                <li>
                  <span className="font-medium">Print Label:</span> Download and print the prepaid return shipping label (if eligible for free returns).
                </li>
                <li>
                  <span className="font-medium">Package Item:</span> Securely package the item in its original packaging with all components.
                </li>
                <li>
                  <span className="font-medium">Ship Return:</span> Drop off the package at any authorized shipping location.
                </li>
                <li>
                  <span className="font-medium">Track Status:</span> Monitor your return and refund status in your account.
                </li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                In-Store Purchases
              </h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <span className="font-medium">Visit Store:</span> Return to any of our retail locations within 30 days of purchase.
                </li>
                <li>
                  <span className="font-medium">Bring Receipt:</span> Present your original receipt or order confirmation email.
                </li>
                <li>
                  <span className="font-medium">Original Packaging:</span> Return the item in its original packaging with all components.
                </li>
                <li>
                  <span className="font-medium">Refund Method:</span> Refunds will be issued to the original payment method used at purchase.
                </li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-4">Need Help with Your Return?</h2>
          <p className="text-gray-600 mb-6">
            Our customer service team is ready to assist you with any questions or concerns about returns and refunds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => setActiveTab('contact')}
            >
              Contact Support
            </Button>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => {
                setActiveTab('faq');
                setFaqCategoryTab('returns');
              }}
            >
              View Return FAQs
            </Button>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <h3 className="font-semibold text-lg mb-2">Taskforce Support</h3>
          <p className="text-gray-600 mb-4">
            Our Taskforce team is dedicated to resolving return issues quickly and efficiently.
            Interested in joining our Taskforce? We're always looking for customer-focused individuals.
          </p>
          <Button 
            variant="outline"
            onClick={() => {
              setActiveTab('application');
              setApplicationForm(prev => ({
                ...prev,
                applicationType: 'taskforce'
              }));
            }}
          >
            Apply to Join Our Team
          </Button>
        </div>
      </div>
    );
  };

  // Application section
  const renderApplicationSection = () => {
    return (
      <div className="space-y-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Join Our Team</h1>
          <p className="text-gray-600">
            We're looking for talented individuals to join the GymJams family. Fill out the form below to apply!
          </p>
        </div>
        
        {successMessage && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Please fill out the form below to apply. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleApplicationSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={applicationForm.name}
                  onChange={handleApplicationChange}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={applicationForm.email}
                  onChange={handleApplicationChange}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={applicationForm.phone}
                  onChange={handleApplicationChange}
                  placeholder="Enter your phone number (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="applicationType">
                  Application Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={applicationForm.applicationType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className={errors.applicationType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select application type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Fitness Coach</SelectItem>
                    <SelectItem value="affiliate">Affiliate Partner</SelectItem>
                    <SelectItem value="taskforce">Taskforce Member</SelectItem>
                    <SelectItem value="general">General Employment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.applicationType && (
                  <p className="text-red-500 text-sm">{errors.applicationType}</p>
                )}
                
                {applicationForm.applicationType && (
                  <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600">
                          <Info className="h-4 w-4 mr-1" />
                          <span className="text-sm">What is this?</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        {applicationForm.applicationType === 'coach' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Fitness Coach</h4>
                            <p className="text-sm">As a coach, you'll provide personalized fitness guidance to our users. You should have relevant certifications and experience in the fitness industry.</p>
                          </div>
                        )}
                        {applicationForm.applicationType === 'affiliate' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Affiliate Partner</h4>
                            <p className="text-sm">Promote our products and services through your platform and earn commissions on sales generated through your unique referral links.</p>
                          </div>
                        )}
                        {applicationForm.applicationType === 'taskforce' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Taskforce Member</h4>
                            <p className="text-sm">Join our internal team to help manage products, inventory, and support customer needs. This is a staff position with administrative access.</p>
                          </div>
                        )}
                        {applicationForm.applicationType === 'general' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">General Employment</h4>
                            <p className="text-sm">Apply for various positions within our organization including customer service, marketing, development, and more.</p>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resume">
                  Resume/CV 
                  {(applicationForm.applicationType === 'coach' || applicationForm.applicationType === 'taskforce') && 
                    <span className="text-red-500"> *</span>
                  }
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current.click()}
                    className={`flex items-center gap-2 ${errors.resume ? 'border-red-500' : ''}`}
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-500">
                    {resumeFile ? resumeFile.name : 'No file chosen'}
                  </span>
                </div>
                {errors.resume && (
                  <p className="text-red-500 text-sm">{errors.resume}</p>
                )}
                <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX (max. 5MB)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">
                  Portfolio URL / LinkedIn
                </Label>
                <Input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={applicationForm.portfolioUrl}
                  onChange={handleApplicationChange}
                  placeholder="https://your-portfolio.com or LinkedIn URL (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">
                  Why are you interested in this position? <span className="text-red-500">*</span>
                </Label>
                <TextArea
                  id="message"
                  name="message"
                  value={applicationForm.message}
                  onChange={handleApplicationChange}
                  className={`min-h-[150px] ${errors.message ? 'border-red-500' : ''}`}
                  placeholder="Tell us about yourself, your experience, and why you're interested in joining our team."
                />
                {errors.message && (
                  <p className="text-red-500 text-sm">{errors.message}</p>
                )}
              </div>
              
              <CardFooter className="flex justify-end px-0 pt-4">
                <Button
                  type="submit"
                  disabled={applicationSubmitting}
                  className="w-full sm:w-auto"
                >
                  {applicationSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Application
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
                <span className="hidden sm:inline">Contact</span>
              </Button>
              <Button
                variant={activeTab === 'faq' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('faq')}
                className="gap-2 rounded-md"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQ</span>
              </Button>
              <Button
                variant={activeTab === 'returns' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('returns')}
                className="gap-2 rounded-md"
              >
                <TruckIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Returns</span>
              </Button>
              <Button
                variant={activeTab === 'about' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('about')}
                className="gap-2 rounded-md"
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </Button>
              <Button
                variant={activeTab === 'application' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('application')}
                className="gap-2 rounded-md"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Apply</span>
              </Button>
            </div>
          </div>
          
          {/* Breadcrumb shown only for non-contact tabs */}
          {activeTab !== 'contact' && renderBreadcrumb()}
        </div>
        
        {/* Tab Content */}
        <div className="bg-white shadow-sm rounded-lg p-6 md:p-8">
          {activeTab === 'contact' && renderContactSection()}
          {activeTab === 'faq' && renderFaqSection()}
          {activeTab === 'returns' && renderReturnsSection()}
          {activeTab === 'about' && renderAboutSection()}
          {activeTab === 'application' && renderApplicationSection()}
        </div>
      </div>
    </div>
  );
};

export default Contact;