// server/src/controllers/application.controller.js
import Application from '../models/Application.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import supabaseStorageService from '../services/supabaseStorage.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, applicationType, message, portfolioUrl } = req.body;
      // Remove any existing applications with the same email AND applicationType
    const existingApplications = await Application.find({ 
      email: email, 
      applicationType: applicationType 
    });
    
    if (existingApplications.length > 0) {
      
      const removedIds = existingApplications.map(app => app._id);
      await Application.deleteMany({ 
        email: email, 
        applicationType: applicationType 
      });

    }
      const newApplication = new Application({
      name,
      email,
      phone,
      applicationType,
      message,
      portfolioUrl
    });
    
    if (req.file) {
      try {
        // Upload resume to Supabase
        const uploadResult = await supabaseStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          'resumes' // folder name
        );
        
        // Store Supabase URL in database
        newApplication.resume = uploadResult.url;
        //(`[APPLICATION] Resume uploaded to Supabase: ${uploadResult.url}`);
      } catch (uploadError) {
        console.error('[APPLICATION] Error uploading resume to Supabase:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload resume',
          error: uploadError.message
        });
      }
    }
    
    await newApplication.save();

    let emailStatus = {
      attempted: false,
      success: false,
      error: null,
      messageId: null
    };

    try {
      emailStatus.attempted = true;
      
      const emailResult = await sendEmail({
        email,
        subject: 'Application Received - GymTonic',
        message: `Dear ${name},\n\nThank you for submitting your application. We have received it and will review it shortly. You will be notified of any updates.\n\nBest regards,\nGymTonic Team`
      });
      
      emailStatus.success = true;
      emailStatus.messageId = emailResult.messageId;
    } catch (emailError) {
      emailStatus.error = emailError.message;
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
      emailStatus
    });
  } catch (error) {
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

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.applicationType = type;
  
    if (excludeType) {
      if (excludeType.includes(',')) {
        const typesToExclude = excludeType.split(',');
        filter.applicationType = { $nin: typesToExclude };
      } else {
        filter.applicationType = { $ne: excludeType };
      }
    }
      const applications = await Application.find(filter)
      .sort({ createdAt: -1 }); 
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

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

// Helper function to get document template based on application type
function getDocumentTemplate(applicationType) {
  switch(applicationType) {
    case 'coach':
      return { filename: 'coach_agreement.pdf', title: 'Coaching Agreement' };
    case 'taskforce':
      return { filename: 'taskforce_agreement.pdf', title: 'TaskForce Member Agreement' };
    case 'affiliate':
      return { filename: 'affiliate_agreement.pdf', title: 'Affiliate Partner Agreement' };
    case 'general':
    default:
      return { filename: 'general_agreement.pdf', title: 'General Employment Agreement' };
  }
}

// Helper function to determine which files to attach based on application type
function getFilesToAttachByType(applicationType) {
  const commonDocs = [];
  
  switch(applicationType) {
    case 'coach':
      return [
        { filename: 'coach_agreement.pdf', title: 'Coaching Agreement' },
        { filename: 'Subscription_Tiers_Guidelines.pdf', title: 'Subscription Tiers Guidelines' }
      ];
    case 'taskforce':
      return [
        { filename: 'taskforce_agreement.pdf', title: 'TaskForce Member Agreement' },
        { filename: 'Subscription_Tiers_Guidelines.pdf', title: 'Subscription Tiers Guidelines' }
      ];
    case 'affiliate':
      return [
        { filename: 'affiliate_agreement.pdf', title: 'Affiliate Partner Agreement' },
        { filename: 'Subscription_Tiers_Guidelines.pdf', title: 'Subscription Tiers Guidelines' }
      ];
    case 'support':
      return [
        { filename: 'support_agreement.pdf', title: 'Support Team Agreement' }
      ];
    case 'general':
    default:
      return [
        { filename: 'general_agreement.pdf', title: 'General Employment Agreement' }
      ];
  }
}

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, signedDocumentReceived } = req.body;
    
    //(`[DEBUG] updateApplicationStatus - Request received to update application ${id} to status: ${status}`);
      // Validate status
    if (!['pending', 'awaiting', 'received', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      //(`[DEBUG] Application with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
      //(`[DEBUG] Application found: ${application.name} (${application.email}), current status: ${application.status}, new status: ${status}`);
    
    // Store the original status before updating
    const originalStatus = application.status;
    
    // Handle signed document receipt (when a taskforce member confirms receipt)
    if (signedDocumentReceived) {
      if (req.file) {
        application.signedDocumentPath = req.file.path;
        application.signedDocumentReceivedAt = new Date();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Signed document is required'
        });
      }
    }
    
    // Update the application
    application.status = status;
    if (feedback) application.feedback = feedback;
    application.reviewedBy = req.user?.id || 'SYSTEM';
    application.reviewedAt = new Date();
    
    // Handle the approval process based on the original status and the new status
    if (originalStatus === 'pending' && status === 'awaiting') {
      //(`[DEBUG] Processing transition from 'pending' to 'awaiting' for application ${id}`);
      // Initial approval - Send documents to sign
      try {
        // Create the templates directory if it doesn't exist
        const templatesDir = path.join(__dirname, '../../templates');
        //(`[DEBUG] Templates directory path: ${templatesDir}`);
        
        try {
          await fs.mkdir(templatesDir, { recursive: true });
          //(`[DEBUG] Templates directory created or already exists`);
        } catch (mkdirError) {
          console.error(`[ERROR] Failed to create templates directory: ${mkdirError.message}`);
        }
        
        // Prepare files for email attachments
        const attachments = [];
        const filePromises = [];
        const filesToAttach = getFilesToAttachByType(application.applicationType);
        //(`[DEBUG] Files to attach for type '${application.applicationType}': ${JSON.stringify(filesToAttach)}`);
        
        for (const fileInfo of filesToAttach) {
          const filePath = path.join(templatesDir, fileInfo.filename);
          //(`[DEBUG] Preparing to attach file: ${filePath}`);
          filePromises.push(
            fs.readFile(filePath)
              .then(buffer => {
                //(`[DEBUG] Successfully read file: ${fileInfo.filename}, size: ${buffer.length} bytes`);
                attachments.push({
                  filename: fileInfo.filename,
                  content: buffer,
                  contentType: 'application/pdf'
                });
              })
              .catch(async (err) => {
                console.error(`[ERROR] Failed to read file ${fileInfo.filename}: ${err.message}`);
                
                // Create fallback content for missing files
                const fallbackContent = `
GymTonic ${fileInfo.title}
------------------------------------------------------

THIS IS A FALLBACK DOCUMENT - Template was not found

This document should contain the ${fileInfo.title} for ${application.name}.

Date: ${new Date().toLocaleDateString()}
Name: ${application.name}
Application Type: ${capitalizeFirstLetter(application.applicationType)}

Please contact support@gymtonic.com for the official document.

------------------------------------------------------
                `;
                
                const fallbackBuffer = Buffer.from(fallbackContent);
                
                // Try to save the fallback file
                try {
                  await fs.writeFile(filePath, fallbackBuffer);
                  //(`[DEBUG] Created fallback file: ${fileInfo.filename}`);
                } catch (writeError) {
                  console.error(`[ERROR] Failed to write fallback file: ${writeError.message}`);
                }
                
                attachments.push({
                  filename: fileInfo.filename,
                  content: fallbackBuffer,
                  contentType: 'application/pdf'
                });
              })
          );
        }
        
        await Promise.all(filePromises);
        //(`[DEBUG] Prepared ${attachments.length} attachments for email`);
        
        // Send email with attachments using Brevo
        const emailResult = await sendEmail({
          email: application.email,
          subject: `Your ${capitalizeFirstLetter(application.applicationType)} Application - Documents Required`,
          message: `Dear ${application.name},

We are pleased to inform you that your application to join GymTonic as a ${capitalizeFirstLetter(application.applicationType)} has been initially approved!

Please review the attached documents carefully. These contain important information about the role, our expectations, and the agreement that needs to be signed.

To complete the process, please:
1. Review all attached documents
2. Sign the agreement document (you can print, sign and scan, or use a digital signature)
3. Reply to this email with the signed document attached to it.

Once we receive and verify your signed document, your account will be updated with the appropriate permissions.

If you have any questions about the documents or the process, please don't hesitate to contact us at support@gymtonic.com.

Best regards,
The GymTonic Team`,
          attachments: attachments
        });
        
        //(`[DEBUG] Email sent to ${application.email} with ${attachments.length} attachments. Result: ${JSON.stringify(emailResult)}`);
        
        // Set document sent fields
        application.documentSent = true;
        application.documentSentAt = new Date();
      } catch (emailError) {
        console.error(`[ERROR] Error sending document for signing: ${emailError.message}`);
        console.error(`[ERROR] Full error: ${JSON.stringify(emailError)}`);
        console.error(`[ERROR] Error stack: ${emailError.stack}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to send document for signing',
          error: emailError.message
        });
      }
    } else if (status === 'approved' && application.signedDocumentPath) {
      // Final approval after document is signed - Update user role
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
        
        // Send final confirmation email
        await sendEmail({
          email: application.email,
          subject: `Your GymTonic ${capitalizeFirstLetter(application.applicationType)} Application - Approved`,
          message: `Dear ${application.name},

We are pleased to inform you that your application to join GymTonic as a ${application.applicationType} has been fully approved!

Your account has now been updated with all the necessary permissions and access rights. You can log in to your account to start using your new role.

Thank you for joining our team!

Best regards,
GymTonic Team`
        });
      } catch (error) {
        logger.error('Error updating user role:', error);
        // Continue even if role update fails
      }
    } else if (status === 'rejected') {
      // Handle rejection email
      try {
        let emailMessage = `Dear ${application.name},\n\nThank you for your interest in joining our platform. After careful review, we regret to inform you that we are unable to approve your application at this time.\n\n`;
        
        if (feedback) {
          emailMessage += `Feedback: ${feedback}\n\n`;
        }
        
        emailMessage += 'We encourage you to apply again in the future.\n\nBest regards,\nGymTonic Team';
        
        await sendEmail({
          email: application.email,
          subject: `Application ${status.charAt(0).toUpperCase() + status.slice(1)} - GymTonic`,
          message: emailMessage
        });
      } catch (emailError) {
        logger.error('Failed to send status update email:', emailError);
        // Continue even if email fails
      }
    }
    
    await application.save();
    
    //(`[DEBUG] Application ${id} successfully updated to status: ${status}`);
    
    res.status(200).json({
      success: true,
      message: getStatusUpdateMessage(status),
      data: application
    });
  } catch (error) {
    console.error(`[ERROR] Unhandled error in updateApplicationStatus: ${error.message}`);
    console.error(`[ERROR] Error stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// Helper function to check if file exists
async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to return appropriate status message
function getStatusUpdateMessage(status) {
  switch(status) {
    case 'awaiting':
      return 'Application has been initially approved. Documents sent for signing.';
    case 'approved':
      return 'Application has been fully approved and user role has been updated.';
    case 'rejected':
      return 'Application has been rejected.';
    default:
      return `Application status has been updated to ${status}.`;
  }
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Handler for receiving signed documents
export const receiveSignedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Signed document file is required'
      });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    try {
      // Upload signed document to Supabase
      const uploadResult = await supabaseStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'signed-documents' // folder name
      );
      
      // Update application with signed document info
      application.signedDocumentPath = uploadResult.url; // Use Supabase URL
      application.signedDocumentReceivedAt = new Date();
      application.status = 'received'; // Update status to indicate document received
      
      await application.save();
      
      //(`[APPLICATION] Signed document uploaded to Supabase: ${uploadResult.url}`);
      
      res.status(200).json({
        success: true,
        message: 'Signed document received and recorded',
        data: application
      });
    } catch (uploadError) {
      console.error('[APPLICATION] Error uploading signed document to Supabase:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload signed document',
        error: uploadError.message
      });
    }
  } catch (error) {
    logger.error('Error receiving signed document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process signed document',
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
    });  }
};