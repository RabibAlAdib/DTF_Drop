/**
 * Email Service for DTF Drop E-commerce
 * Handles order confirmations, notifications, and other email communications
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * Create email transporter based on environment configuration
 */
const createTransporter = () => {
  // Check if SMTP credentials are available
  const hasEmailConfig = process.env.EMAIL_HOST && 
                         process.env.EMAIL_PORT && 
                         process.env.EMAIL_USER && 
                         process.env.EMAIL_PASS;

  if (!hasEmailConfig) {
    console.warn('Email configuration not found. Email notifications will be logged instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Load email template from file
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} variables - Variables to replace in template
 */
const loadEmailTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'email', `${templateName}.html`);
    
    // Check if template exists, if not use fallback
    if (!fs.existsSync(templatePath)) {
      console.warn(`Email template ${templateName} not found. Using fallback.`);
      return generateFallbackTemplate(templateName, variables);
    }

    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });

    return template;
  } catch (error) {
    console.error('Error loading email template:', error);
    return generateFallbackTemplate(templateName, variables);
  }
};

/**
 * Generate fallback HTML template when template file is not available
 */
const generateFallbackTemplate = (templateName, variables) => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: #FF6B35; }
      .content { line-height: 1.6; color: #333; }
      .order-details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
      .button { display: inline-block; padding: 12px 24px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
  `;

  switch (templateName) {
    case 'order-confirmation':
      return `
        <!DOCTYPE html>
        <html>${baseStyle}
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DTF Drop</div>
              <h2>Order Confirmation</h2>
            </div>
            <div class="content">
              <p>Dear ${variables.customerName},</p>
              <p>Thank you for your order! We're excited to process your custom t-shirt order.</p>
              
              <div class="order-details">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
                <p><strong>Total Amount:</strong> ৳${variables.totalAmount}</p>
                <p><strong>Payment Method:</strong> ${variables.paymentMethod}</p>
                <p><strong>Delivery Address:</strong> ${variables.deliveryAddress}</p>
                <p><strong>Items:</strong></p>
                <ul>
                  ${variables.orderItems || 'Order items will be listed here'}
                </ul>
              </div>
              
              <p>Your order is being processed and you'll receive another email when it ships.</p>
              <p>If you have any questions, please contact us at +8801344823831 or reply to this email.</p>
              
              <p>Best regards,<br>The DTF Drop Team</p>
            </div>
            <div class="footer">
              <p>DTF Drop - Custom Drop Shoulder T-Shirts</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    
    case 'seller-notification':
      return `
        <!DOCTYPE html>
        <html>${baseStyle}
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DTF Drop</div>
              <h2>New Order Received!</h2>
            </div>
            <div class="content">
              <p>Hello Seller,</p>
              <p>You have received a new order for your products!</p>
              
              <div class="order-details">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
                <p><strong>Customer:</strong> ${variables.customerName}</p>
                <p><strong>Total Amount:</strong> ৳${variables.totalAmount}</p>
                <p><strong>Payment Method:</strong> ${variables.paymentMethod}</p>
                <p><strong>Items Ordered:</strong></p>
                <ul>
                  ${variables.orderItems || 'Order items will be listed here'}
                </ul>
                <p><strong>Customer Contact:</strong> ${variables.customerPhone}</p>
                <p><strong>Delivery Address:</strong> ${variables.deliveryAddress}</p>
              </div>
              
              <p>Please login to your seller dashboard to manage this order.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/seller/orders" class="button">View Orders</a>
              
              <p>Best regards,<br>The DTF Drop Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>${baseStyle}
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DTF Drop</div>
              <h2>Notification</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have a new notification from DTF Drop.</p>
              <p>Best regards,<br>The DTF Drop Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
  }
};

/**
 * Send email or log if SMTP not configured
 * @param {Object} emailOptions - Email configuration
 */
const sendEmail = async (emailOptions) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Log email instead of sending when SMTP not configured
    console.log('📧 Email would be sent (SMTP not configured):');
    console.log(`To: ${emailOptions.to}`);
    console.log(`Subject: ${emailOptions.subject}`);
    console.log(`Content: ${emailOptions.text || 'HTML content provided'}`);
    console.log('---');
    
    return { 
      success: true, 
      message: 'Email logged (SMTP not configured)',
      logged: true
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"DTF Drop" <${process.env.EMAIL_USER}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html
    });

    console.log('📧 Email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

/**
 * Send order confirmation email to customer
 * @param {Object} orderData - Order information
 */
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const orderItems = orderData.items.map(item => 
      `<li>${item.productName} (${item.color}, ${item.size}) x${item.quantity} - ৳${item.totalPrice}</li>`
    ).join('');

    const templateVariables = {
      customerName: orderData.customerInfo.name,
      orderNumber: orderData.orderNumber,
      totalAmount: orderData.pricing.totalAmount,
      paymentMethod: orderData.payment.method.toUpperCase(),
      deliveryAddress: orderData.delivery.address,
      orderItems
    };

    const htmlContent = loadEmailTemplate('order-confirmation', templateVariables);

    const result = await sendEmail({
      to: orderData.customerInfo.email,
      subject: `Order Confirmation - ${orderData.orderNumber} | DTF Drop`,
      html: htmlContent,
      text: `Thank you for your order! Order Number: ${orderData.orderNumber}. Total: ৳${orderData.pricing.totalAmount}`
    });

    return result;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order notification email to seller
 * @param {Object} orderData - Order information
 * @param {string} sellerEmail - Seller's email address
 */
export const sendSellerNotificationEmail = async (orderData, sellerEmail) => {
  try {
    const orderItems = orderData.items.map(item => 
      `<li>${item.productName} (${item.color}, ${item.size}) x${item.quantity} - ৳${item.totalPrice}</li>`
    ).join('');

    const templateVariables = {
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerInfo.name,
      customerPhone: orderData.customerInfo.phone,
      totalAmount: orderData.pricing.totalAmount,
      paymentMethod: orderData.payment.method.toUpperCase(),
      deliveryAddress: orderData.delivery.address,
      orderItems
    };

    const htmlContent = loadEmailTemplate('seller-notification', templateVariables);

    const result = await sendEmail({
      to: sellerEmail,
      subject: `New Order Received - ${orderData.orderNumber} | DTF Drop`,
      html: htmlContent,
      text: `New order received! Order Number: ${orderData.orderNumber}. Customer: ${orderData.customerInfo.name}`
    });

    return result;
  } catch (error) {
    console.error('Error sending seller notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send contact form email
 * @param {Object} contactData - Contact form data
 */
export const sendContactFormEmail = async (contactData) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Message:</strong><br>
            ${contactData.message.replace(/\n/g, '<br>')}
          </div>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form: ${contactData.subject} | DTF Drop`,
      html: htmlContent,
      text: `New contact form submission from ${contactData.name} (${contactData.email}): ${contactData.message}`
    });

    return result;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return { 
      success: false, 
      message: 'Email configuration not found',
      configured: false 
    };
  }

  try {
    await transporter.verify();
    return { 
      success: true, 
      message: 'Email configuration is valid',
      configured: true 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Email configuration error: ${error.message}`,
      configured: false 
    };
  }
};

export default {
  sendOrderConfirmationEmail,
  sendSellerNotificationEmail,
  sendContactFormEmail,
  testEmailConfiguration
};