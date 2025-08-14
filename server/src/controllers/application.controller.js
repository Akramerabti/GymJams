// server/src/controllers/application.controller.js
import Application from '../models/Application.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import supabaseStorageService from '../services/supabaseStorage.service.js';
import taskforceNotificationService from '../services/taskforceNotification.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Comprehensive email normalization function
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email;
  
  // Convert to lowercase and trim whitespace
  email = email.toLowerCase().trim();
  
  // Remove any surrounding quotes or brackets
  email = email.replace(/^["'<\[\(]+|["'>\]\)]+$/g, '');
  
  // Split email into local and domain parts
  const atIndex = email.lastIndexOf('@'); // Use lastIndexOf to handle edge cases
  if (atIndex === -1) return email;
  
  let localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);
  
  // Remove any leading/trailing dots, underscores, hyphens from local part
  localPart = localPart.replace(/^[._-]+|[._-]+$/g, '');
  
  // Define normalization rules by domain patterns
  const normalizationRules = {
    // Gmail and Google Workspace - remove dots and plus aliases
    'gmail.com': (local) => local.replace(/\./g, '').split('+')[0],
    'googlemail.com': (local) => local.replace(/\./g, '').split('+')[0],
    
    // Outlook/Hotmail - remove plus aliases but keep dots
    'outlook.com': (local) => local.split('+')[0],
    'hotmail.com': (local) => local.split('+')[0],
    'live.com': (local) => local.split('+')[0],
    'msn.com': (local) => local.split('+')[0],
    
    // Yahoo - remove plus aliases but keep dots
    'yahoo.com': (local) => local.split('+')[0],
    'yahoo.ca': (local) => local.split('+')[0],
    'yahoo.co.uk': (local) => local.split('+')[0],
    'yahoo.fr': (local) => local.split('+')[0],
    'ymail.com': (local) => local.split('+')[0],
    
    // Educational domains - normalize dots and common variations
    'mcgill.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'mail.mcgill.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'student.mcgill.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'concordia.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'uqam.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'umontreal.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'polymtl.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'hec.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    
    // More Canadian universities
    'utoronto.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'ubc.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'uwaterloo.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'carleton.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'uottawa.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    
    // Generic educational pattern (.edu, .ac.*, etc.)
    'edu': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'ac.uk': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
    'ac.ca': (local) => local.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, ''),
  };
  
  // Apply specific domain rules
  let normalizedLocal = localPart;
  let ruleApplied = false;
  
  // Check exact domain matches first
  if (normalizationRules[domain]) {
    normalizedLocal = normalizationRules[domain](localPart);
    ruleApplied = true;
  }
  // Check for educational domain patterns
  else if (domain.endsWith('.edu') || domain.includes('.ac.') || domain.endsWith('.ca')) {
    // For educational domains, normalize consecutive dots but preserve structure
    normalizedLocal = localPart.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '');
    ruleApplied = true;
  }
  // Google Workspace domains (any domain using Gmail infrastructure)
  else if (domain.includes('gmail') || domain.includes('googlemail')) {
    normalizedLocal = localPart.replace(/\./g, '').split('+')[0];
    ruleApplied = true;
  }
  
  // Generic normalization for unknown domains
  if (!ruleApplied) {
    // Remove plus aliases and normalize consecutive dots
    normalizedLocal = localPart.split('+')[0].replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '');
  }
  
  // Final cleanup - ensure no leading/trailing special characters
  normalizedLocal = normalizedLocal.replace(/^[._-]+|[._-]+$/g, '');
  
  return `${normalizedLocal}@${domain}`;
};

