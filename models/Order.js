import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  
  // Customer information
  userId: { type: String, required: true, ref: 'User' },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  
  // Product items with multi-variant support
  items: [{
    productId: { type: String, required: true, ref: 'Product' },
    productName: { type: String, required: true },
    
    // Variant information
    color: { type: String, required: true },
    size: { type: String, required: true },
    
    // Pricing and quantity
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true }, // unitPrice * quantity
    
    // Product image for this variant
    productImage: { type: String, required: false },
    
    // Custom design information
    customization: {
      hasCustomDesign: { type: Boolean, default: false },
      customDesignUrl: { type: String, required: false }, // Cloudinary URL
      customText: { type: String, required: false },
      customNumber: { type: String, required: false },
      customSlogan: { type: String, required: false },
      specialInstructions: { type: String, required: false }
    }
  }],
  
  // Order totals
  pricing: {
    subtotal: { type: Number, required: true }, // Sum of all item totals
    deliveryCharge: { type: Number, required: true }, // 70 for Dhaka, 130 for outside
    discountAmount: { type: Number, default: 0 },
    promoCode: { type: String, required: false },
    totalAmount: { type: Number, required: true } // subtotal + deliveryCharge - discountAmount
  },
  
  // Delivery information
  delivery: {
    address: { type: String, required: true },
    isDhaka: { type: Boolean, required: true }, // true for Inside Dhaka, false for Outside
    deliveryCharge: { type: Number, required: true },
    estimatedDeliveryDate: { type: Date, required: false },
    deliveryNotes: { type: String, required: false },
    specialInstructions: { type: String, required: false },
    deliverySlot: { type: String, required: false } // morning, afternoon, evening
  },
  
  // Payment information
  payment: {
    method: { 
      type: String, 
      required: true, 
      enum: ['cash_on_delivery', 'bkash', 'nagad', 'bank_transfer', 'card'],
      default: 'cash_on_delivery'
    },
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: { type: String, required: false },
    paymentDate: { type: Date, required: false },
    paymentId: { type: String, required: false },
    
    // Refund information
    refundId: { type: String, required: false },
    refundDate: { type: Date, required: false },
    refundAmount: { type: Number, required: false },
    refundReason: { type: String, required: false },
    requiresManualProcessing: { type: Boolean, default: false }
  },
  
  // Order status tracking
  status: {
    type: String,
    required: true,
    enum: [
      'pending',           // Order placed, payment pending
      'confirmed',         // Payment confirmed, processing started
      'processing',        // Order being prepared/printed
      'ready_to_ship',    // Order ready for delivery
      'shipped',          // Order dispatched
      'out_for_delivery', // Out for delivery
      'delivered',        // Successfully delivered
      'cancelled',        // Order cancelled
      'returned'          // Order returned
    ],
    default: 'pending'
  },
  
  // Status history tracking
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, required: false }
  }],
  
  // Additional order information
  giftInfo: {
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String, required: false },
    recipientName: { type: String, required: false }
  },
  
  // Shipping and tracking information
  trackingNumber: { type: String, required: false },
  shippedAt: { type: Date, required: false },
  deliveredAt: { type: Date, required: false },
  returnRequestDate: { type: Date, required: false },
  returnReason: { type: String, required: false },
  
  // Admin notes and tracking
  adminNotes: { type: String, required: false },
  priorityLevel: { 
    type: String, 
    enum: ['normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance  
// Note: orderNumber already has unique index from schema definition
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ 'delivery.isDhaka': 1 });

// Virtual to calculate total items count
OrderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual to get order age in days
OrderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update timestamps
OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Add status to history if status changed
  if (this.isModified('status') && this.statusHistory.length > 0) {
    const lastStatus = this.statusHistory[this.statusHistory.length - 1];
    if (lastStatus.status !== this.status) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date()
      });
    }
  } else if (this.isNew) {
    // Add initial status for new orders
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  next();
});

// Static methods for common queries
OrderSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

OrderSchema.statics.findRecentOrders = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return this.find({ createdAt: { $gte: startDate } }).sort({ createdAt: -1 });
};

// Instance methods
OrderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note
  });
  return this.save();
};

OrderSchema.methods.addAdminNote = function(note) {
  this.adminNotes = this.adminNotes ? `${this.adminNotes}\n---\n${note}` : note;
  return this.save();
};

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;