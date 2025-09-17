import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import SystemSettings from '@/models/SystemSettings';
import { isAdminUser } from '@/lib/authAdmin';

export async function GET(request) {
  try {
    // Check admin authorization
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    await connectDB();
    
    // Get or create settings
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        siteName: settings.siteName,
        currency: settings.currency,
        maintenanceMode: settings.maintenanceMode,
        newUserRegistration: settings.newUserRegistration,
        allowGuestCheckout: settings.allowGuestCheckout,
        enableReviews: settings.enableReviews
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check admin authorization
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const newSettings = await request.json();
    
    // Validate settings structure
    const allowedKeys = ['siteName', 'currency', 'maintenanceMode', 'newUserRegistration', 'allowGuestCheckout', 'enableReviews'];
    const sanitizedSettings = {};
    
    for (const key of allowedKeys) {
      if (newSettings.hasOwnProperty(key)) {
        sanitizedSettings[key] = newSettings[key];
      }
    }

    await connectDB();
    
    // Get or create settings and update
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = new SystemSettings(sanitizedSettings);
    } else {
      Object.assign(settings, sanitizedSettings);
    }
    
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        siteName: settings.siteName,
        currency: settings.currency,
        maintenanceMode: settings.maintenanceMode,
        newUserRegistration: settings.newUserRegistration,
        allowGuestCheckout: settings.allowGuestCheckout,
        enableReviews: settings.enableReviews
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update settings'
    }, { status: 500 });
  }
}