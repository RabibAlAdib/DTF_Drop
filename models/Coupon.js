import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  // Coupon identification
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  
  // Seller information
  userId: { 
    type: String, 
    required: true, 
    ref: 'User',
    index: true
  },
  
  // Coupon details
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: false,
    maxlength: 500
  },
  
  // Discount configuration
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    required: false,
    min: 0 // For percentage discounts, cap the maximum discount
  },
  
  // Usage restrictions
  minimumOrderAmount: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  maximumUsageLimit: {
    type: Number,
    required: false,
    min: 1 // null means unlimited
  },
  usagePerCustomerLimit: {
    type: Number,
    required: false,
    default: 1,
    min: 1
  },
  
  // Product restrictions
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }], // Empty array means applicable to all products
  
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Category restrictions
  applicableCategories: [{
    type: String
  }], // Empty array means applicable to all categories
  
  // Date restrictions
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  
  // Status and analytics
  isActive: {
    type: Boolean,
    default: true
  },
  totalUsageCount: {
    type: Number,
    default: 0
  },
  totalDiscountGiven: {
    type: Number,
    default: 0
  },
  
  // Usage tracking
  usageHistory: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    userId: {
      type: String,
      ref: 'User'
    },
    discountAmount: {
      type: Number,
      required: true
    },
    orderAmount: {
      type: Number,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Special coupon types
  couponType: {
    type: String,
    enum: ['general', 'welcome', 'loyalty', 'seasonal', 'flash_sale', 'bulk_order'],
    default: 'general'
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ userId: 1, isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1, isActive: 1 });
CouponSchema.index({ isActive: 1, validUntil: 1 });
CouponSchema.index({ couponType: 1, isActive: 1 });

// Virtual to check if coupon is currently valid
CouponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.maximumUsageLimit === null || this.totalUsageCount < this.maximumUsageLimit);
});

// Virtual to check if coupon is expired
CouponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to get remaining usage count
CouponSchema.virtual('remainingUsage').get(function() {
  if (this.maximumUsageLimit === null) return Infinity;
  return Math.max(0, this.maximumUsageLimit - this.totalUsageCount);
});

// Pre-save middleware
CouponSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase().replace(/\s/g, '');
  }
  
  // Validate discount value based on type
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    this.discountValue = 100;
  }
  
  next();
});

// Static methods
CouponSchema.statics.findActiveCoupons = function(userId = null) {
  const query = {
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

CouponSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });
};

CouponSchema.statics.findExpiringSoon = function(days = 7, userId = null) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  const query = {
    isActive: true,
    validUntil: { 
      $gte: new Date(),
      $lte: cutoffDate 
    }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ validUntil: 1 });
};

// Instance methods
CouponSchema.methods.validateForOrder = function(orderData, userId) {
  const now = new Date();
  
  // Check if coupon is active and within valid dates
  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is not active' };
  }
  
  if (now < this.validFrom) {
    return { valid: false, reason: 'Coupon is not yet valid' };
  }
  
  if (now > this.validUntil) {
    return { valid: false, reason: 'Coupon has expired' };
  }
  
  // Check usage limits
  if (this.maximumUsageLimit !== null && this.totalUsageCount >= this.maximumUsageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  
  // Check per-customer usage limit
  if (userId && this.usagePerCustomerLimit) {
    const userUsageCount = this.usageHistory.filter(usage => usage.userId === userId).length;
    if (userUsageCount >= this.usagePerCustomerLimit) {
      return { valid: false, reason: 'You have reached the usage limit for this coupon' };
    }
  }
  
  // Check minimum order amount
  if (this.minimumOrderAmount && orderData.subtotal < this.minimumOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount of ৳${this.minimumOrderAmount} required` 
    };
  }
  
  // Check product restrictions
  if (this.applicableProducts && this.applicableProducts.length > 0) {
    const hasApplicableProduct = orderData.items.some(item => 
      this.applicableProducts.includes(item.productId)
    );
    if (!hasApplicableProduct) {
      return { valid: false, reason: 'Coupon not applicable to items in your cart' };
    }
  }
  
  // Check excluded products
  if (this.excludedProducts && this.excludedProducts.length > 0) {
    const hasExcludedProduct = orderData.items.some(item => 
      this.excludedProducts.includes(item.productId)
    );
    if (hasExcludedProduct) {
      return { valid: false, reason: 'Coupon cannot be applied to some items in your cart' };
    }
  }
  
  return { valid: true };
};

CouponSchema.methods.calculateDiscount = function(orderData) {
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (orderData.subtotal * this.discountValue) / 100;
    
    // Apply maximum discount cap if set
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed_amount') {
    discountAmount = Math.min(this.discountValue, orderData.subtotal);
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

CouponSchema.methods.recordUsage = function(orderId, userId, discountAmount, orderAmount) {
  this.usageHistory.push({
    orderId,
    userId,
    discountAmount,
    orderAmount,
    usedAt: new Date()
  });
  
  this.totalUsageCount += 1;
  this.totalDiscountGiven += discountAmount;
  
  return this.save();
};

CouponSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

export default Coupon;