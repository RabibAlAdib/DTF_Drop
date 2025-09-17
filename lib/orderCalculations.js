/**
 * Order Calculation Utilities for DTF Drop E-commerce
 * Handles delivery charges, product totals, and multi-variant cost tracking
 */

// Delivery zones and charges
export const DELIVERY_CHARGES = {
  INSIDE_DHAKA: 70,
  OUTSIDE_DHAKA: 130
};

// Dhaka area keywords for automatic detection
const DHAKA_KEYWORDS = [
  'dhaka', 'dhanmondi', 'gulshan', 'banani', 'uttara', 'mirpur', 'motijheel',
  'wari', 'old dhaka', 'ramna', 'tejgaon', 'mohammadpur', 'shantinagar',
  'malibagh', 'eskaton', 'paltan', 'farmgate', 'karwan bazar', 'panthapath',
  'lalmatia', 'kathalbagan', 'hatirpool', 'newmarket', 'azimpur', 'lalbagh',
  'kamrangirchar', 'sadarghat', 'chawkbazar', 'sutrapur', 'kotwali',
  'ramna', 'shahbagh', 'curzon hall', 'university area', 'tsc', 'nilkhet'
];

/**
 * Automatically detect if delivery address is in Dhaka
 * @param {string} address - The delivery address
 * @returns {boolean} - true if address is in Dhaka, false otherwise
 */
export const isDhakaAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  const addressLower = address.toLowerCase();
  return DHAKA_KEYWORDS.some(keyword => addressLower.includes(keyword));
};

/**
 * Calculate delivery charge based on address
 * @param {string} address - The delivery address
 * @param {boolean} forceIsDhaka - Force Dhaka status (optional override)
 * @returns {Object} - { isDhaka: boolean, charge: number }
 */
export const calculateDeliveryCharge = (address, forceIsDhaka = null) => {
  const isDhaka = forceIsDhaka !== null ? forceIsDhaka : isDhakaAddress(address);
  const charge = isDhaka ? DELIVERY_CHARGES.INSIDE_DHAKA : DELIVERY_CHARGES.OUTSIDE_DHAKA;
  
  return {
    isDhaka,
    charge
  };
};

/**
 * Calculate total price for a single product item with variants
 * @param {Object} item - Product item object
 * @param {string} item.productId - Product ID
 * @param {number} item.unitPrice - Price per unit
 * @param {number} item.quantity - Quantity ordered
 * @param {string} item.color - Color variant
 * @param {string} item.size - Size variant
 * @returns {Object} - Detailed price breakdown
 */
export const calculateItemTotal = (item) => {
  if (!item || !item.unitPrice || !item.quantity) {
    throw new Error('Invalid item data for calculation');
  }

  const unitPrice = parseFloat(item.unitPrice);
  const quantity = parseInt(item.quantity);
  
  if (isNaN(unitPrice) || isNaN(quantity) || quantity <= 0) {
    throw new Error('Invalid price or quantity values');
  }

  const totalPrice = unitPrice * quantity;
  
  return {
    productId: item.productId,
    color: item.color,
    size: item.size,
    unitPrice: parseFloat(unitPrice.toFixed(2)),
    quantity,
    totalPrice: parseFloat(totalPrice.toFixed(2))
  };
};

/**
 * Calculate subtotal for multiple cart items
 * @param {Array} cartItems - Array of cart item objects
 * @returns {Object} - Subtotal calculation details
 */
export const calculateSubtotal = (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      subtotal: 0,
      totalQuantity: 0,
      itemBreakdown: []
    };
  }

  let subtotal = 0;
  let totalQuantity = 0;
  const itemBreakdown = [];

  for (const item of cartItems) {
    try {
      const itemTotal = calculateItemTotal(item);
      subtotal += itemTotal.totalPrice;
      totalQuantity += itemTotal.quantity;
      itemBreakdown.push(itemTotal);
    } catch (error) {
      console.error('Error calculating item total:', error.message, item);
      // Skip invalid items but continue processing others
      continue;
    }
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalQuantity,
    itemBreakdown
  };
};

/**
 * Apply discount/promo code to order
 * @param {number} subtotal - Order subtotal
 * @param {string} promoCode - Promo code to apply
 * @param {Object} dynamicOffer - Dynamic offer from database (optional)
 * @returns {Object} - Discount calculation result
 */
