import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/paymentService';

// GET /api/payment/methods - Get available payment methods
export async function GET() {
  try {
    const paymentService = new PaymentService();
    const methods = paymentService.getAvailablePaymentMethods();
    
    return NextResponse.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payment methods'
    }, { status: 500 });
  }
}