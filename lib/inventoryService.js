/**
 * Inventory Service for DTF Drop E-commerce
 * Handles stock management, reservations, and automatic deductions
 */

import Product from '@/models/Product';
import Order from '@/models/Order';

/**
 * Check if items are available in stock
 * @param {Array} items - Array of items with productId, color, size, quantity
 * @returns {Object} - Availability status and details
 */
export const checkStockAvailability = async (items) => {
  const availabilityCheck = {
    allAvailable: true,
    items: [],
    outOfStockItems: [],
    lowStockWarnings: []
  };

  for (const item of items) {
    const { productId, color, size, quantity } = item;

    try {
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        availabilityCheck.allAvailable = false;
        availabilityCheck.outOfStockItems.push({
          ...item,
          reason: 'Product not found'
        });
        continue;
      }

      // Find the specific variant
      const variant = product.variants.find(v => 
        v.color === color && v.size === size
      );

      if (!variant) {
        availabilityCheck.allAvailable = false;
        availabilityCheck.outOfStockItems.push({
          ...item,
          productName: product.name,
          reason: 'Variant not available'
        });
        continue;
      }

      const itemStatus = {
        productId,
        productName: product.name,
        color,
        size,
        requestedQuantity: quantity,
        availableStock: variant.stock,
        available: variant.stock >= quantity
      };

      availabilityCheck.items.push(itemStatus);

      // Check availability
      if (variant.stock < quantity) {
        availabilityCheck.allAvailable = false;
        availabilityCheck.outOfStockItems.push({
          ...item,
          productName: product.name,
          availableStock: variant.stock,
          reason: `Only ${variant.stock} available, requested ${quantity}`
        });
      } else if (variant.stock <= 5 && variant.stock >= quantity) {
        // Low stock warning
        availabilityCheck.lowStockWarnings.push({
          ...item,
          productName: product.name,
          availableStock: variant.stock,
          message: `Low stock: Only ${variant.stock} left`
        });
      }

    } catch (error) {
      console.error(`Error checking stock for product ${productId}:`, error);
      availabilityCheck.allAvailable = false;
      availabilityCheck.outOfStockItems.push({
        ...item,
        reason: 'Error checking stock'
      });
    }
  }

  return availabilityCheck;
};

/**
 * Reserve stock for order processing
 * @param {Array} items - Array of items to reserve
 * @param {string} orderId - Order ID for tracking
 * @returns {Object} - Reservation status
 */
export const reserveStock = async (items, orderId) => {
  const reservationResult = {
    success: false,
    reservedItems: [],
    failedItems: [],
    reservationId: `RES-${orderId}-${Date.now()}`
  };

  // First, check availability
  const availability = await checkStockAvailability(items);
  if (!availability.allAvailable) {
    return {
      ...reservationResult,
      failedItems: availability.outOfStockItems
    };
  }

  // Reserve stock (in a real system, you'd use transactions)
  const reservedItems = [];
  
  for (const item of items) {
    try {
      const { productId, color, size, quantity } = item;
      
      const product = await Product.findById(productId);
      const variant = product.variants.find(v => 
        v.color === color && v.size === size
      );

      if (variant && variant.stock >= quantity) {
        // Reserve stock by reducing available stock
        // In a more sophisticated system, you'd have a separate reservations table
        variant.stock -= quantity;
        variant.reserved = (variant.reserved || 0) + quantity;
        
        await product.save();
        
        reservedItems.push({
          productId,
          productName: product.name,
          color,
          size,
          quantity,
          reservedAt: new Date()
        });
      } else {
        reservationResult.failedItems.push({
          ...item,
          reason: 'Insufficient stock during reservation'
        });
      }
    } catch (error) {
      console.error(`Error reserving stock for ${item.productId}:`, error);
      reservationResult.failedItems.push({
        ...item,
        reason: 'Reservation error'
      });
    }
  }

  reservationResult.success = reservedItems.length === items.length;
  reservationResult.reservedItems = reservedItems;

  return reservationResult;
};

/**
 * Deduct stock after successful payment
 * @param {Array} items - Array of items to deduct
 * @param {string} orderId - Order ID
 * @returns {Object} - Deduction status
 */
export const deductStock = async (items, orderId) => {
  const deductionResult = {
    success: false,
    deductedItems: [],
    failedItems: []
  };

  for (const item of items) {
    try {
      const { productId, color, size, quantity } = item;
      
      const product = await Product.findById(productId);
      if (!product) {
        deductionResult.failedItems.push({
          ...item,
          reason: 'Product not found'
        });
        continue;
      }

      const variant = product.variants.find(v => 
        v.color === color && v.size === size
      );

      if (!variant) {
        deductionResult.failedItems.push({
          ...item,
          reason: 'Variant not found'
        });
        continue;
      }

      // Deduct from reserved stock first, then available stock
      if (variant.reserved && variant.reserved >= quantity) {
        variant.reserved -= quantity;
      } else {
        // If no reservation, deduct directly from stock
        if (variant.stock >= quantity) {
          variant.stock -= quantity;
        } else {
          deductionResult.failedItems.push({
            ...item,
            reason: 'Insufficient stock for deduction'
          });
          continue;
        }
      }

      // Note: Sales count will be updated when payment is completed, not when stock is deducted
      await product.save();

      deductionResult.deductedItems.push({
        productId,
        productName: product.name,
        color,
        size,
        quantity,
        deductedAt: new Date(),
        remainingStock: variant.stock
      });

      console.log(`Deducted ${quantity} units of ${product.name} (${color}-${size}) for order ${orderId}`);

    } catch (error) {
      console.error(`Error deducting stock for ${item.productId}:`, error);
      deductionResult.failedItems.push({
        ...item,
        reason: 'Deduction error'
      });
    }
  }

  deductionResult.success = deductionResult.deductedItems.length === items.length;

  return deductionResult;
};

