// server/src/controllers/supportTicket.controller.js
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

// Function to handle incoming email webhook (from Mailgun or similar)
export const handleIncomingEmail = async (req, res) => {
  try {
    const { 
      sender, 
      recipient,
      subject, 
      'body-plain': bodyPlain,
      'stripped-text': strippedText,
      attachments
    } = req.body;

    // Extract sender's email and name if available
    const senderEmail = sender;
    let senderName = '';
    
    // Try to extract name from email (e.g., "John Doe <john@example.com>")
    const nameMatch = sender.match(/^([^<]+)</);
    if (nameMatch && nameMatch[1]) {
      senderName = nameMatch[1].trim();
    }

    // Check if it's a reply to an existing ticket
    let existingTicket = null;
    const emailSubject = subject || '';
    
    // Extract ticket ID from subject if it's a reply (e.g., "Re: [Ticket #123456] Your original subject")
    const ticketIdMatch = emailSubject.match(/\[Ticket #([a-f0-9]+)\]/i);
    
    if (ticketIdMatch && ticketIdMatch[1]) {
      const ticketId = ticketIdMatch[1];
      existingTicket = await SupportTicket.findById(ticketId);
    }

    // If it's a reply to an existing ticket
    if (existingTicket) {
      // Add the new message to the ticket
      existingTicket.messages.push({
        sender: 'user',
        content: strippedText || bodyPlain,
        timestamp: new Date(),
        attachments: processAttachments(attachments),
      });
      
      existingTicket.status = 'open'; // Reopen the ticket if it was closed
      existingTicket.updatedAt = new Date();
      
      await existingTicket.save();
      
      // Notify assigned staff if applicable
      if (existingTicket.assignedTo) {
        const assignedUser = await User.findById(existingTicket.assignedTo);
        if (assignedUser && assignedUser.email) {
          await sendNotificationEmail(
            assignedUser.email,
            `New reply to ticket #${existingTicket._id}`,
            `${senderName || 'A user'} has replied to ticket #${existingTicket._id} that is assigned to you.\n\nSubject: ${existingTicket.subject}\n\nPlease log in to the support dashboard to respond.`
          );
        }
      }
      
      res.status(200).json({ success: true, message: 'Reply added to existing ticket' });
    } else {
      // Create a new ticket
      // Look up if user exists in our system
      let userId = null;
      const user = await User.findOne({ email: senderEmail });
      if (user) {
        userId = user._id;
        senderName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : senderName;
      }
      
      // Create new support ticket
      const newTicket = new SupportTicket({
        subject: cleanupSubject(emailSubject),
        userEmail: senderEmail,
        userName: senderName,
        userId: userId,
        messages: [{
          sender: 'user',
          content: strippedText || bodyPlain,
          timestamp: new Date(),
          attachments: processAttachments(attachments),
        }],
      });
      
      await newTicket.save();
      
      // Send auto-response to user
      await sendAutoResponseEmail(
        senderEmail,
        `[Ticket #${newTicket._id}] ${newTicket.subject}`,
        `Thank you for contacting GymJams support.\n\nYour support ticket has been created with ID #${newTicket._id}. A member of our team will get back to you shortly.\n\nPlease keep the ticket ID in the subject when replying to this email.\n\nRegards,\nGymJams Support Team`
      );
      
      res.status(201).json({ success: true, ticketId: newTicket._id });
    }
  } catch (error) {
    logger.error('Error handling incoming email:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
};

// Helper function to process attachments
const processAttachments = (attachments) => {
  if (!attachments || !Array.isArray(attachments)) return [];
  
  return attachments.map(attachment => ({
    filename: attachment.name,
    path: attachment.url || attachment.path,
    contentType: attachment.contentType || attachment['content-type'],
  }));
};

// Helper function to clean up email subject
const cleanupSubject = (subject) => {
  return subject
    .replace(/^(Re|Fwd):\s*/i, '')  // Remove Re: or Fwd: prefixes
    .trim();
};

// Get all support tickets (with pagination and filters)
export const getSupportTickets = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      search,
      page = 1, 
      limit = 20,
      sort = 'updatedAt', // Default sort by latest update
      order = 'desc'      // Default order descending
    } = req.query;
    
    // Build query conditions
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * parseInt(limit);
    
    // Determine sort order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Get tickets and total count
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('assignedTo', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SupportTicket.countDocuments(query)
    ]);
    
    res.status(200).json({
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
};

// Get single ticket by ID
export const getSupportTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    logger.error('Error fetching support ticket:', error);
    res.status(500).json({ error: 'Failed to fetch support ticket' });
  }
};

// Update ticket (status, priority, assignee)
export const updateSupportTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const updates = {};
    
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo) {
      // Verify that assignee is a valid taskforce user
      const assignee = await User.findById(assignedTo);
      if (!assignee || !['taskforce', 'admin'].includes(assignee.role)) {
        return res.status(400).json({ error: 'Invalid assignee. Must be a taskforce member.' });
      }
      updates.assignedTo = assignedTo;
    }
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    logger.error('Error updating support ticket:', error);
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
};

