import mongoose from 'mongoose';

const customOrderSchema = new mongoose.Schema({
  // User information
  userId: { 
    type: String, 
    required: true, 
    ref: 'User' 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  
  // Order identification
  orderId: { 
    type: String, 
    required: true,
    unique: true
  },
  
  // Template reference
  templateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CustomizationTemplate',
    required: true 
  },
  
  // Product selection
  category: { 
    type: String, 
    required: true 
  },
  selectedColor: { 
    type: String, 
    required: true 
  },
  selectedSize: { 
    type: String, 
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  },
  
  // User design data
  userDesigns: {
    front: {
      imageUrl: { type: String },
      position: {
        x: { type: Number, default: 50 },
        y: { type: Number, default: 40 }
      },
      size: {
        width: { type: Number, default: 25 },
        height: { type: Number, default: 30 }
      },
      rotation: { type: Number, default: 0 }
    },
    back: {
      imageUrl: { type: String },
      position: {
        x: { type: Number, default: 50 },
        y: { type: Number, default: 40 }
      },
      size: {
        width: { type: Number, default: 25 },
        height: { type: Number, default: 30 }
      },
      rotation: { type: Number, default: 0 }
    },
    sleeve: {
      imageUrl: { type: String },
      position: {
        x: { type: Number, default: 80 },
        y: { type: Number, default: 30 }
      },
      size: {
        width: { type: Number, default: 12 },
        height: { type: Number, default: 15 }
      },
      rotation: { type: Number, default: 0 }
    },
    pocket: {
      imageUrl: { type: String },
      position: {
        x: { type: Number, default: 25 },
        y: { type: Number, default: 35 }
      },
      size: {
        width: { type: Number, default: 8 },
        height: { type: Number, default: 12 }
      },
      rotation: { type: Number, default: 0 }
    }
  },
  
  // Pricing calculation
  basePrice: { 
    type: Number, 
    required: true 
  },
  extraImagesCount: { 
    type: Number, 
    default: 0,
    max: 2 // Only sleeve and pocket are extra (front and back included)
  },
  extraImagePrice: { 
    type: Number, 
    default: 30 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  
  // Order status
  status: { 
    type: String, 
    enum: ['pending', 'design_review', 'approved', 'in_production', 'completed', 'cancelled'],
    default: 'pending' 
  },
  
  // Design files
  highResFilesReceived: { 
    type: Boolean, 
    default: false 
  },
  whatsappInstructions: { 
    type: String,
    default: 'Please send your design files via WhatsApp for better quality printing. Our number: +8801344823831'
  },
  
  // Special instructions
  customerNotes: { 
    type: String,
    maxLength: 500
  },
  adminNotes: { 
    type: String,
    maxLength: 1000
  },
  
  // Generated preview
  finalPreviewUrl: { 
    type: String // URL to the generated preview image
  },
  
  // Timeline
  orderDate: { 
    type: Date, 
    default: Date.now 
  },
  estimatedDelivery: { 
    type: Date 
  },
  completedDate: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Generate unique order ID
customOrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'CUSTOM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Calculate total price
customOrderSchema.pre('save', function(next) {
  this.totalPrice = this.basePrice + (this.extraImagesCount * this.extraImagePrice);
  next();
});

// Indexes for efficient queries
customOrderSchema.index({ userId: 1 });
customOrderSchema.index({ orderId: 1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ orderDate: -1 });

export default mongoose.models.CustomOrder || mongoose.model('CustomOrder', customOrderSchema);