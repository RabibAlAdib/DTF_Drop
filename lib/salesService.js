/**
 * Sales Service - Handles accurate sales count management
 */

import Product from '@/models/Product';

/**
 * Update sales count when order is completed (payment successful or COD delivered)
 */
export const incrementSalesCount = async (orderItems) => {
  try {
    for (const item of orderItems) {
      // Handle both populated and non-populated productId
      const productId = item.productId?._id || item.productId;
      
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { numberofSales: item.quantity } }
      );
    }
    
    console.log(`✅ Sales count incremented for ${orderItems.length} items`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to increment sales count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Decrement sales count when order is cancelled or returned
 */
export const decrementSalesCount = async (orderItems) => {
  try {
    for (const item of orderItems) {
      // Handle both populated and non-populated productId
      const productId = item.productId?._id || item.productId;
      
      // First get current sales count to ensure we don't go below 0
      const product = await Product.findById(productId);
      if (product && product.numberofSales >= item.quantity) {
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { numberofSales: -item.quantity } }
        );
      } else if (product) {
        // Set to 0 if would go negative
        await Product.findByIdAndUpdate(
          productId,
          { numberofSales: 0 }
        );
      }
    }
    
    console.log(`✅ Sales count decremented for ${orderItems.length} items`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to decrement sales count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Recalculate accurate sales count for all products based on completed orders
 */
export const recalculateSalesCount = async () => {
  try {
    const Order = (await import('@/models/Order')).default;
    
    // Get all completed orders (payment completed or COD delivered)
    const completedOrders = await Order.find({
      $or: [
        { 'payment.status': 'completed' },
        { 
          'payment.method': 'cash_on_delivery',
          'status': 'delivered'
        }
      ]
    });

    // Group by product and count total sales
    const productSales = {};
    
    for (const order of completedOrders) {
      for (const item of order.items) {
        const productId = item.productId.toString();
        if (!productSales[productId]) {
          productSales[productId] = 0;
        }
        productSales[productId] += item.quantity;
      }
    }

    // Update all products with accurate sales count
    const updates = [];
    for (const [productId, salesCount] of Object.entries(productSales)) {
      updates.push(
        Product.findByIdAndUpdate(productId, { numberofSales: salesCount })
      );
    }

    // Reset products with no sales to 0
    await Product.updateMany(
      { _id: { $nin: Object.keys(productSales) } },
      { numberofSales: 0 }
    );

    await Promise.all(updates);
    
    console.log(`✅ Recalculated sales count for ${Object.keys(productSales).length} products`);
    return { 
      success: true, 
      updatedProducts: Object.keys(productSales).length,
      totalOrders: completedOrders.length
    };
  } catch (error) {
    console.error('❌ Failed to recalculate sales count:', error);
    return { success: false, error: error.message };
  }
};