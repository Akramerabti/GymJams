// server/src/controllers/application.controller.js
import Application from '../models/Application.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';

// Submit a new application
export const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, applicationType, message, portfolioUrl } = req.body;
    
    // Create a new application
    const newApplication = new Application({
      name,
      email,
      phone,
      applicationType,
      message,
      portfolioUrl
    });
    
    // If there's a resume file uploaded, add its path
    if (req.file) {
      newApplication.resume = req.file.path;
    }
    
    await newApplication.save();
    
    // Send confirmation email to the applicant
    try {
      await sendEmail({
        email,
        subject: 'Application Received - GymJams',
        message: `Dear ${name},\n\nThank you for submitting your application. We have received it and will review it shortly. You will be notified of any updates.\n\nBest regards,\nGymJams Team`
      });
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
      // Continue even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: newApplication._id,
        name: newApplication.name,
        email: newApplication.email,
        type: newApplication.applicationType,
        status: newApplication.status
      }
    });
  } catch (error) {
    logger.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// Get all applications (for admin/taskforce)
export const getApplications = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    // Create filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.applicationType = type;
    
    const applications = await Application.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .select('-resume'); // Don't send resume file path in response
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    logger.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update the application
    application.status = status;
    if (feedback) application.feedback = feedback;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    
    await application.save();
    
    // Send notification email to the applicant
    try {
      let emailMessage = '';
      
      if (status === 'approved') {
        emailMessage = `Dear ${application.name},\n\nWe are pleased to inform you that your application has been approved!\n\n`;
        
        if (application.applicationType === 'coach') {
          emailMessage += 'You can now set up your coaching profile and start receiving clients.\n\n';
        } else if (application.applicationType === 'taskforce') {
          emailMessage += 'You have been granted access to the TaskForce dashboard. Please log in to your account to access it.\n\n';
          
          // If approved for taskforce, update user role
          if (application.email) {
            const user = await User.findOne({ email: application.email });
            if (user) {
              user.role = 'taskforce';
              await user.save();
            }
          }
        }
      } else if (status === 'rejected') {
        emailMessage = `Dear ${application.name},\n\nThank you for your interest in joining our platform. After careful review, we regret to inform you that we are unable to approve your application at this time.\n\n`;
        
        if (feedback) {
          emailMessage += `Feedback: ${feedback}\n\n`;
        }
        
        emailMessage += 'We encourage you to apply again in the future.\n\n';
      }
      
      emailMessage += 'Best regards,\nGymJams Team';
      
      await sendEmail({
        email: application.email,
        subject: `Application ${status.charAt(0).toUpperCase() + status.slice(1)} - GymJams`,
        message: emailMessage
      });
    } catch (emailError) {
      logger.error('Failed to send status update email:', emailError);
      // Continue even if email fails
    }
    
    res.status(200).json({
      success: true,
      message: `Application has been ${status}`,
      data: application
    });
  } catch (error) {
    logger.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// Delete application (admin only)
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    await Application.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};