// server/src/controllers/emailWebhook.controller.js
// ONLY processes signed documents for applications - NO SUPPORT TICKETS
import Application from '../models/Application.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';
import supabaseStorageService from '../services/supabaseStorage.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasSignedDocuments = (attachments, bodyPlain, strippedText) => {
  if (!attachments || attachments.length === 0) {
    return false;
  }
  
  const text = (strippedText || bodyPlain || '').toLowerCase();
  const signatureKeywords = ['signed', 'completed', 'document', 'agreement', 'contract', 'form'];
  
  const hasKeywords = signatureKeywords.some(keyword => text.includes(keyword));
  
  const hasValidAttachments = attachments.some(att => {
    const filename = att.filename?.toLowerCase() || '';
    
    const isSignedFile = filename.includes('signed') || 
           filename.includes('completed') || 
           filename.includes('agreement') ||
           filename.endsWith('.pdf') ||
           filename.endsWith('.doc') ||
           filename.endsWith('.docx');
    
    return isSignedFile;
  });
  
  return hasKeywords || hasValidAttachments;
};

const saveAttachmentsFromMailgun = async (messageUrl, attachments, applicationId, messageData = null) => {
  const savedFiles = [];
  
  if (!attachments || attachments.length === 0) {
    return savedFiles;
  }
  
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const fileExtension = path.extname(attachment.filename || '.pdf');
      const safeFilename = `signed_${applicationId}_${timestamp}_${random}${fileExtension}`;
      
      let fileBuffer;
      
      // Handle multipart form data with buffer (from req.files)
      if (attachment.buffer && messageUrl === 'multipart-form-data') {
        fileBuffer = attachment.buffer;
      }
      // Handle test data or placeholder attachments
      else if (messageUrl === 'test-message-url' || messageUrl === 'accepted-event-no-storage' || !messageUrl || !process.env.MAILGUN_API_KEY) {
        // Create a placeholder file for testing or when real attachment isn't available
        let placeholderContent;
        if (messageUrl === 'accepted-event-no-storage') {
          placeholderContent = `Document received via email notification
Email processed through Mailgun webhook (accepted event)
Original filename: ${attachment.filename}
Received at: ${new Date().toISOString()}
Application ID: ${applicationId}

Note: This is a placeholder file indicating that a document was received via email.
The actual document content may need to be retrieved separately or the sender
may need to be contacted to resend the attachment.`;
        } else {
          placeholderContent = `Test attachment: ${attachment.filename}\nCreated at: ${new Date().toISOString()}\nApplication ID: ${applicationId}`;
        }
        
        fileBuffer = Buffer.from(placeholderContent);
      }
      // Download from Mailgun storage for real webhooks
      else {
        // For stored messages, we need to use the attachment key/filename, not index
        const attachmentKey = encodeURIComponent(attachment.filename);
        const attachmentUrl = `${messageUrl}/attachments/${attachmentKey}`;
        
        // Create authorization header for Mailgun API
        const auth = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64');
        
        const response = await fetch(attachmentUrl, {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });
        
        if (!response.ok) {
          // If direct attachment download fails, try alternative methods
          // Sometimes Mailgun stores attachments differently, let's try index-based
          const indexBasedUrl = `${messageUrl}/attachments/${i}`;
          
          const indexResponse = await fetch(indexBasedUrl, {
            headers: {
              'Authorization': `Basic ${auth}`
            }
          });
          
          if (!indexResponse.ok) {
            continue;
          }
          
          fileBuffer = await indexResponse.buffer();
        } else {
          fileBuffer = await response.buffer();
        }
      }
      
      if (fileBuffer) {
        try {
          // Upload to Supabase storage
          const uploadResult = await supabaseStorageService.uploadFile(
            fileBuffer,
            safeFilename,
            'signed-documents' // folder name
          );
          
          savedFiles.push({
            originalName: attachment.filename,
            savedPath: uploadResult.url, // Use Supabase URL instead of local path
            contentType: attachment['content-type'] || 'application/octet-stream',
            size: fileBuffer.length
          });
        } catch (uploadError) {
          logger.error(`Failed to upload attachment ${attachment.filename} to Supabase:`, uploadError);
          // Continue with other attachments even if one fails
        }
      }
      
    } catch (error) {
      logger.error(`Failed to process attachment ${attachment.filename}:`, error);
    }
  }
  
  return savedFiles;
};