/**
 * Restore stock (for cancelled orders or refunds)
 * @param {Array} items - Array of items to restore
 * @param {string} orderId - Order ID
 * @returns {Object} - Restoration status
 */
export const restoreStock = async (items, orderId) => {
  const restorationResult = {
    success: false,
    restoredItems: [],
    failedItems: []
  };

  for (const item of items) {
    try {
      const { productId, color, size, quantity } = item;
      
      const product = await Product.findById(productId);
      if (!product) {
        restorationResult.failedItems.push({
          ...item,
          reason: 'Product not found'
        });
        continue;
      }

      const variant = product.variants.find(v => 
        v.color === color && v.size === size
      );

      if (!variant) {
        restorationResult.failedItems.push({
          ...item,
          reason: 'Variant not found'
        });
        continue;
      }

      // Restore stock
      variant.stock += quantity;

      // Reduce sales count
      product.numberofSales = Math.max(0, product.numberofSales - quantity);

      await product.save();

      restorationResult.restoredItems.push({
        productId,
        productName: product.name,
        color,
        size,
        quantity,
        restoredAt: new Date(),
        newStock: variant.stock
      });

      console.log(`Restored ${quantity} units of ${product.name} (${color}-${size}) for order ${orderId}`);

    } catch (error) {
      console.error(`Error restoring stock for ${item.productId}:`, error);
      restorationResult.failedItems.push({
        ...item,
        reason: 'Restoration error'
      });
    }
  }

  restorationResult.success = restorationResult.restoredItems.length === items.length;

  return restorationResult;
};

/**
 * Get low stock alerts for seller
 * @param {string} userId - Seller user ID
 * @param {number} threshold - Low stock threshold (default: 5)
 * @returns {Array} - Array of low stock alerts
 */
export const getLowStockAlerts = async (userId, threshold = 5) => {
  try {
    const products = await Product.find({ userId });
    const alerts = [];

    products.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.stock <= threshold && variant.stock > 0) {
          alerts.push({
            productId: product._id,
            productName: product.name,
            variant: {
              color: variant.color,
              size: variant.size,
              stock: variant.stock
            },
            alertType: variant.stock === 0 ? 'out_of_stock' : 'low_stock',
            threshold,
            message: variant.stock === 0 
              ? `${product.name} (${variant.color}-${variant.size}) is out of stock`
              : `${product.name} (${variant.color}-${variant.size}) is low on stock (${variant.stock} left)`
          });
        }
      });
    });

    return alerts;
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    return [];
  }
};

/**
 * Update stock levels in bulk
 * @param {Array} updates - Array of stock updates
 * @param {string} userId - User ID for authorization
 * @returns {Object} - Update result
 */
export const bulkUpdateStock = async (updates, userId) => {
  const updateResult = {
    success: false,
    updatedItems: [],
    failedItems: []
  };

  for (const update of updates) {
    try {
      const { productId, color, size, quantity, operation = 'set' } = update;

      const product = await Product.findOne({ _id: productId, userId });
      if (!product) {
        updateResult.failedItems.push({
          ...update,
          reason: 'Product not found or unauthorized'
        });
        continue;
      }

      const variant = product.variants.find(v => 
        v.color === color && v.size === size
      );

      if (!variant) {
        updateResult.failedItems.push({
          ...update,
          reason: 'Variant not found'
        });
        continue;
      }

      let newStock = quantity;
      
      switch (operation) {
        case 'add':
          newStock = variant.stock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, variant.stock - quantity);
          break;
        case 'set':
        default:
          newStock = Math.max(0, quantity);
          break;
      }

      variant.stock = newStock;
      await product.save();

      updateResult.updatedItems.push({
        productId,
        productName: product.name,
        color,
        size,
        oldStock: operation === 'set' ? null : (operation === 'add' ? newStock - quantity : newStock + quantity),
        newStock,
        operation
      });

    } catch (error) {
      console.error(`Error updating stock for ${update.productId}:`, error);
      updateResult.failedItems.push({
        ...update,
        reason: 'Update error'
      });
    }
  }

  updateResult.success = updateResult.updatedItems.length === updates.length;

  return updateResult;
};

export default {
  checkStockAvailability,
  reserveStock,
  deductStock,
  restoreStock,
  getLowStockAlerts,
  bulkUpdateStock
};