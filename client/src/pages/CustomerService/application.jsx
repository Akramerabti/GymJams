import React, { useRef } from 'react';
import { Upload, Paperclip, Send, Info, CheckCircle } from 'lucide-react';
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
import { TextArea } from "@/components/ui/TextArea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
}) => {
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

const ApplicationFormPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
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
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      formDataToSend.append('applicationType', formData.applicationType);
      formDataToSend.append('message', formData.message);
      if (formData.portfolioUrl) formDataToSend.append('portfolioUrl', formData.portfolioUrl);
      if (resumeFile) formDataToSend.append('resume', resumeFile);
      
      const response = await applicationService.submitApplication(formDataToSend);
      
      // Show success message
      setSuccessMessage('Your application has been successfully submitted! We will review it and get back to you soon.');
      
      // Clear form after successful submission
      setFormData({
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
      
      // Redirect to home page after a delay
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)"
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