const generateEmailVariations = (email) => {
      if (!email) return [];
      
      const variations = new Set([email]); // Use Set to avoid duplicates
      const cleanEmail = email.toLowerCase().trim();
      variations.add(cleanEmail);
      
      if (!cleanEmail.includes('@')) return Array.from(variations);
      
      const [localPart, domain] = cleanEmail.split('@');
      
      // Add normalized version
      const normalized = normalizeEmail(cleanEmail);
      variations.add(normalized);
      
      // For Gmail specifically, add COMPREHENSIVE variations including reverse engineering
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        // Always add version without dots
        variations.add(`${localPart.replace(/\./g, '')}@${domain}`);
        
        // If no dots in original, try to reconstruct common patterns
        if (!localPart.includes('.') && localPart.length > 4) {
          // Try common prefix patterns
          const prefixMatch = localPart.match(/^(auth|user|admin|test|demo|dev)(.+)$/);
          if (prefixMatch && prefixMatch[2].length > 0) {
            variations.add(`${prefixMatch[1]}.${prefixMatch[2]}@${domain}`);
          }
          
          // Try common suffix patterns  
          const suffixMatch = localPart.match(/^(.+)(system|vd|test|dev|prod)$/);
          if (suffixMatch && suffixMatch[1].length > 0) {
            variations.add(`${suffixMatch[1]}.${suffixMatch[2]}@${domain}`);
          }
        }
        
        // If dots exist, also add version without dots
        if (localPart.includes('.')) {
          variations.add(`${localPart.replace(/\./g, '')}@${domain}`);
        }
      }
      
      // For educational domains, add version with single dots
      if (domain.endsWith('.edu') || domain.includes('.ac.') || domain.endsWith('.ca')) {
        variations.add(`${localPart.replace(/\.+/g, '.')}@${domain}`);
        // Also add version without dots for very dot-heavy addresses
        if (localPart.split('.').length > 3) {
          variations.add(`${localPart.replace(/\./g, '')}@${domain}`);
        }
      }
      
      return Array.from(variations);
    };

export const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, applicationType, message, portfolioUrl } = req.body;
    
    // Generate email variations for duplicate checking
    const emailVariations = generateEmailVariations(email);
    
    logger.info(`[APPLICATION] Submitting application with email: ${email}, variations: ${emailVariations.join(', ')}`);
    
    // Check for existing applications with same email variations
    const existingApplications = await Application.find({ 
      email: { $in: emailVariations }, 
      applicationType: applicationType 
    });
    
    if (existingApplications.length > 0) {
      logger.info(`[APPLICATION] Found ${existingApplications.length} existing applications to remove for email variations`);
      
      const removedIds = existingApplications.map(app => app._id);
      await Application.deleteMany({ 
        email: { $in: emailVariations }, 
        applicationType: applicationType 
      });
      
      logger.info(`[APPLICATION] Removed existing applications: ${removedIds.join(', ')}`);
    }
    
    // NEW: Try to find existing user account and use THEIR email format
    let emailToStore = email; // Default to submitted email
    
    try {
      const existingUser = await User.findOne({ 
        email: { $in: emailVariations }
      });
      
      if (existingUser) {
        emailToStore = existingUser.email; // Use the user's actual email format
        logger.info(`[APPLICATION] Found existing user with email: ${existingUser.email}, will store application with this email instead of: ${email}`);
      } else {
        logger.info(`[APPLICATION] No existing user found for email variations, storing with submitted email: ${email}`);
      }
    } catch (userLookupError) {
      logger.warn(`[APPLICATION] Error looking up existing user: ${userLookupError.message}, proceeding with submitted email`);
    }
    
    const newApplication = new Application({
      name,
      email: emailToStore, // Store the user's actual email (or submitted email if no user found)
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
        logger.info(`[APPLICATION] Resume uploaded to Supabase: ${uploadResult.url}`);
      } catch (uploadError) {
        logger.error('[APPLICATION] Error uploading resume to Supabase:', uploadError);
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
      
      // Send email to the email we stored (which is now the user's actual email)
      const emailResult = await sendEmail({
        email: emailToStore,
        subject: 'Application Received - GymTonic',
        message: `Dear ${name},\n\nThank you for submitting your application. We have received it and will review it shortly. You will be notified of any updates.\n\nBest regards,\nGymTonic Team`
      });
      
      emailStatus.success = true;
      emailStatus.messageId = emailResult.messageId;
    } catch (emailError) {
      emailStatus.error = emailError.message;
    }

    // **NEW: Notify taskforce about new application**
    let taskforceNotificationStatus = {
      attempted: false,
      success: false,
      notified: 0,
      error: null
    };

    try {
      taskforceNotificationStatus.attempted = true;
      
      const notificationResult = await taskforceNotificationService.notifyNewApplication(newApplication);
      
      taskforceNotificationStatus.success = notificationResult.success;
      taskforceNotificationStatus.notified = notificationResult.notified;
      
      if (!notificationResult.success) {
        taskforceNotificationStatus.error = notificationResult.error;
      }
      
      logger.info(`[APPLICATION] Taskforce notification result: ${JSON.stringify(notificationResult)}`);
    } catch (notificationError) {
      taskforceNotificationStatus.error = notificationError.message;
      logger.error('[APPLICATION] Error notifying taskforce:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: newApplication._id,
        name: newApplication.name,
        email: newApplication.email, // Return the email we actually stored
        type: newApplication.applicationType,
        status: newApplication.status
      },
      emailStatus,
      taskforceNotificationStatus // Include taskforce notification status
    });
  } catch (error) {
    logger.error('[APPLICATION] Error submitting application:', error);
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
    logger.error('[APPLICATION] Error fetching applications:', error);
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

function validateAttachmentSize(buffer, filename, maxSizeMB = 8) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (buffer.length > maxSizeBytes) {
    logger.warn(`Attachment ${filename} is too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: ${maxSizeMB}MB)`);
    return false;
  }
  return true;
}

