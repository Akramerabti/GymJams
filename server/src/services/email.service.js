import { Resend } from 'resend';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit-table';
import { formatCurrency } from '../utils/formatters.js';

if (!process.env.RESEND_API_KEY) {
  console.log('RESEND_API_KEY loaded:', process.env.RESEND_API_KEY ? 'Yes' : 'No');
  logger.error('RESEND_API_KEY is not defined');
  throw new Error('RESEND_API_KEY is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: 'GYMTONIC.CA <verification@gymtonic.ca>',
      to: user.email,
      subject: 'Verify your GymTonic account',
      html: `
        <h1>Welcome to GymTonic!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        <p>Best regards,<br>The GymTonic Team</p>
      `
    });
    logger.info(`Verification email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Resend error:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: 'GYMTONIC.CA <noreply@gymtonic.ca>',
      to: user.email,
      subject: 'Reset your GymTonic password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.firstName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The GymTonic Team</p>
      `
    });
    logger.info(`Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Resend error:', error);
    throw error;
  }
};

export const sendSubscriptionReceipt = async (subscriptionData, email, isGuest = false) => {
  try {
    logger.info(`Attempting to send subscription receipt to ${email}, isGuest: ${isGuest}`);
    
    // Validate required data
    if (!subscriptionData || !email) {
      throw new Error('Missing required subscription data or email');
    }

    const subscriptionAccessUrl = isGuest
      ? `${process.env.CLIENT_URL}/dashboard?accessToken=${subscriptionData.accessToken}`
      : `${process.env.CLIENT_URL}/dashboard`;

    const emailData = {
      from: 'GYMTONIC.CA <subscriptions@gymtonic.ca>',
      to: email,
      subject: 'Welcome to GymTonic - Your Subscription Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #2b6cb0; margin: 0;">Welcome to GymTonic!</h1>
            <p style="color: #4a5568; font-size: 18px;">Thank you for subscribing to our ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)} Plan</p>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              Subscription Details
            </h2>
            <div style="margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)}</p>
              <p style="margin: 8px 0;"><strong>Monthly Fee:</strong> $${subscriptionData.price}</p>
              <p style="margin: 8px 0;"><strong>Start Date:</strong> ${new Date(subscriptionData.startDate).toLocaleDateString()}</p>
              ${!isGuest ? `<p style="margin: 8px 0;"><strong>Points Earned:</strong> ${subscriptionData.pointsAwarded}</p>` : ''}
            </div>
          </div>

          ${isGuest ? `
          <div style="background-color: #ebf8ff; border: 2px solid #4299e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #2b6cb0; margin-top: 0;">How to Access Your Subscription</h2>
            <p style="margin-bottom: 15px;">Since you purchased as a guest, please save your access token:</p>
            <div style="background-color: #fff; padding: 10px; border-radius: 4px; text-align: center; margin: 15px 0; font-family: monospace; font-size: 16px;">
              ${subscriptionData.accessToken}
            </div>
            <p style="margin-top: 15px;">To access your subscription:</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Visit <a href="${process.env.CLIENT_URL}/coaching" style="color: #4299e1;">GymTonic Coaching</a></li>
              <li>Click on "Already have a subscription? Access it here"</li>
              <li>Enter your access token</li>
            </ol>
            <p style="margin-top: 15px; font-style: italic;">Save this email to keep your access token safe!</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${subscriptionAccessUrl}" 
               style="display: inline-block; background-color: #4299e1; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Your Subscription
            </a>
          </div>

          <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 10px;">Your Subscription Includes:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${subscriptionData.features ? subscriptionData.features.map(feature => `
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #48bb78; position: absolute; left: 0;">✓</span>
                  ${feature}
                </li>
              `).join('') : ''}
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; font-size: 14px; color: #718096;">
            <p style="margin: 0 0 10px 0;"><strong>Need Help?</strong></p>
            <p style="margin: 0;">Contact our support team at contact@gymtonic.ca</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">© 2024 GymTonic. All rights reserved.</p>
          </div>
        </div>
      `
    };

    logger.info(`Sending email to Resend API...`);
    const result = await resend.emails.send(emailData);
    logger.info(`Email sent successfully! Resend response:`, result);

    return true;
  } catch (error) {
    logger.error('Subscription receipt email error:', error);
    logger.error('Email data:', { email, subscriptionData, isGuest });
    throw error;
  }
};

const generateOrderPDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];

      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // Add order receipt title with styled header
      doc.rect(50, 45, doc.page.width - 100, 60).fill('#f0f9ff');
      doc.fontSize(22).fillColor('#2563eb').text('ORDER RECEIPT', { align: 'center', y: 60 });
      doc.moveDown(2);

      // Add order details
      doc.fontSize(12).fillColor('#000');

      // Order information
      doc.font('Helvetica-Bold').text('Order Information', { underline: true });
      doc.font('Helvetica').text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`);
      doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`);
      doc.moveDown();

      // Customer information
      doc.font('Helvetica-Bold').text('Customer Information', { underline: true });
      doc.font('Helvetica');
      doc.text(`Name: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
      doc.text(`Email: ${order.email || order.shippingAddress.email}`);
      doc.text(`Phone: ${order.shippingAddress.phone || 'N/A'}`);
      doc.moveDown();

      // Shipping information
      doc.font('Helvetica-Bold').text('Shipping Address', { underline: true });
      doc.font('Helvetica');
      doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
      doc.text(order.shippingAddress.address);
      if (order.shippingAddress.apartment) doc.text(order.shippingAddress.apartment);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`);
      doc.text(order.shippingAddress.country);
      doc.moveDown();

      // Shipping method
      doc.font('Helvetica-Bold').text('Shipping Method', { underline: true });
      doc.font('Helvetica').text(`${order.shippingMethod === 'express' ? 'Express Shipping (1-2 business days)' : 'Standard Shipping (3-5 business days)'}`);
      doc.moveDown(2);

      // Order items table with improved styling
      const tableData = {
        headers: ['Item', 'Quantity', 'Unit Price', 'Total'],
        rows: order.items.map(item => [
          item.product.name || 'Product',
          item.quantity.toString(),
          formatCurrency(item.price),
          formatCurrency(item.price * item.quantity)
        ])
      };

      // Style the table headers with a blue background
      doc.table(tableData, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff'),
        prepareRow: () => doc.font('Helvetica').fontSize(10).fillColor('#000'),
        width: 500,
        columnSpacing: 10,
        headerHeight: 25,
        backgroundColor: (i, node, rowIndex) => {
          return (rowIndex % 2 === 0) ? '#f8fafc' : null;
        },
        beforeDrawTable: (doc, table) => {
          // Draw the header background
          doc.rect(table.x, table.y, table.width, table.headerHeight)
            .fill('#3b82f6');
        }
      });

      doc.moveDown();

      // Order summary with improved layout
      const summaryX = 350; // Moved to the right
      const summaryStartY = doc.y + 10;

      // Draw a light gray box for the summary section
      doc.rect(summaryX - 10, summaryStartY - 10, 160, 120).fill('#f8fafc');

      // Points discount (if used)
      let extraRowsHeight = 0;
      if (order.pointsUsed > 0 && order.pointsDiscount > 0) {
        extraRowsHeight = 20;
      }

      doc.font('Helvetica').fontSize(10).fillColor('#000').text('Subtotal:', summaryX, summaryStartY);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.subtotal), 500, summaryStartY, { align: 'right' });

      doc.font('Helvetica').fontSize(10).text('Shipping:', summaryX, summaryStartY + 20);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.shippingCost), 500, summaryStartY + 20, { align: 'right' });

      doc.font('Helvetica').fontSize(10).text('Tax:', summaryX, summaryStartY + 40);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.tax), 500, summaryStartY + 40, { align: 'right' });

      // Add points discount if applicable
      if (order.pointsUsed > 0 && order.pointsDiscount > 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#059669').text(`Points Discount (${order.pointsUsed} pts):`, summaryX, summaryStartY + 60);
        doc.font('Helvetica').fontSize(10).fillColor('#059669').text(`-${formatCurrency(order.pointsDiscount)}`, 500, summaryStartY + 60, { align: 'right' });
      }

      // Draw a separator line
      doc.moveTo(summaryX, summaryStartY + 60 + extraRowsHeight).lineTo(500, summaryStartY + 60 + extraRowsHeight).stroke();

      // Total
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#000').text('Total:', summaryX, summaryStartY + 70 + extraRowsHeight);
      doc.font('Helvetica-Bold').fontSize(12).text(formatCurrency(order.total), 500, summaryStartY + 70 + extraRowsHeight, { align: 'right' });

      // Footer with brand info and contact details
      const footerHeight = 80; // Height of the footer box
      const footerY = doc.page.height - footerHeight - 50; // Position footer 50 units above the bottom of the page

      // Check if there's enough space for the footer on the current page
      if (doc.y > footerY) {
        // If not, add a new page
        doc.addPage();
      }

      // Draw footer box
      doc.rect(50, footerY, doc.page.width - 100, footerHeight).fill('#f0f9ff');

      // Add thank you message in footer
      doc.fontSize(11)
         .fillColor('#2563eb')
         .text('Thank you for your purchase!', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 });

      doc.fontSize(9)
         .fillColor('#4b5563')
         .text('If you have any questions, please contact our customer support at contact@gymtonic.ca', 50, footerY + 35, { align: 'center', width: doc.page.width - 100 });

      // Add reward points summary if applicable
      if (order.user && !order.pointsUsed) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#3b82f6')
           .text(' You earned points with this purchase!', 50, footerY + 55, { align: 'center', width: doc.page.width - 100 });

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4b5563')
           .text(`Your purchase of ${formatCurrency(order.total)} has earned you points that can be used on your next purchase.`, 50, footerY + 70, { align: 'center', width: doc.page.width - 100 });
      }

      // Add copyright text
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('© 2024 GymTonic. All rights reserved.', 50, footerY + 90, { align: 'center', width: doc.page.width - 100 });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const sendOrderConfirmationEmail = async (order, email) => {
  try {
    // Convert order._id to string
    const orderIdString = order._id.toString();

    // Generate the PDF receipt
    const pdfBuffer = await generateOrderPDF(order);
    
    // Format order items for the email
    const formattedItems = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.product.name || 'Product'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    
    // Order status display
    const getStatusDisplay = (status) => {
      switch (status) {
        case 'pending': return { color: '#EAB308', text: 'Pending' };
        case 'processing': return { color: '#3B82F6', text: 'Processing' };
        case 'shipped': return { color: '#22C55E', text: 'Shipped' };
        case 'delivered': return { color: '#16A34A', text: 'Delivered' };
        case 'cancelled': return { color: '#EF4444', text: 'Cancelled' };
        default: return { color: '#6B7280', text: status };
      }
    };
    
    const statusDisplay = getStatusDisplay(order.status);
    
    // Send the email with attachment
    await resend.emails.send({
      from: 'GYMTONIC <orders@gymtonic.ca>',
      to: email,
      subject: `Order Confirmation #${orderIdString.slice(-8).toUpperCase()}`,
      attachments: [
        {
          filename: `Order_${orderIdString.slice(-8).toUpperCase()}_Receipt.pdf`,
          content: pdfBuffer,
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px; background-color: #f0f9ff; border-bottom: 1px solid #bfdbfe;">
            <h1 style="color: #2563eb; margin: 0;">Order Confirmation</h1>
            <p style="color: #4a5568; font-size: 18px; margin-top: 10px;">Thank you for your purchase!</p>
          </div>
          
          <div style="padding: 20px;">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1a202c; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                Order Details
              </h2>
              
              <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; width: 50%; vertical-align: top;">
                    <p style="margin: 0 0 5px 0; color: #718096; font-size: 14px;">Order Number:</p>
                    <p style="margin: 0; font-weight: bold;">#${orderIdString.slice(-8).toUpperCase()}</p>
                  </td>
                  <td style="padding: 5px 0; width: 50%; vertical-align: top; text-align: right;">
                    <p style="margin: 0 0 5px 0; color: #718096; font-size: 14px;">Order Date:</p>
                    <p style="margin: 0; font-weight: bold;">${new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; vertical-align: top;">
                    <p style="margin: 0 0 5px 0; color: #718096; font-size: 14px;">Order Status:</p>
                    <p style="margin: 0; font-weight: bold; display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 14px; background-color: ${statusDisplay.color}25; color: ${statusDisplay.color};">${statusDisplay.text}</p>
                  </td>
                  <td style="padding: 5px 0; vertical-align: top; text-align: right;">
                    <p style="margin: 0 0 5px 0; color: #718096; font-size: 14px;">Payment Method:</p>
                    <p style="margin: 0; font-weight: bold;">Credit Card</p>
                  </td>
                </tr>
              </table>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr style="background-color: #3b82f6; color: white; font-weight: bold;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
                ${formattedItems}
              </table>
              
              <table style="width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                <tr>
                  <td style="padding: 5px 0; text-align: left;">Subtotal:</td>
                  <td style="padding: 5px 0; text-align: right;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; text-align: left;">Shipping:</td>
                  <td style="padding: 5px 0; text-align: right;">$${order.shippingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; text-align: left;">Tax:</td>
                  <td style="padding: 5px 0; text-align: right;">$${order.tax.toFixed(2)}</td>
                </tr>
                
                ${order.pointsUsed > 0 && order.pointsDiscount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; text-align: left; color: #059669;">Points Discount (${order.pointsUsed} pts):</td>
                  <td style="padding: 5px 0; text-align: right; color: #059669;">-$${order.pointsDiscount.toFixed(2)}</td>
                </tr>
                ` : ''}
                
                <tr style="font-weight: bold; font-size: 18px;">
                  <td style="padding: 10px 0 5px; text-align: left; border-top: 2px solid #e2e8f0;">Total:</td>
                  <td style="padding: 10px 0 5px; text-align: right; border-top: 2px solid #e2e8f0;">$${order.total.toFixed(2)}</td>
                </tr>
              </table>
              
              ${!order.pointsUsed && order.user ? `
              <div style="margin-top: 20px; background-color: #dbeafe; padding: 10px; border-radius: 6px; text-align: center;">
                <p style="color: #2563eb; margin: 0; font-weight: bold;">🎁 You earned points with this purchase!</p>
                <p style="color: #4b5563; margin-top: 5px; font-size: 14px;">Your purchase of $${order.total.toFixed(2)} has earned you points that can be used on your next purchase.</p>
              </div>
              ` : ''}
            </div>
            
            <div style="display: flex; margin-bottom: 30px;">
              <div style="flex: 1; padding-right: 15px;">
                <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Shipping Address</h3>
                <p style="margin: 0 0 5px 0;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                <p style="margin: 0 0 5px 0;">${order.shippingAddress.address}</p>
                ${order.shippingAddress.apartment ? `<p style="margin: 0 0 5px 0;">${order.shippingAddress.apartment}</p>` : ''}
                <p style="margin: 0 0 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                <p style="margin: 0 0 5px 0;">${order.shippingAddress.country}</p>
              </div>
              <div style="flex: 1; padding-left: 15px;">
                <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 10px;">Shipping Method</h3>
                <p style="margin: 0;">${order.shippingMethod === 'express' ? 'Express Shipping (1-2 business days)' : 'Standard Shipping (3-5 business days)'}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="margin-bottom: 10px;">You can track your order status by visiting:</p>
              <a href="${process.env.CLIENT_URL}/orders?orderId=${orderIdString}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Track Your Order
              </a>
              <p style="margin-top: 20px; color: #718096; font-size: 14px;">
                A PDF receipt is attached to this email for your records.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-top: 1px solid #bfdbfe;">
            <p style="margin: 0 0 10px 0; color: #2563eb; font-size: 14px; font-weight: bold;">Questions about your order?</p>
            <p style="margin: 0; color: #718096; font-size: 14px;">Contact us at <a href="mailto:contact@gymtonic.ca" style="color: #3b82f6;">contact@gymtonic.ca</a></p>
          </div>
          
          <div style="padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
            <p>© 2025 GymTonic. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
          </div>
        </div>
      `,
    });

    logger.info(`Order confirmation email sent to ${email} for order ${orderIdString}`);
    return true;
  } catch (error) {
    logger.error(`Error sending order confirmation email: ${error}`);
    throw error;
  }
};

export const sendOrderUpdateEmail = async (order, email, updateType) => {
  try {
    // Convert order._id to string
    const orderIdString = order._id.toString();

    const updateMessages = {
      shipping: {
        subject: `Your Order #${orderIdString.slice(-8).toUpperCase()} Has Shipped!`,
        title: 'Your Order Has Shipped',
        message: 'Good news! Your order is on its way to you.',
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been shipped and is on its way to you. You can track your package using the tracking information below.`,
        color: '#3b82f6',
        icon: '🚚'
      },
      delivered: {
        subject: `Your Order #${orderIdString.slice(-8).toUpperCase()} Has Been Delivered`,
        title: 'Order Delivered',
        message: 'Your order has been delivered!',
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been delivered. We hope you enjoy your purchase!`,
        color: '#10b981',
        icon: '✅'
      },
      cancelled: {
        subject: `Your Order #${orderIdString.slice(-8).toUpperCase()} Has Been Cancelled`,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been cancelled. If you have any questions, please contact our customer service.`,
        color: '#ef4444',
        icon: '❌'
      }
    };

    const update = updateMessages[updateType] || {
      subject: `Order #${orderIdString.slice(-8).toUpperCase()} Status Update`,
      title: 'Order Status Update',
      message: 'Your order status has been updated.',
      details: `Your order #${orderIdString.slice(-8).toUpperCase()} status has been updated to ${order.status}.`
    };

    await resend.emails.send({
      from: 'GYMTONIC <orders@gymtonic.ca>',
      to: email,
      subject: update.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <h1 style="color: #2b6cb0; margin: 0;">${update.title}</h1>
            <p style="color: #4a5568; font-size: 18px; margin-top: 10px;">${update.message}</p>
          </div>
          
          <div style="padding: 20px;">
            <p>${update.details}</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.CLIENT_URL}/orders?orderId=${orderIdString}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            ${updateType === 'shipping' && order.trackingNumber ? `
            <div style="margin: 30px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px; background-color: #f8fafc;">
              <h3 style="margin-top: 0;">Tracking Information</h3>
              <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              <p><strong>Carrier:</strong> ${order.shippingMethod === 'express' ? 'Express Delivery' : 'Standard Shipping'}</p>
              ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</p>` : ''}
            </div>
            ` : ''}
            
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">Questions about your order?</p>
            <p style="margin: 0; color: #718096; font-size: 14px;">Contact us at <a href="mailto:contact@gymtonic.ca" style="color: #3182ce;">contact@gymtonic.ca</a></p>
          </div>
          
          <div style="padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
            <p>© 2025 GymTonic. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
          </div>
        </div>
      `,
    });

    logger.info(`Order update email (${updateType}) sent to ${email} for order ${orderIdString}`);
    return true;
  } catch (error) {
    logger.error(`Error sending order update email: ${error}`);
    throw error;
  }
};

export const sendSubscriptionCancellationEmail = async (subscriptionData, email, isRefundEligible = false, isGuest = false) => {
  const accessInfo = isGuest ? `
    <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0;">Access Token Information</h3>
      <p style="margin-bottom: 15px;">Your access token was: <strong>${subscriptionData.accessToken}</strong></p>
      <p style="margin-top: 15px; font-style: italic;">This token is no longer valid since your subscription has been cancelled.</p>
    </div>
  ` : '';

  try {
    await resend.emails.send({
      from: 'GYMTONIC.CA <subscriptions@gymtonic.ca>',
      to: email,
      subject: 'Your GymTonic Subscription Has Been Cancelled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
            <h1 style="color: #dc2626; margin: 0;">Subscription Cancelled</h1>
            <p style="color: #4a5568; font-size: 18px;">Your GymTonic subscription has been cancelled</p>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              Cancellation Details
            </h2>
            <div style="margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)}</p>
              <p style="margin: 8px 0;"><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>Original Start Date:</strong> ${new Date(subscriptionData.startDate).toLocaleDateString()}</p>
              ${isRefundEligible ? 
                `<p style="margin: 8px 0; color: #059669;"><strong>Refund Status:</strong> A 40% refund will be processed to your original payment method within 5-10 business days</p>` :
                `<p style="margin: 8px 0; color: #d97706;"><strong>Access:</strong> You will retain access until ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}</p>`
              }
            </div>
          </div>

          ${accessInfo}

          <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 10px;">What happens next?</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${isRefundEligible ? `
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #059669; position: absolute; left: 0;">✓</span>
                  Your refund will be processed within 5-10 business days
                </li>
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #059669; position: absolute; left: 0;">✓</span>
                  Your access has been immediately terminated
                </li>
              ` : `
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #d97706; position: absolute; left: 0;">•</span>
                  You will retain access until the end of your current billing period
                </li>
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #d97706; position: absolute; left: 0;">•</span>
                  No future charges will be made to your payment method
                </li>
              `}
              <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                <span style="color: #4299e1; position: absolute; left: 0;">•</span>
                You can resubscribe at any time if you change your mind
              </li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/coaching" 
               style="display: inline-block; background-color: #4299e1; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Resubscribe to GymTonic
            </a>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; font-size: 14px; color: #718096;">
            <p style="margin: 0 0 10px 0;"><strong>We're sorry to see you go!</strong></p>
            <p style="margin: 0;">If you have any feedback about your experience or need assistance, please contact our support team at contact@gymtonic.ca</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">© 2024 GymTonic. All rights reserved.</p>
          </div>
        </div>
      `
    });

    logger.info(`Subscription cancellation email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Subscription cancellation email error:', error);
    throw error;
  }
};

export const sendSubscriptionEndEmail = async (subscriptionData, email, reason = 'expired', isGuest = false) => {
  const reasonMessages = {
    expired: {
      title: 'Your GymTonic Subscription Has Expired',
      message: 'Your subscription has reached the end of its billing period',
      color: '#d97706'
    },
    cancelled: {
      title: 'Your GymTonic Subscription Has Ended', 
      message: 'Your cancelled subscription has now ended',
      color: '#dc2626'
    },
    deleted: {
      title: 'Your GymTonic Subscription Has Ended',
      message: 'Your subscription has been terminated',
      color: '#dc2626'
    }
  };

  const reasonData = reasonMessages[reason] || reasonMessages.expired;

  const accessInfo = isGuest ? `
    <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0;">Access Token Information</h3>
      <p style="margin-bottom: 15px;">Your access token was: <strong>${subscriptionData.accessToken}</strong></p>
      <p style="margin-top: 15px; font-style: italic;">This token is no longer valid since your subscription has ended.</p>
    </div>
  ` : '';

  try {
    await resend.emails.send({
      from: 'GYMTONIC.CA <subscriptions@gymtonic.ca>',
      to: email,
      subject: reasonData.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
            <h1 style="color: ${reasonData.color}; margin: 0;">Subscription Ended</h1>
            <p style="color: #4a5568; font-size: 18px;">${reasonData.message}</p>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              Subscription Summary
            </h2>
            <div style="margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)}</p>
              <p style="margin: 8px 0;"><strong>Start Date:</strong> ${new Date(subscriptionData.startDate).toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>End Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>Total Duration:</strong> ${Math.ceil((new Date() - new Date(subscriptionData.startDate)) / (1000 * 60 * 60 * 24))} days</p>
            </div>
          </div>

          ${accessInfo}

          <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 10px;">What's next?</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                <span style="color: #4299e1; position: absolute; left: 0;">•</span>
                Your access to GymTonic coaching services has ended
              </li>
              <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                <span style="color: #4299e1; position: absolute; left: 0;">•</span>
                You can resubscribe at any time to regain access
              </li>
              <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                <span style="color: #4299e1; position: absolute; left: 0;">•</span>
                All your data and progress are safely stored for when you return
              </li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/coaching" 
               style="display: inline-block; background-color: #4299e1; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Resubscribe to GymTonic
            </a>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; font-size: 14px; color: #718096;">
            <p style="margin: 0 0 10px 0;"><strong>Thank you for being part of GymTonic!</strong></p>
            <p style="margin: 0;">We hope you achieved your fitness goals with us. If you have any questions or need assistance, please contact our support team at contact@gymtonic.ca</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">© 2024 GymTonic. All rights reserved.</p>
          </div>
        </div>
      `
    });

    logger.info(`Subscription end email sent to ${email} for reason: ${reason}`);
    return true;
  } catch (error) {
    logger.error('Subscription end email error:', error);
    throw error;
  }
};

// Send welcome email with temporary password and discount code
export const sendWelcomeEmailWithCredentials = async (user, tempPassword, discountCode) => {
  try {
    await resend.emails.send({
      from: 'GYMTONIC.CA <welcome@gymtonic.ca>',
      to: user.email,
      subject: 'Welcome to GymTonic - Your Account & Exclusive Discount!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px 15px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to GymTonic!</h1>
            <p style="color: #e8f2ff; margin: 10px 0 0 0; font-size: 16px;">Your fitness journey starts here</p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #2d3748; margin-bottom: 15px; font-size: 24px;">Hi ${user.firstName}! 👋</h2>
              <p style="color: #4a5568; line-height: 1.6; margin-bottom: 15px; font-size: 16px;">
                Thank you for joining the GymTonic community! We're excited to have you on board and help you achieve your fitness goals.
              </p>
            </div>

            <!-- Login Credentials Box -->
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <h3 style="color: white; margin: 0 0 20px 0; font-size: 20px;">🔐 Your Login Credentials</h3>
              <div style="background-color: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0; color: white; font-size: 14px; opacity: 0.9;">Email:</p>
                <p style="margin: 5px 0; color: white; font-size: 18px; font-weight: bold; word-break: break-all;">${user.email}</p>
              </div>
              <div style="background-color: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px;">
                <p style="margin: 5px 0; color: white; font-size: 14px; opacity: 0.9;">Temporary Password:</p>
                <p style="margin: 5px 0; color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">${tempPassword}</p>
              </div>
              <p style="color: white; font-size: 13px; margin: 15px 0 0 0; opacity: 0.9;">
                💡 We recommend changing your password after your first login
              </p>
            </div>

            <!-- Discount Code Box -->
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">🎁 Your Exclusive Discount</h3>
              <div style="background-color: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.4);">
                <p style="margin: 5px 0; color: white; font-size: 16px; opacity: 0.9;">Discount Code:</p>
                <p style="margin: 10px 0; color: white; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">${discountCode}</p>
                <p style="margin: 5px 0; color: white; font-size: 14px; opacity: 0.9;">Save 15% on the coaching plan of your choice for the first 3 months!</p>
                <p style="margin: 5px 0; color: white; font-size: 12px; opacity: 0.8;">Also valid for a single product purchase.</p>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                🚀 Start Your Journey
              </a>
            </div>

            <!-- Features Preview -->
            <div style="margin: 30px 0; padding: 25px; background-color: #f7fafc; border-radius: 12px; border-left: 5px solid #667eea;">
              <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px;">What's waiting for you:</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">💪</span>
                  <div>
                    <strong style="color: #2d3748;">Find GymBros</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Connect with workout partners near you</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">🏆</span>
                  <div>
                    <strong style="color: #2d3748;">Personal Coaching</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Get guidance from certified trainers</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">🛒</span>
                  <div>
                    <strong style="color: #2d3748;">Fitness Shop</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Premium supplements and gear</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Note -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                🔒 <strong>Security tip:</strong> Keep your login credentials safe and don't share them with anyone. 
                If you didn't create this account, please contact our support team immediately.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; margin: 10px 0; font-size: 14px;">
                Need help getting started? Reply to this email or visit our 
                <a href="${process.env.CLIENT_URL}/faq" style="color: #667eea; text-decoration: none;">FAQ page</a>
              </p>
              <p style="color: #a0aec0; margin: 5px 0; font-size: 12px;">
                Best regards,<br>
                The GymTonic Team 💜
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    logger.info(`Welcome email with credentials sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Welcome email with credentials error:', error);
    throw error;
  }
};

// Send welcome email with discount code (for OAuth users - no password needed)
export const sendWelcomeEmailWithDiscount = async (user, discountCode) => {
  try {
    console.log('🚀 Attempting to send welcome email with discount to:', user.email);
    console.log('📋 Email details:', {
      from: 'GYMTONIC.CA <welcome@gymtonic.ca>',
      to: user.email,
      subject: 'Welcome to GymTonic - Your Exclusive 15% Discount!',
      discountCode: discountCode
    });

    const result = await resend.emails.send({
      from: 'GYMTONIC.CA <welcome@gymtonic.ca>',
      to: user.email,
      subject: 'Welcome to GymTonic - Your Exclusive 15% Discount!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px 15px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to GymTonic!</h1>
            <p style="color: #e8f2ff; margin: 10px 0 0 0; font-size: 16px;">Your fitness journey starts here</p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #2d3748; margin-bottom: 15px; font-size: 24px;">Hi ${user.firstName}! 👋</h2>
              <p style="color: #4a5568; line-height: 1.6; margin-bottom: 15px; font-size: 16px;">
                Thank you for joining the GymTonic community! We're excited to have you on board and help you achieve your fitness goals.
              </p>
              <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                You're all set to start exploring our platform with your Google account. No need for additional passwords!
              </p>
            </div>

            <!-- Discount Code Section -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">🎁 Your Exclusive Discount</h3>
              <div style="background-color: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.4);">
                <p style="margin: 5px 0; color: white; font-size: 16px; opacity: 0.9;">Discount Code:</p>
                <p style="margin: 10px 0; color: white; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">${discountCode}</p>
                <p style="margin: 5px 0; color: white; font-size: 14px; opacity: 0.9;">Save 15% on the coaching plan of your choice for the first 3 months!</p>
                <p style="margin: 5px 0; color: white; font-size: 12px; opacity: 0.8;">Also valid for a single product purchase.</p>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/coaching" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                🚀 Explore Coaching Plans
              </a>
            </div>

            <!-- Features Preview -->
            <div style="margin: 30px 0; padding: 25px; background-color: #f7fafc; border-radius: 12px; border-left: 5px solid #667eea;">
              <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px;">What's waiting for you:</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">💪</span>
                  <div>
                    <strong style="color: #2d3748;">Find GymBros</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Connect with workout partners near you</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">🏆</span>
                  <div>
                    <strong style="color: #2d3748;">Personal Coaching</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Get guidance from certified trainers</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; padding: 10px 0;">
                  <span style="font-size: 24px; margin-right: 15px;">🛒</span>
                  <div>
                    <strong style="color: #2d3748;">Fitness Shop</strong>
                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Premium supplements and gear</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; margin: 10px 0; font-size: 14px;">
                Ready to get started? Visit our 
                <a href="${process.env.CLIENT_URL}/coaching" style="color: #667eea; text-decoration: none;">coaching page</a>
                to redeem your discount!
              </p>
              <p style="color: #a0aec0; margin: 5px 0; font-size: 12px;">
                Best regards,<br>
                The GymTonic Team 💜
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email send result:', result);
    logger.info(`Welcome email with discount sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    logger.error('Welcome email with discount error:', error);
    throw error;
  }
};