// Main email webhook handler
export const handleEmailWebhook = async (req, res) => {
  try {
    // Immediate response for OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }

    // Check if this is not an incoming email event we care about
    if (req.body.event && req.body.event !== 'accepted') {
      return res.status(200).json({ 
        status: 'ignored', 
        message: `Event type '${req.body.event}' ignored - only processing 'accepted' events for incoming emails` 
      });
    }

    // Initialize variables for email data
    let sender, recipient, subject, bodyPlain, strippedText, attachments = [], messageUrl = '';

    // Handle multipart/form-data from Mailgun "accepted" event
    if (req.body.event === 'accepted' || req.files?.length > 0) {
      // Extract basic email metadata from form data
      sender = req.body.sender || req.body.from || req.body.From;
      recipient = req.body.recipient || req.body.to || req.body.To;
      subject = req.body.subject || req.body.Subject;
      bodyPlain = req.body['body-plain'] || req.body.bodyPlain || req.body['stripped-text'] || req.body.strippedText || '';
      strippedText = req.body['stripped-text'] || req.body.strippedText || bodyPlain;
      
      // Process uploaded files from multipart data
      if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => ({
          filename: file.originalname,
          'content-type': file.mimetype,
          size: file.size,
          buffer: file.buffer // Store the actual file data
        }));
      }
      
      // Set a placeholder message URL for multipart data
      messageUrl = 'multipart-form-data';
    } else if (req.body.From || req.body.from) {
      // Real Mailgun webhook format (legacy or different event type)
      sender = req.body.From || req.body.from;
      recipient = req.body.To || req.body.to;
      subject = req.body.Subject || req.body.subject;
      bodyPlain = req.body['body-plain'] || req.body.bodyPlain;
      strippedText = req.body['stripped-text'] || req.body.strippedText;
      messageUrl = req.body['message-url'] || req.body.messageUrl;
      
      // Parse attachments from Mailgun format
      const attachmentCount = parseInt(req.body['attachment-count'] || req.body.attachmentCount || '0');
      attachments = [];
      
      for (let i = 1; i <= attachmentCount; i++) {
        const attachment = {
          filename: req.body[`attachment-${i}`] || req.body[`attachment${i}`],
          'content-type': req.body[`content-type-${i}`] || req.body[`contentType${i}`],
          size: parseInt(req.body[`size-${i}`] || req.body[`size${i}`] || '0')
        };
        if (attachment.filename) {
          attachments.push(attachment);
        }
      }
    } else {
      // Test data format (existing structure)
      sender = req.body.sender;
      recipient = req.body.recipient;
      subject = req.body.subject;
      bodyPlain = req.body['body-plain'] || req.body.bodyPlain;
      strippedText = req.body['stripped-text'] || req.body.strippedText;
      attachments = req.body.attachments;
      messageUrl = req.body.messageUrl || 'test-message-url';
    }

    // Validate that we have the minimum required data
    if (!sender && !req.body.From && !req.body.from) {
      return res.status(200).json({ 
        success: false, 
        message: 'No sender information found - not a standard incoming email webhook',
        debug: {
          bodyKeys: Object.keys(req.body || {}),
          event: req.body.event || 'unknown',
          hasFiles: !!req.files?.length
        }
      });
    }

    // Extract sender's email
    const senderEmail = sender?.replace(/.*<(.+)>.*/, '$1').toLowerCase() || sender?.toLowerCase();
    
    if (!senderEmail) {
      return res.status(400).json({ 
        error: 'No sender email found',
        debug: {
          rawSender: sender,
          extractedEmail: senderEmail
        }
      });
    }

    // Enhanced application lookup
    const application = await Application.findOne({ 
      email: senderEmail,
      status: { $in: ['awaiting', 'received'] } // Only check applications waiting for documents
    }).sort({ updatedAt: -1 }); // Get the most recent application

    // Check for signed documents
    const hasSignedDocs = hasSignedDocuments(attachments, bodyPlain, strippedText);

    if (application && hasSignedDocs) {
      // This appears to be a signed document submission
      try {
        // Save attachments to uploads folder
        const savedFiles = await saveAttachmentsFromMailgun(messageUrl, attachments, application._id);
          if (savedFiles.length > 0) {
          // Update application status and document info
          application.status = 'received';
          application.signedDocumentPath = savedFiles[0].savedPath; // Use first file as primary
          application.signedDocumentReceivedAt = new Date();
          
          // Save all files to additionalDocuments array
          application.additionalDocuments = savedFiles.map(file => ({
            filename: file.savedPath.split('/').pop(), // Extract filename from path
            path: file.savedPath,
            originalName: file.originalName,
            contentType: file.contentType,
            size: file.size,
            uploadedAt: new Date()
          }));
          
          await application.save();
          
          // Send confirmation email to applicant
          await sendEmail({
            email: senderEmail,
            subject: `Document Received - Application #${application._id}`,
            message: `Dear ${application.name},

Thank you for submitting your signed documents for your ${application.applicationType} application.

We have successfully received and processed your documents:
${savedFiles.map(f => `- ${f.originalName}`).join('\n')}

Your application status has been updated to "Document Received" and is now under final review by our team. We will contact you shortly with the final decision.

If you have any questions, please don't hesitate to contact us.

Best regards,
GymTonic Team`
          });
          
          // Notify taskforce members
          const taskforceUsers = await User.find({ 
            role: { $in: ['taskforce', 'admin'] } 
          });
          
          for (const user of taskforceUsers) {
            await sendEmail({
              email: user.email,
              subject: `Signed Documents Received - Application #${application._id}`,
              message: `A signed document has been received for application #${application._id}.

Applicant: ${application.name} (${application.email})
Application Type: ${application.applicationType}
Documents Received: ${savedFiles.length}

Please review the documents in the applications dashboard to make the final approval decision.

View Application: ${process.env.CLIENT_URL}/taskforce/applications`
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            message: 'Signed documents processed successfully',
            applicationId: application._id,
            filesProcessed: savedFiles.length,
            debug: {
              senderEmail,
              applicationFound: true,
              hasSignedDocuments: hasSignedDocs,
              savedFiles: savedFiles.map(f => ({ name: f.originalName, path: f.savedPath }))
            }
          });
        } else {
          return res.status(200).json({
            success: false,
            message: 'No valid attachments found',
            debug: {
              senderEmail,
              applicationFound: true,
              hasSignedDocuments: hasSignedDocs,
              attachmentCount: attachments?.length || 0
            }
          });
        }
      } catch (error) {
        logger.error(`Error processing signed documents for application ${application._id}:`, error);
        return res.status(500).json({
          success: false,
          message: 'Error processing signed documents',
          error: error.message,
          debug: {
            senderEmail,
            applicationId: application._id
          }
        });
      }
    } else {
      // Log why we're not processing as signed document and reject the email
      if (!application) {
        return res.status(200).json({
          success: false,
          message: 'No matching application found for this email address',
          debug: {
            senderEmail,
            applicationFound: false,
            reason: 'No application with status awaiting/received found for this email'
          }
        });
      } else if (!hasSignedDocs) {
        return res.status(200).json({
          success: false,
          message: 'Email does not contain signed documents',
          debug: {
            senderEmail,
            applicationFound: true,
            hasSignedDocuments: hasSignedDocs,
            reason: 'Email content and attachments do not match signed document criteria'
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error processing email webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing email webhook',
      error: error.message
    });
  }
};