// Helper function to create a proper PDF fallback
function createPDFFallback(fileInfo, application) {
  // Create a minimal PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(GymTonic ${fileInfo.title}) Tj
0 -20 Td
(This is a fallback document) Tj
0 -20 Td
(Name: ${application.name}) Tj
0 -20 Td
(Type: ${capitalizeFirstLetter(application.applicationType)}) Tj
0 -20 Td
(Please contact support@gymtonic.com) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
554
%%EOF`;
  
  return Buffer.from(pdfContent);
}


export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, signedDocumentReceived } = req.body;
    
    logger.info(`[DEBUG] updateApplicationStatus - Request received to update application ${id} to status: ${status}`);
    
    // Validate status
    if (!['pending', 'awaiting', 'received', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      logger.warn(`[DEBUG] Application with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    logger.info(`[DEBUG] Application found: ${application.name} (${application.email}), current status: ${application.status}, new status: ${status}`);
    
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
      logger.info(`[DEBUG] Processing transition from 'pending' to 'awaiting' for application ${id}`);
      // Initial approval - Send documents to sign
      try {
        // Create the templates directory if it doesn't exist
        const templatesDir = path.join(__dirname, '../../templates');
       logger.info(`[DEBUG] Templates directory path: ${templatesDir}`);
        
        try {
          await fs.mkdir(templatesDir, { recursive: true });
          logger.info(`[DEBUG] Templates directory created or already exists`);
        } catch (mkdirError) {
          logger.error(`[ERROR] Failed to create templates directory: ${mkdirError.message}`);
        }
        
        // Prepare files for email attachments with better error handling
        const attachments = [];
        const filesToAttach = getFilesToAttachByType(application.applicationType);
        logger.info(`[DEBUG] Files to attach for type '${application.applicationType}': ${JSON.stringify(filesToAttach)}`);
        
        // Process each file with proper error handling
        for (const fileInfo of filesToAttach) {
          const filePath = path.join(templatesDir, fileInfo.filename);
          logger.info(`[DEBUG] Preparing to attach file: ${filePath}`);
          
          try {
            // Check if file exists first
            await fs.access(filePath);
            const buffer = await fs.readFile(filePath);
            
            // Validate file size
            if (!validateAttachmentSize(buffer, fileInfo.filename)) {
              logger.warn(`[WARNING] Skipping ${fileInfo.filename} due to size limit`);
              continue;
            }
            
            // Validate it's actually a PDF (basic check)
            if (!buffer.toString('binary', 0, 4).startsWith('%PDF')) {
              logger.warn(`[WARNING] File ${fileInfo.filename} doesn't appear to be a valid PDF`);
              // Create a proper PDF fallback
              const fallbackBuffer = createPDFFallback(fileInfo, application);
              attachments.push({
                filename: fileInfo.filename,
                content: fallbackBuffer,
                contentType: 'application/pdf'
              });
            } else {
              logger.info(`[DEBUG] Successfully read valid PDF file: ${fileInfo.filename}, size: ${buffer.length} bytes`);
              attachments.push({
                filename: fileInfo.filename,
                content: buffer,
                contentType: 'application/pdf'
              });
            }
          } catch (fileError) {
            logger.error(`[ERROR] Failed to read file ${fileInfo.filename}: ${fileError.message}`);
            
            // Create a proper PDF fallback for missing files
            const fallbackBuffer = createPDFFallback(fileInfo, application);
            
            // Try to save the fallback file for future use
            try {
              await fs.writeFile(filePath, fallbackBuffer);
              logger.info(`[DEBUG] Created fallback PDF file: ${fileInfo.filename}`);
            } catch (writeError) {
              logger.error(`[ERROR] Failed to write fallback file: ${writeError.message}`);
            }
            
            attachments.push({
              filename: fileInfo.filename,
              content: fallbackBuffer,
              contentType: 'application/pdf'
            });
          }
        }
        
        logger.info(`[DEBUG] Prepared ${attachments.length} attachments for email`);
        
        // Validate total attachment size
        const totalSize = attachments.reduce((sum, att) => sum + att.content.length, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        logger.info(`[DEBUG] Total attachment size: ${totalSizeMB}MB`);
        
        if (totalSize > 8 * 1024 * 1024) { // 8MB limit
          logger.error(`[ERROR] Total attachment size too large: ${totalSizeMB}MB`);
          return res.status(500).json({
            success: false,
            message: 'Attachment files are too large to send via email',
            error: `Total size: ${totalSizeMB}MB (max: 8MB)`
          });
        }
        
        // Send email with attachments using Brevo - with retry logic
        let emailResult;
        let emailAttempts = 0;
        const maxEmailAttempts = 3;
        
        while (emailAttempts < maxEmailAttempts) {
          try {
            emailAttempts++;
            logger.info(`[DEBUG] Email attempt ${emailAttempts}/${maxEmailAttempts}`);
            
            emailResult = await sendEmail({
              email: application.email, // Use the normalized email from database
              subject: `Your ${capitalizeFirstLetter(application.applicationType)} Application - Documents Required`,
              message: `Dear ${application.name},

We are pleased to inform you that your application to join GymTonic as a ${capitalizeFirstLetter(application.applicationType)} has been initially approved!

Please review the attached documents carefully. These contain important information about the role, our expectations, and the agreement that needs to be signed.

To complete the process, please:
1. Review all attached documents
2. Sign the agreement document (you can print, sign and scan, or use a digital signature)
   - **Alternatively, you may take screenshots of the filled-in sections and send those back as well.**
   - For digital signing, you may use any free online service such as:
     • DocHub (https://dochub.com/)
     • PDFescape (https://www.pdfescape.com/)
     • Adobe Fill & Sign (https://www.adobe.com/acrobat/online/fill-sign-pdf.html)
   These services allow you to upload, sign, and download your signed PDF easily.
  
3. Reply to this email with the signed document (or screenshots) attached to it.

Once we receive and verify your signed document, your account will be updated with the appropriate permissions.

If you have any questions about the documents or the process, please don't hesitate to contact us at support@gymtonic.com.

Best regards,
The GymTonic Team`,
              attachments: attachments.length > 0 ? attachments : undefined
            });
            
            // If we get here, email was successful
            break;
          } catch (emailError) {
            logger.error(`[ERROR] Email attempt ${emailAttempts} failed: ${emailError.message}`);
            
            if (emailAttempts >= maxEmailAttempts) {
              // If all attempts failed, try sending without attachments as fallback
              logger.warn(`[WARNING] All email attempts with attachments failed, trying without attachments`);
              
              try {
                emailResult = await sendEmail({
                  email: application.email,
                  subject: `Your ${capitalizeFirstLetter(application.applicationType)} Application - Initially Approved`,
                  message: `Dear ${application.name},

We are pleased to inform you that your application to join GymTonic as a ${capitalizeFirstLetter(application.applicationType)} has been initially approved!

Due to technical issues with our email system, we were unable to attach the required documents to this email. 

Please contact us at support@gymtonic.com and we will send you the documents through an alternative method.

Best regards,
The GymTonic Team`
                });
                
                logger.info(`[DEBUG] Fallback email (without attachments) sent successfully`);
              } catch (fallbackError) {
                logger.error(`[ERROR] Even fallback email failed: ${fallbackError.message}`);
                throw new Error(`Failed to send email after ${maxEmailAttempts} attempts: ${emailError.message}`);
              }
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * emailAttempts));
            }
          }
        }
        
        logger.info(`[DEBUG] Email sent to ${application.email} with ${attachments.length} attachments. Result: ${JSON.stringify(emailResult)}`);
        
        // Set document sent fields
        application.documentSent = true;
        application.documentSentAt = new Date();
      } catch (emailError) {
        logger.error(`[ERROR] Error in email sending process: ${emailError.message}`);
        logger.error(`[ERROR] Full error: ${JSON.stringify(emailError)}`);
        logger.error(`[ERROR] Error stack: ${emailError.stack}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to send document for signing',
          error: emailError.message
        });
      }
    } else if (status === 'approved' && application.signedDocumentPath) {
      // Final approval after document is signed - Update user role
      try {
         let user = await User.findOne({ 
          email: application.email // Direct lookup since we store the actual user email
        });
        
        // Fallback: if direct lookup fails, try variations (for old applications)
        if (!user) {
          logger.info(`[DEBUG] Direct email lookup failed for ${application.email}, trying variations...`);
          const emailVariations = generateEmailVariations(application.email);
          
          user = await User.findOne({ 
            email: { $in: emailVariations }
          });
          
          if (user) {
            logger.info(`[DEBUG] Found user via variations: ${user.email} for application email: ${application.email}`);
            // Update the application to use the correct email for future lookups
            application.email = user.email;
            await application.save();
            logger.info(`[DEBUG] Updated application email from ${application.email} to ${user.email}`);
          }
        }
        
        if (user) {
          logger.info(`[DEBUG] Found user: ${user.email} (ID: ${user._id})`);
        } else {
          logger.warn(`[DEBUG] No user found for application email: ${application.email}`);
        }
        
        if (user) {
          logger.info(`[DEBUG] Found user: ${user.email} (ID: ${user._id}) for application email: ${application.email}`);
        } else {
          logger.warn(`[DEBUG] No user found for application email: ${application.email}. Checked variations: ${emailVariations.join(', ')}`);
          
          // Additional debugging: Let's see what users actually exist with similar emails
          const partialMatch = await User.findOne({ 
            email: { $regex: application.email.split('@')[0].replace(/\./g, ''), $options: 'i' } 
          });
          if (partialMatch) {
            logger.info(`[DEBUG] Found partial match user: ${partialMatch.email} - this might be the account we're looking for`);
          }
        }
        
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
          logger.warn(`Approved application for ${application.email} but no matching user found to update role. Checked variations: ${emailVariations.join(', ')}`);
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
    
    logger.info(`[DEBUG] Application ${id} successfully updated to status: ${status}`);
    
    res.status(200).json({
      success: true,
      message: getStatusUpdateMessage(status),
      data: application
    });
  } catch (error) {
    logger.error(`[ERROR] Unhandled error in updateApplicationStatus: ${error.message}`);
    logger.error(`[ERROR] Error stack: ${error.stack}`);
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
      
      logger.info(`[APPLICATION] Signed document uploaded to Supabase: ${uploadResult.url}`);
      
      res.status(200).json({
        success: true,
        message: 'Signed document received and recorded',
        data: application
      });
    } catch (uploadError) {
      logger.error('[APPLICATION] Error uploading signed document to Supabase:', uploadError);
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
    });
  }
};

