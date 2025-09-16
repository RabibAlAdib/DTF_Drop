import { NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/emailService';

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

    // Log contact form submission
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // Send email notification
    try {
      const emailResult = await sendContactFormEmail({
        name,
        email,
        subject,
        message
      });
      
      if (emailResult.success) {
        console.log('📧 Contact form email sent successfully');
      } else {
        console.error('📧 Contact form email failed:', emailResult.message);
      }
    } catch (emailError) {
      console.error('📧 Contact form email error:', emailError);
      // Don't fail the contact form if email fails
    }

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