// Add response message to ticket
export const addResponseToTicket = async (req, res) => {
  try {
    const { content } = req.body;
    const ticketId = req.params.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Response content is required' });
    }
    
    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // Add staff response
    ticket.messages.push({
      sender: 'staff',
      content,
      timestamp: new Date(),
    });
    
    // Update ticket metadata
    ticket.status = req.body.status || 'in-progress'; // Default to in-progress
    ticket.lastResponseAt = new Date();
    
    await ticket.save();
    
    // Send email notification to user
    await sendEmail({
      email: ticket.userEmail,
      subject: `[Ticket #${ticket._id}] ${ticket.subject}`,
      message: `${content}\n\n---\nPlease do not remove the ticket ID [Ticket #${ticket._id}] from the subject line when replying to this email.\n\nThank you,\nGymJams Support Team`
    });
    
    res.status(200).json({
      success: true,
      message: 'Response added and email sent to user',
      ticket
    });
  } catch (error) {
    logger.error('Error adding response to ticket:', error);
    res.status(500).json({ error: 'Failed to add response to ticket' });
  }
};

// Helper to send auto-response
const sendAutoResponseEmail = async (to, subject, message) => {
  try {
    await sendEmail({
      email: to,
      subject,
      message
    });
    logger.info(`Auto-response sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send auto-response:', error);
    return false;
  }
};

// Helper to send notification to staff
const sendNotificationEmail = async (to, subject, message) => {
  try {
    await sendEmail({
      email: to,
      subject,
      message
    });
    logger.info(`Notification sent to staff ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send staff notification:', error);
    return false;
  }
};

// Get ticket statistics
export const getSupportTicketStats = async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Transform result into more usable format
    const statsObj = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };
    
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });
    
    // Get average response time
    const avgTimeData = await SupportTicket.aggregate([
      { 
        $match: { 
          lastResponseAt: { $exists: true },
          createdAt: { $exists: true }
        } 
      },
      {
        $project: {
          responseTime: { 
            $divide: [
              { $subtract: ['$lastResponseAt', '$createdAt'] },
              1000 * 60 * 60 // Convert ms to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    const avgResponseTime = avgTimeData.length > 0 ? avgTimeData[0].avgResponseTime : null;
    
    res.status(200).json({
      ticketsByStatus: statsObj,
      totalTickets: Object.values(statsObj).reduce((a, b) => a + b, 0),
      avgResponseTime
    });
  } catch (error) {
    logger.error('Error fetching support ticket stats:', error);
    res.status(500).json({ error: 'Failed to fetch support ticket statistics' });
  }
};

export const createFromContact = async (req, res) => {
  try {
    const { subject, userName, userEmail, message } = req.body;
    
    if (!userEmail || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }
    
    // Look up if user exists in our system
    let userId = null;
    const user = await User.findOne({ email: userEmail });
    if (user) {
      userId = user._id;
    }
    
    // Create new support ticket
    const newTicket = new SupportTicket({
      subject: subject || 'Support Request',
      userEmail,
      userName: userName || '',
      userId,
      status: 'open',
      priority: 'medium',
      messages: [{
        sender: 'user',
        content: message,
        timestamp: new Date()
      }]
    });
    
    await newTicket.save();
    
    // Send auto-response to user
    try {
      await sendEmail({
        email: userEmail,
        subject: `[Ticket #${newTicket._id}] ${newTicket.subject}`,
        message: `Thank you for contacting GymJams support.\n\nYour support ticket has been created with ID #${newTicket._id}. A member of our team will get back to you shortly.\n\nPlease keep the ticket ID in the subject when replying to this email.\n\nRegards,\nGymJams Support Team`
      });
    } catch (emailError) {
      logger.error('Failed to send auto-response:', emailError);
      // Continue even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: newTicket._id
    });
  } catch (error) {
    logger.error('Error creating support ticket from contact:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};