// Helper function to find application by email with comprehensive normalization
export const findApplicationByEmail = async (email, applicationType = null) => {
  try {
    const emailVariations = generateEmailVariations(email);
    
    const query = { 
      email: { $in: emailVariations }
    };
    
    if (applicationType) {
      query.applicationType = applicationType;
    }
    
    const application = await Application.findOne(query).sort({ updatedAt: -1 });
    
    logger.info(`[APPLICATION] Email lookup for ${email}: found ${application ? 'YES' : 'NO'}, variations checked: ${emailVariations.join(', ')}`);
    
    return application;
  } catch (error) {
    logger.error(`[APPLICATION] Error finding application by email ${email}:`, error);
    return null;
  }
};

// Utility function to get all applications for a user by email (useful for admin views)
export const getApplicationsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    const emailVariations = generateEmailVariations(email);
    
    const applications = await Application.find({
      email: { $in: emailVariations }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      emailVariations,
      data: applications
    });
  } catch (error) {
    logger.error('[APPLICATION] Error fetching applications by email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by email',
      error: error.message
    });
  }
};

// Utility function to update existing applications when email normalization rules change
export const migrateEmailNormalization = async (req, res) => {
  try {
    // Only allow this for admin users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const applications = await Application.find({});
    let updatedCount = 0;
    
    for (const application of applications) {
      const originalEmail = application.email;
      const normalizedEmail = normalizeEmail(originalEmail);
      
      if (originalEmail !== normalizedEmail) {
        application.email = normalizedEmail;
        await application.save();
        updatedCount++;
        logger.info(`[MIGRATION] Updated application ${application._id}: ${originalEmail} -> ${normalizedEmail}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} applications.`,
      totalApplications: applications.length,
      updatedCount
    });
  } catch (error) {
    logger.error('[MIGRATION] Error migrating email normalization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate email normalization',
      error: error.message
    });
  }
};

export const migrateApplicationsToUserEmails = async (req, res) => {
  try {
    // Only allow this for admin users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const applications = await Application.find({});
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const application of applications) {
      const originalEmail = application.email;
      
      try {
        // Generate variations to find the user
        const emailVariations = generateEmailVariations(originalEmail);
        
        const user = await User.findOne({ 
          email: { $in: emailVariations }
        });
        
        if (user && user.email !== originalEmail) {
          // Update application to use user's actual email
          application.email = user.email;
          await application.save();
          updatedCount++;
          logger.info(`[MIGRATION] Updated application ${application._id}: ${originalEmail} -> ${user.email}`);
        } else if (!user) {
          notFoundCount++;
          logger.info(`[MIGRATION] No user found for application ${application._id} with email ${originalEmail}`);
        }
      } catch (error) {
        logger.error(`[MIGRATION] Error processing application ${application._id}:`, error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} applications. ${notFoundCount} applications have no matching user.`,
      totalApplications: applications.length,
      updatedCount,
      notFoundCount
    });
  } catch (error) {
    logger.error('[MIGRATION] Error migrating applications to user emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate applications',
      error: error.message
    });
  }
};

export { normalizeEmail, generateEmailVariations };