export const calculateDiscount = (subtotal, promoCode, dynamicOffer = null) => {
  // Define available promo codes
  const PROMO_CODES = {
    'WELCOME10': { type: 'percentage', value: 10, minOrder: 500, description: 'Welcome 10% off' },
    'SAVE50': { type: 'fixed', value: 50, minOrder: 300, description: 'Save 50 Taka' },
    'NEWCUSTOMER': { type: 'percentage', value: 15, minOrder: 800, description: 'New Customer 15% off' },
    'FIRST100': { type: 'fixed', value: 100, minOrder: 1000, description: 'First Order 100 Taka off' }
  };

  if (!promoCode || typeof promoCode !== 'string') {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'No promo code applied'
    };
  }

  const promoUpper = promoCode.toUpperCase().trim();
  let promo = null;
  let isFromDatabase = false;

  // First check if it's a dynamic offer from database
  if (dynamicOffer && dynamicOffer.offerCode === promoUpper) {
    // Validate dynamic offer
    const now = new Date();
    const validFrom = new Date(dynamicOffer.validFrom);
    const validTo = new Date(dynamicOffer.validTo);

    if (!dynamicOffer.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This promo code is not active'
      };
    }

    if (now < validFrom || now > validTo) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This promo code has expired'
      };
    }

    if (dynamicOffer.usageLimit && dynamicOffer.usedCount >= dynamicOffer.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This promo code has reached its usage limit'
      };
    }

    promo = {
      type: dynamicOffer.discountType,
      value: dynamicOffer.discountValue,
      minOrder: dynamicOffer.minimumOrderValue || 0,
      description: dynamicOffer.title
    };
    isFromDatabase = true;
  } else {
    // Check hardcoded promo codes
    promo = PROMO_CODES[promoUpper];
  }

  if (!promo) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Invalid promo code'
    };
  }

  if (subtotal < promo.minOrder) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Minimum order of ${promo.minOrder} Taka required for this promo code`
    };
  }

  let discountAmount = 0;
  if (promo.type === 'percentage') {
    discountAmount = (subtotal * promo.value) / 100;
  } else if (promo.type === 'fixed') {
    discountAmount = promo.value;
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    isValid: true,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    promoCode: promoUpper,
    description: promo.description,
    message: `${promo.description} applied successfully`,
    isFromDatabase,
    offerId: isFromDatabase ? dynamicOffer._id : null
  };
};

/**
 * Calculate complete order total with all charges and discounts
 * @param {Array} cartItems - Cart items array
 * @param {string} deliveryAddress - Delivery address
 * @param {string} promoCode - Promo code (optional)
 * @param {boolean} forceDhaka - Force Dhaka delivery (optional)
 * @returns {Object} - Complete order calculation
 */
export const calculateOrderTotal = (cartItems, deliveryAddress, promoCode = '', forceDhaka = null) => {
  try {
    // Calculate subtotal
    const subtotalResult = calculateSubtotal(cartItems);
    
    // Calculate delivery charge
    const deliveryResult = calculateDeliveryCharge(deliveryAddress, forceDhaka);
    
    // Calculate discount
    const discountResult = calculateDiscount(subtotalResult.subtotal, promoCode);
    
    // Calculate final total
    const totalBeforeDiscount = subtotalResult.subtotal + deliveryResult.charge;
    const finalTotal = totalBeforeDiscount - discountResult.discountAmount;
    
    return {
      success: true,
      calculation: {
        // Item details
        items: subtotalResult.itemBreakdown,
        totalQuantity: subtotalResult.totalQuantity,
        
        // Price breakdown
        subtotal: subtotalResult.subtotal,
        deliveryCharge: deliveryResult.charge,
        discountAmount: discountResult.discountAmount,
        totalAmount: parseFloat(finalTotal.toFixed(2)),
        
        // Delivery info
        delivery: {
          isDhaka: deliveryResult.isDhaka,
          charge: deliveryResult.charge,
          zone: deliveryResult.isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'
        },
        
        // Discount info
        discount: discountResult,
        
        // Summary
        summary: {
          itemsCount: subtotalResult.itemBreakdown.length,
          totalQuantity: subtotalResult.totalQuantity,
          subtotal: subtotalResult.subtotal,
          delivery: deliveryResult.charge,
          discount: discountResult.discountAmount,
          total: parseFloat(finalTotal.toFixed(2))
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      calculation: null
    };
  }
};

/**
 * Validate order data before processing
 * @param {Object} orderData - Order data to validate
 * @returns {Object} - Validation result
 */
export const validateOrderData = (orderData) => {
  const errors = [];
  
  // Check customer info
  if (!orderData.customerInfo) {
    errors.push('Customer information is required');
  } else {
    if (!orderData.customerInfo.name || orderData.customerInfo.name.trim().length < 2) {
      errors.push('Valid customer name is required');
    }
    if (!orderData.customerInfo.email || !/\S+@\S+\.\S+/.test(orderData.customerInfo.email)) {
      errors.push('Valid email address is required');
    }
    if (!orderData.customerInfo.phone || orderData.customerInfo.phone.trim().length < 10) {
      errors.push('Valid phone number is required');
    }
    if (!orderData.customerInfo.address || orderData.customerInfo.address.trim().length < 10) {
      errors.push('Valid delivery address is required');
    }
  }
  
  // Check items
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    orderData.items.forEach((item, index) => {
      if (!item.productId) errors.push(`Item ${index + 1}: Product ID is required`);
      if (!item.productName) errors.push(`Item ${index + 1}: Product name is required`);
      if (!item.color) errors.push(`Item ${index + 1}: Color selection is required`);
      if (!item.size) errors.push(`Item ${index + 1}: Size selection is required`);
      if (!item.unitPrice || item.unitPrice <= 0) errors.push(`Item ${index + 1}: Valid price is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Valid quantity is required`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Order data is valid' : `${errors.length} validation errors found`
  };
};

/**
 * Convert cart items to order items format
 * @param {Object} cartItems - Cart items from context
 * @param {Array} products - Products array from context
 * @returns {Array} - Formatted order items
 */
export const convertCartToOrderItems = (cartItems, products) => {
  const orderItems = [];
  
  for (const [itemKey, quantity] of Object.entries(cartItems)) {
    if (itemKey === '_variants' || quantity <= 0) continue;
    
    // Extract product ID and variant info from key
    const parts = itemKey.split('_');
    const productId = parts[0];
    const color = parts[1] || 'default';
    const size = parts[2] || 'default';
    
    // Find product details
    const product = products.find(p => p._id === productId);
    if (!product) continue;
    
    // Get variant-specific image
    let productImage = product.images?.[0] || '';
    if (product.colorImages && color !== 'default') {
      const colorImage = product.colorImages.find(ci => ci.color === color);
      if (colorImage) productImage = colorImage.url;
    }
    
    const unitPrice = product.offerPrice || product.price;
    
    orderItems.push({
      productId: product._id,
      productName: product.name,
      color,
      size,
      unitPrice,
      quantity: parseInt(quantity),
      totalPrice: unitPrice * parseInt(quantity),
      productImage,
      customization: {
        hasCustomDesign: false,
        customDesignUrl: '',
        customText: '',
        customNumber: '',
        customSlogan: '',
        specialInstructions: ''
      }
    });
  }
  
  return orderItems;
};

/**
 * Generate order summary for display
 * @param {Object} orderCalculation - Result from calculateOrderTotal
 * @returns {Object} - Formatted order summary
 */
export const generateOrderSummary = (orderCalculation) => {
  if (!orderCalculation.success) {
    return {
      success: false,
      error: orderCalculation.error
    };
  }
  
  const calc = orderCalculation.calculation;
  
  return {
    success: true,
    summary: {
      itemsPreview: calc.items.map(item => ({
        name: `${item.productId} (${item.color}, ${item.size})`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      totals: {
        itemsCount: calc.summary.itemsCount,
        totalQuantity: calc.summary.totalQuantity,
        subtotal: calc.summary.subtotal,
        deliveryInfo: `${calc.delivery.zone} - ৳${calc.delivery.charge}`,
        discountInfo: calc.discount.isValid ? 
          `${calc.discount.description} - ৳${calc.discount.discountAmount}` : 'No discount applied',
        finalTotal: calc.summary.total
      },
      breakdown: {
        subtotal: calc.subtotal,
        delivery: calc.deliveryCharge,
        discount: calc.discountAmount,
        total: calc.totalAmount
      }
    }
  };
};

export default {
  calculateDeliveryCharge,
  calculateItemTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateOrderTotal,
  validateOrderData,
  convertCartToOrderItems,
  generateOrderSummary,
  isDhakaAddress,
  DELIVERY_CHARGES
};