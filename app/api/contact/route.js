import { NextResponse } from 'next/server';
import { sendEmail } from '../../../src/utils/replitmail';

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Send email using Replit Mail integration
    const emailContent = `
New contact form submission from DTF Drop website:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent through the DTF Drop contact form.
    `.trim();

    const result = await sendEmail({
      to: 'dtfdrop25@gmail.com',
      subject: `Contact Form: ${subject}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="background-color: #ffffff; padding: 15px; border-left: 4px solid #3B82F6; border-radius: 4px; white-space: pre-line;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #6c757d; font-size: 14px; text-align: center;">
            This message was sent through the DTF Drop contact form.
          </p>
        </div>
      `
    });

    console.log('Contact form email sent:', result);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}