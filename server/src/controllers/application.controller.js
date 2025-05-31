// server/src/controllers/application.controller.js
import Application from '../models/Application.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';

// Submit a new application
export const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, applicationType, message, portfolioUrl } = req.body;
    
    logger.info(`Processing application for ${name} (${email}), type: ${applicationType}`);
    
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
      logger.info(`Resume uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    }
    
    await newApplication.save();
    logger.info(`Application saved with ID: ${newApplication._id}`);
    
    // Email status tracking
    let emailStatus = {
      attempted: false,
      success: false,
      error: null,
      messageId: null
    };
    
    // Send confirmation email to the applicant
    try {
      logger.info(`Attempting to send confirmation email to ${email}`);
      emailStatus.attempted = true;
      
      const emailResult = await sendEmail({
        email,
        subject: 'Application Received - GymJams',
        message: `Dear ${name},\n\nThank you for submitting your application. We have received it and will review it shortly. You will be notified of any updates.\n\nBest regards,\nGymJams Team`
      });
      
      emailStatus.success = true;
      emailStatus.messageId = emailResult.messageId;
      logger.info(`Email sent successfully to ${email}, message ID: ${emailResult.messageId}`);
    } catch (emailError) {
      emailStatus.error = emailError.message;
      logger.error(`Failed to send confirmation email to ${email}:`, emailError);
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
      },
      emailStatus  // Include email status in the response
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

export const getApplications = async (req, res) => {
  try {
    const { status, type, excludeType } = req.query;
    
    // Create filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.applicationType = type;
    
    // If excludeType is specified, filter out that type
    if (excludeType) {
      // Handle multiple excluded types separated by commas
      if (excludeType.includes(',')) {
        const typesToExclude = excludeType.split(',');
        filter.applicationType = { $nin: typesToExclude };
      } else {
        filter.applicationType = { $ne: excludeType };
      }
    }
    
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
    
    // If application is approved, update user role based on application type
    if (status === 'approved' && application.email) {
      try {
        const user = await User.findOne({ email: application.email });
        
        if (user) {
          // Determine role based on application type
          let newRole = null;
          
          switch (application.applicationType) {
            case 'coach':
              newRole = 'coach';
              break;
            case 'taskforce':
              newRole = 'taskforce';
              break;
            case 'affiliate':
              newRole = 'affiliate';
              break;
            // For 'general' we don't change role
          }
          
          if (newRole) {
            // Update user role
            user.role = newRole;
            await user.save();
            logger.info(`Updated user ${user._id} (${user.email}) role to ${newRole} based on approved application`);
          }
        } else {
          logger.warn(`Approved application for ${application.email} but no matching user found to update role`);
        }
      } catch (userError) {
        logger.error('Error updating user role:', userError);
        // Continue even if role update fails
      }
    }
    
    // Send notification email to the applicant
    try {
      let emailMessage = '';
      
      if (status === 'approved') {
        emailMessage = `Dear ${application.name},\n\nWe are pleased to inform you that your application has been approved!\n\n`;
        
        if (application.applicationType === 'coach') {
          emailMessage += 'You have been granted Coach status. You can now set up your coaching profile and start receiving clients.\n\n';
        } else if (application.applicationType === 'taskforce') {
          emailMessage += 'You have been granted access to the TaskForce dashboard. Please log in to your account to access it.\n\n';
        } else if (application.applicationType === 'affiliate') {
          emailMessage += 'You have been approved as an Affiliate Partner. You can now access the affiliate tools in your account dashboard.\n\n';
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