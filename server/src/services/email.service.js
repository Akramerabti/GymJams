import { Resend } from 'resend';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit-table';
import { formatCurrency } from '../utils/formatters.js';

if (!process.env.RESEND_API_KEY) {
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

  const subscriptionAccessUrl = isGuest
    ? `${process.env.CLIENT_URL}/dashboard?accessToken=${subscriptionData.accessToken}`
    : `${process.env.CLIENT_URL}/dashboard`;

  try {
    await resend.emails.send({
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
            <p style="margin: 0;">Contact our support team at support@gymtonic.ca</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">© 2024 GymTonic. All rights reserved.</p>
          </div>
        </div>
      `
    });

    return true;
  } catch (error) {
    logger.error('Subscription receipt email error:', error);
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
      
      // Add company logo
      // doc.image('public/logo.png', 50, 45, { width: 150 });
      
      // Add receipt title
      doc.fontSize(20).text('ORDER RECEIPT', { align: 'center' });
      doc.moveDown();
      
      // Add order details
      doc.fontSize(12);
      
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
      doc.font('Helvetica').text(`${order.shippingMethod === 'express' ? 'Express Shipping' : 'Standard Shipping'}`);
      doc.moveDown(2);
      
      // Order items table
      const tableData = {
        headers: ['Item', 'Quantity', 'Price', 'Total'],
        rows: order.items.map(item => [
          item.product.name || 'Product',
          item.quantity.toString(),
          formatCurrency(item.price),
          formatCurrency(item.price * item.quantity)
        ])
      };
      
      doc.table(tableData, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10),
        width: 500
      });
      
      doc.moveDown();
      
      // Order summary
      const summaryX = 370;
      const summaryStartY = doc.y;
      
      doc.font('Helvetica').fontSize(10).text('Subtotal:', summaryX, summaryStartY);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.subtotal), 500, summaryStartY, { align: 'right' });
      
      doc.font('Helvetica').fontSize(10).text('Shipping:', summaryX, summaryStartY + 20);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.shippingCost), 500, summaryStartY + 20, { align: 'right' });
      
      doc.font('Helvetica').fontSize(10).text('Tax:', summaryX, summaryStartY + 40);
      doc.font('Helvetica').fontSize(10).text(formatCurrency(order.tax), 500, summaryStartY + 40, { align: 'right' });
      
      doc.moveTo(summaryX, summaryStartY + 60).lineTo(500, summaryStartY + 60).stroke();
      
      doc.font('Helvetica-Bold').fontSize(12).text('Total:', summaryX, summaryStartY + 70);
      doc.font('Helvetica-Bold').fontSize(12).text(formatCurrency(order.total), 500, summaryStartY + 70, { align: 'right' });
      
      // Footer
      doc.moveDown(3);
      doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });
      doc.fontSize(8).text('If you have any questions, please contact our customer support at support@example.com', { align: 'center' });
      
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
          <div style="text-align: center; padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <h1 style="color: #2b6cb0; margin: 0;">Order Confirmation</h1>
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
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
                ${formattedItems}
              </table>
              
              <table style="width: 100%; max-width: 300px; margin-left: auto; border-collapse: collapse;">
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
                <tr style="font-weight: bold; font-size: 18px;">
                  <td style="padding: 10px 0 5px; text-align: left; border-top: 2px solid #e2e8f0;">Total:</td>
                  <td style="padding: 10px 0 5px; text-align: right; border-top: 2px solid #e2e8f0;">$${order.total.toFixed(2)}</td>
                </tr>
              </table>
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
              <a href="${process.env.CLIENT_URL}/orders?orderId=${orderIdString}" style="display: inline-block; padding: 10px 20px; background-color: #3182ce; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Track Your Order
              </a>
              <p style="margin-top: 20px; color: #718096; font-size: 14px;">
                A PDF receipt is attached to this email for your records.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">Questions about your order?</p>
            <p style="margin: 0; color: #718096; font-size: 14px;">Contact us at <a href="mailto:support@gymtonic.ca" style="color: #3182ce;">support@gymtonic.ca</a></p>
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
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been shipped and is on its way to you. You can track your package using the tracking information below.`
      },
      delivered: {
        subject: `Your Order #${orderIdString.slice(-8).toUpperCase()} Has Been Delivered`,
        title: 'Order Delivered',
        message: 'Your order has been delivered!',
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been delivered. We hope you enjoy your purchase!`
      },
      cancelled: {
        subject: `Your Order #${orderIdString.slice(-8).toUpperCase()} Has Been Cancelled`,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        details: `Your order #${orderIdString.slice(-8).toUpperCase()} has been cancelled. If you have any questions, please contact our customer service.`
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
            <p style="margin: 0; color: #718096; font-size: 14px;">Contact us at <a href="mailto:support@gymtonic.ca" style="color: #3182ce;">support@gymtonic.ca</a></p>
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