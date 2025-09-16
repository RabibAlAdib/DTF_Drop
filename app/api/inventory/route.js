import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';
import { getSellerAuth } from '@/lib/authUtil';

await connectDB();

// GET /api/inventory - Get inventory status for seller's products
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
    const lowStockThreshold = parseInt(searchParams.get('lowStockThreshold') || '5');
    const status = searchParams.get('status'); // 'low_stock', 'out_of_stock', 'in_stock'

    // Get all products for this seller
    let query = { userId };
    const products = await Product.find(query).select('name variants colors sizes rating reviewCount');

    // Process inventory data
    const inventory = products.map(product => {
      const variants = product.variants.map(variant => {
        let stockStatus = 'in_stock';
        if (variant.stock === 0) {
          stockStatus = 'out_of_stock';
        } else if (variant.stock <= lowStockThreshold) {
          stockStatus = 'low_stock';
        }

        return {
          ...variant.toObject(),
          stockStatus
        };
      });

      // Calculate total stock
      const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
      const lowStockVariants = variants.filter(v => v.stockStatus === 'low_stock').length;
      const outOfStockVariants = variants.filter(v => v.stockStatus === 'out_of_stock').length;

      let overallStatus = 'in_stock';
      if (totalStock === 0) {
        overallStatus = 'out_of_stock';
      } else if (lowStockVariants > 0 || totalStock <= lowStockThreshold) {
        overallStatus = 'low_stock';
      }

      return {
        productId: product._id,
        productName: product.name,
        totalStock,
        variants,
        overallStatus,
        lowStockVariants,
        outOfStockVariants,
        rating: product.rating,
        reviewCount: product.reviewCount
      };
    });

    // Filter by status if requested
    let filteredInventory = inventory;
    if (status) {
      filteredInventory = inventory.filter(item => item.overallStatus === status);
    }

    // Get summary statistics
    const stats = {
      totalProducts: inventory.length,
      inStockProducts: inventory.filter(p => p.overallStatus === 'in_stock').length,
      lowStockProducts: inventory.filter(p => p.overallStatus === 'low_stock').length,
      outOfStockProducts: inventory.filter(p => p.overallStatus === 'out_of_stock').length,
      totalVariants: inventory.reduce((sum, p) => sum + p.variants.length, 0),
      lowStockAlerts: inventory.reduce((sum, p) => sum + p.lowStockVariants, 0),
      outOfStockAlerts: inventory.reduce((sum, p) => sum + p.outOfStockVariants, 0)
    };

    return NextResponse.json({
      success: true,
      inventory: filteredInventory,
      stats,
      settings: {
        lowStockThreshold
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch inventory data'
    }, { status: 500 });
  }
}

// PUT /api/inventory - Update stock levels
export async function PUT(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { productId, updates } = await req.json();

    // Enhanced input validation
    if (!productId || !updates || !Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        message: 'Product ID and updates array are required'
      }, { status: 400 });
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one update is required'
      }, { status: 400 });
    }

    // Validate each update object
    for (const update of updates) {
      const { color, size, stock, operation = 'set' } = update;
      
      if (!color || !size) {
        return NextResponse.json({
          success: false,
          message: 'Color and size are required for each update'
        }, { status: 400 });
      }

      if (stock === undefined || stock === null) {
        return NextResponse.json({
          success: false,
          message: 'Stock value is required for each update'
        }, { status: 400 });
      }

      if (typeof stock !== 'number' || stock < 0) {
        return NextResponse.json({
          success: false,
          message: 'Stock must be a non-negative number'
        }, { status: 400 });
      }

      const validOperations = ['set', 'add', 'subtract'];
      if (!validOperations.includes(operation)) {
        return NextResponse.json({
          success: false,
          message: `Invalid operation: ${operation}. Must be one of: ${validOperations.join(', ')}`
        }, { status: 400 });
      }
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }

    // Check ownership
    if (product.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to update this product inventory'
      }, { status: 403 });
    }

    // Process updates
    const updatedVariants = [];
    for (const update of updates) {
      const { color, size, stock, operation = 'set' } = update;

      if (!color || !size || stock === undefined) {
        continue; // Skip invalid updates
      }

      // Find the variant
      const variantIndex = product.variants.findIndex(v => 
        v.color === color && v.size === size
      );

      if (variantIndex === -1) {
        // Create new variant if it doesn't exist
        if (operation === 'set' && stock >= 0) {
          const newVariant = {
            color,
            size,
            stock: Math.floor(stock),
            sku: `${product.name.replace(/\s+/g, '-').toLowerCase()}-${color.toLowerCase()}-${size.toLowerCase()}-${Date.now()}`
          };
          product.variants.push(newVariant);
          updatedVariants.push(newVariant);
        }
      } else {
        // Update existing variant
        let newStock = stock;
        
        if (operation === 'add') {
          newStock = product.variants[variantIndex].stock + stock;
        } else if (operation === 'subtract') {
          newStock = product.variants[variantIndex].stock - stock;
        }

        // Ensure stock doesn't go negative
        newStock = Math.max(0, Math.floor(newStock));
        
        product.variants[variantIndex].stock = newStock;
        updatedVariants.push(product.variants[variantIndex]);
      }
    }

    await product.save();

    console.log(`Inventory updated for product ${productId} by user ${userId}: ${updatedVariants.length} variants`);

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      updatedVariants,
      product: {
        _id: product._id,
        name: product.name,
        variants: product.variants
      }
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update inventory'
    }, { status: 500 });
  }
}