import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';
import { getSellerAuth } from '@/lib/authUtil';

await connectDB();

// GET /api/inventory/alerts - Get low stock and out of stock alerts
export async function GET(req) {
  try {
    // Use getSellerAuth to handle both cookie and Bearer token authentication
    const { userId, isSeller, error } = await getSellerAuth(req);
    
    if (!userId || error) {
      return NextResponse.json({ 
        success: false, 
        message: error || "Authentication required" 
      }, { status: 401 });
    }

    if (!isSeller) {
      return NextResponse.json({ 
        success: false, 
        message: "Only sellers are authorized for this action" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const lowStockThreshold = parseInt(searchParams.get('threshold') || '5');
    const alertType = searchParams.get('type'); // 'low_stock', 'out_of_stock', 'all'

    // Get seller's products
    const products = await Product.find({ userId })
      .select('name variants images colors sizes')
      .lean();

    let alerts = [];

    // Process each product for alerts
    products.forEach(product => {
      product.variants.forEach(variant => {
        const alertData = {
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0] || null,
          variant: {
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            currentStock: variant.stock
          },
          threshold: lowStockThreshold,
          severity: 'medium'
        };

        // Check for out of stock
        if (variant.stock === 0) {
          alerts.push({
            ...alertData,
            type: 'out_of_stock',
            message: `${product.name} (${variant.color} - ${variant.size}) is out of stock`,
            severity: 'high',
            priority: 1
          });
        }
        // Check for low stock
        else if (variant.stock <= lowStockThreshold) {
          alerts.push({
            ...alertData,
            type: 'low_stock',
            message: `${product.name} (${variant.color} - ${variant.size}) is running low (${variant.stock} left)`,
            severity: variant.stock <= 2 ? 'high' : 'medium',
            priority: variant.stock <= 2 ? 2 : 3
          });
        }
      });
    });

    // Filter by alert type if specified
    if (alertType && alertType !== 'all') {
      alerts = alerts.filter(alert => alert.type === alertType);
    }

    // Sort by priority and stock level
    alerts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Higher priority first
      }
      return a.variant.currentStock - b.variant.currentStock; // Lower stock first
    });

    // Get alert summary
    const summary = {
      totalAlerts: alerts.length,
      outOfStockAlerts: alerts.filter(a => a.type === 'out_of_stock').length,
      lowStockAlerts: alerts.filter(a => a.type === 'low_stock').length,
      highPriorityAlerts: alerts.filter(a => a.severity === 'high').length,
      affectedProducts: [...new Set(alerts.map(a => a.productId))].length
    };

    return NextResponse.json({
      success: true,
      alerts,
      summary,
      settings: {
        lowStockThreshold,
        alertTypes: ['out_of_stock', 'low_stock']
      }
    });

  } catch (error) {
    console.error('Get inventory alerts error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch inventory alerts'
    }, { status: 500 });
  }
}

// POST /api/inventory/alerts/dismiss - Dismiss or acknowledge alerts
export async function POST(req) {
  try {
    // Use getSellerAuth to handle both cookie and Bearer token authentication
    const { userId, isSeller, error } = await getSellerAuth(req);
    
    if (!userId || error) {
      return NextResponse.json({ 
        success: false, 
        message: error || "Authentication required" 
      }, { status: 401 });
    }

    if (!isSeller) {
      return NextResponse.json({ 
        success: false, 
        message: "Only sellers are authorized for this action" 
      }, { status: 403 });
    }

    const { alertIds, action = 'acknowledge' } = await req.json();

    // For now, this is a placeholder since alerts are generated dynamically
    // In a full implementation, you might want to store alert acknowledgments
    // in the database to avoid showing the same alert repeatedly

    console.log(`User ${userId} ${action}ed alerts:`, alertIds);

    return NextResponse.json({
      success: true,
      message: `Alerts ${action}ed successfully`,
      action,
      alertIds
    });

  } catch (error) {
    console.error('Dismiss alerts error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to dismiss alerts'
    }, { status: 500 });
  }
}