import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Paperclip, Send, Info, CheckCircle, LogIn, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import applicationService from "../../services/application.service";
import { TextArea } from "@/components/ui/TextArea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useAuthStore from '../../stores/authStore';

const ApplicationForm = ({ 
  successMessage,
  applicationForm,
  errors,
  applicationSubmitting,
  resumeFile,
  handleApplicationChange,
  handleTypeChange, 
  handleFileChange,
  handleApplicationSubmit,
  fileInputRef,
  user,
  isUserDataLocked = true 
}) => {
  const navigate = useNavigate();  // Debug log when this component is rendered

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br pt-20 from-blue-600 to-purple-700 dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-xl border border-blue-400/20 dark:border-gray-600/20"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-white/20 dark:bg-gray-700/50 rounded-full">
            <LogIn className="h-12 w-12 text-white dark:text-gray-200" />
          </div>
          <h3 className="text-2xl font-bold text-white dark:text-gray-100">Careers</h3>
          <p className="text-white/90 dark:text-gray-300 max-w-md">
            You need to be logged in to apply for a position. 
            Access your account to submit your application.
          </p>
          <div className="flex gap-4 pt-2">
            <Button 
              onClick={() => navigate('/login?redirect=application')}
              className="bg-white dark:bg-gray-100 text-blue-600 dark:text-gray-900 hover:bg-blue-50 dark:hover:bg-gray-200 transition-all transform hover:scale-105"
              size="lg"
            >
              Log In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/register?redirect=application')}
              className="bg-transparent border-white dark:border-gray-300 text-white dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all"
              size="lg"
            >
              Create Account
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 mt-20">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Careers</h1>
        <p className="text-gray-600">
          At GymTonic, we're always open to looking for talented individuals to thrive. Fill out the form below to get started.
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
          <CardTitle>Careers</CardTitle>
          <CardDescription>
            Please fill out the form below to apply. Fields marked with * are required.
            <span className="block mt-1 text-blue-600">Your account information has been filled in and cannot be changed. This ensures your application is linked to your verified account.</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleApplicationSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
                {applicationForm.name && <span className="ml-2 text-xs text-blue-500">(From your account)</span>}
              </Label>
              <Input
                id="name"
                name="name"
                value={applicationForm.name}
                onChange={handleApplicationChange}
                className={`${errors.name ? 'border-red-500' : ''} ${applicationForm.name ? 'bg-gray-50 cursor-not-allowed border-gray-300' : ''}`}
                placeholder="Enter your full name"
                readOnly={!!applicationForm.name}
                disabled={!!applicationForm.name}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
                {applicationForm.email && <span className="ml-2 text-xs text-blue-500">(From your account)</span>}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={applicationForm.email}
                onChange={handleApplicationChange}
                className={`${errors.email ? 'border-red-500' : ''} ${applicationForm.email ? 'bg-gray-50 cursor-not-allowed border-gray-300' : ''}`}
                placeholder="Enter your email address"
                readOnly={!!applicationForm.email}
                disabled={!!applicationForm.email}
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
                className={isUserDataLocked && applicationForm.phone ? 'bg-gray-50' : ''}
                placeholder="Enter your phone number (optional)"
                readOnly={isUserDataLocked && applicationForm.phone}
                disabled={isUserDataLocked && applicationForm.phone}
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
                        <div className="space-y-2 ">
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

const ApplicationFormPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user: authUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    applicationType: '',
    message: '',
    portfolioUrl: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
    setFormData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.applicationType) newErrors.applicationType = 'Please select an application type';
    if (!formData.message.trim()) newErrors.message = 'Please provide some details about your application';
    
    // For coach and taskforce applications, resume is required
    if ((formData.applicationType === 'coach' || formData.applicationType === 'taskforce') && !resumeFile) {
      newErrors.resume = 'Resume is required for this position';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
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
    
    setIsSubmitting(true);

    
    try {

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      formDataToSend.append('applicationType', formData.applicationType);
      formDataToSend.append('message', formData.message);
      if (formData.portfolioUrl) formDataToSend.append('portfolioUrl', formData.portfolioUrl);
      if (resumeFile) formDataToSend.append('resume', resumeFile);

      
      const response = await applicationService.submitApplication(formDataToSend);

      setSuccessMessage('Your application has been successfully submitted! We will review it and get back to you soon.');
      
      // Reset form while preserving user info fields from authenticated user
      setFormData(prev => ({
        // Preserve user identification information from authUser if available
        name: authUser?.firstName && authUser?.lastName 
          ? `${authUser.firstName} ${authUser.lastName}` 
          : (authUser?.name || authUser?.fullName || authUser?.userName || ''),
        email: authUser?.email || '',
        phone: authUser?.phone || authUser?.phoneNumber || '',
        // Reset application-specific fields
        applicationType: '',
        message: '',
        portfolioUrl: '',
      }));
      setResumeFile(null);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Redirect to home page after a delay
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('[Application] Error submitting application:', error);
      console.error('[Application] Error details:', error.response?.data);
      // ... existing code ...
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect unauthenticated users immediately
  useEffect(() => {
    if (!authUser) {

      localStorage.setItem('auth_redirect_message', 'You need to log in to submit an application');
      navigate('/login?redirect=application', { replace: true });
      return; // Stop execution of the rest of this component
    } else {
      // If authenticated, pre-fill the form with user data
      setFormData(prev => ({
        ...prev,
        name: authUser.firstName && authUser.lastName 
          ? `${authUser.firstName} ${authUser.lastName}` 
          : (authUser.name || authUser.fullName || authUser.userName || ''),
        email: authUser.email || '',
        phone: authUser.phone || authUser.phoneNumber || ''
      }));
    }
  }, [authUser, navigate]);

  // If not authenticated, show a more prominent login prompt
  if (!authUser) {
    //('[ApplicationPage] Rendering login prompt (user is not authenticated)');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="p-4 bg-blue-100 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-6">
            <Gamepad2 className="h-10 w-10 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Careers</h1>
          <p className="text-gray-600 mb-6">
            Log in to submit your application and explore opportunities at GymJams!
          </p>
          
          <div className="space-y-3">
            <a
              href="/login?redirect=application"
              className="inline-block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Log In to Apply
            </a>
            
            <a
              href="/register?redirect=application"
              className="inline-block w-full bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Create New Account
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-20 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Careers</h1>
          <p className="text-gray-600">
            At GymTonic, we're always open to looking for talented individuals to thrive. Fill out the form below to get started.
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
              {authUser && <span className="block mt-1 text-blue-600">Your account information has been filled in and cannot be changed. This ensures your application is linked to your verified account.</span>}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                  {formData.name && <span className="ml-2 text-xs text-blue-500">(From your account)</span>}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${errors.name ? 'border-red-500' : ''} ${formData.name ? 'bg-gray-50 cursor-not-allowed border-gray-300' : ''}`}
                  placeholder="Enter your full name"
                  readOnly={!!formData.name}
                  disabled={!!formData.name}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                  {formData.email && <span className="ml-2 text-xs text-blue-500">(From your account)</span>}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${errors.email ? 'border-red-500' : ''} ${formData.email ? 'bg-gray-50 cursor-not-allowed border-gray-300' : ''}`}
                  placeholder="Enter your email address"
                  readOnly={!!formData.email}
                  disabled={!!formData.email}
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
                  value={formData.phone}
                  onChange={handleChange}
                  className={authUser && formData.phone ? 'bg-gray-50' : ''}
                  placeholder="Enter your phone number (optional)"
                  readOnly={!!authUser && !!formData.phone}
                  disabled={!!authUser && !!formData.phone}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="applicationType">
                  Application Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.applicationType}
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
                
                {formData.applicationType && (
                  <div className="mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600">
                          <Info className="h-4 w-4 mr-1" />
                          <span className="text-sm">What is this?</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        {formData.applicationType === 'coach' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Fitness Coach</h4>
                            <p className="text-sm">As a coach, you'll provide personalized fitness guidance to our users. You should have relevant certifications and experience in the fitness industry.</p>
                          </div>
                        )}
                        {formData.applicationType === 'affiliate' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Affiliate Partner</h4>
                            <p className="text-sm">Promote our products and services through your platform and earn commissions on sales generated through your unique referral links.</p>
                          </div>
                        )}
                        {formData.applicationType === 'taskforce' && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Taskforce Member</h4>
                            <p className="text-sm">Join our internal team to help manage products, inventory, and support customer needs. This is a staff position with administrative access.</p>
                          </div>
                        )}
                        {formData.applicationType === 'general' && (
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
                  {(formData.applicationType === 'coach' || formData.applicationType === 'taskforce') && 
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
                  value={formData.portfolioUrl}
                  onChange={handleChange}
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
                  value={formData.message}
                  onChange={handleChange}
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
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
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
    </div>
  );
};

export { ApplicationForm };
export default ApplicationFormPage;