import mongoose from 'mongoose';

const customizationTemplateSchema = new mongoose.Schema({
  // Category information
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Drop Shoulder', 'T-shirt', 'Polo T-shirt', 'Hoodie', 'Tank Top']
  },
  description: { 
    type: String, 
    required: true 
  },
  
  // Available colors for this template
  availableColors: [{
    name: { 
      type: String, 
      required: true,
      enum: ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue', 'Red', 'Green', 'Yellow', 'Purple']
    },
    hexCode: { 
      type: String, 
      required: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    mockupImages: {
      front: { type: String, required: true },
      back: { type: String, required: true },
      sleeve: { type: String },
      pocket: { type: String }
    }
  }],
  
  // Available sizes
  availableSizes: [{
    size: { 
      type: String, 
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    },
    price: { 
      type: Number, 
      required: true,
      min: 0
    }
  }],
  
  // Base pricing
  basePrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  extraImagePrice: { 
    type: Number, 
    required: true,
    default: 30 // BDT 30 for each additional image
  },
  
  // Design positioning guidelines
  designAreas: {
    front: {
      x: { type: Number, default: 50 }, // percentage from left
      y: { type: Number, default: 40 }, // percentage from top
      maxWidth: { type: Number, default: 30 }, // percentage of mockup width
      maxHeight: { type: Number, default: 40 } // percentage of mockup height
    },
    back: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 40 },
      maxWidth: { type: Number, default: 30 },
      maxHeight: { type: Number, default: 40 }
    },
    sleeve: {
      x: { type: Number, default: 80 },
      y: { type: Number, default: 30 },
      maxWidth: { type: Number, default: 15 },
      maxHeight: { type: Number, default: 20 }
    },
    pocket: {
      x: { type: Number, default: 25 },
      y: { type: Number, default: 35 },
      maxWidth: { type: Number, default: 10 },
      maxHeight: { type: Number, default: 15 }
    }
  },
  
  // Status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Admin info
  createdBy: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
customizationTemplateSchema.index({ category: 1, isActive: 1 });
customizationTemplateSchema.index({ createdBy: 1 });

export default mongoose.models.CustomizationTemplate || mongoose.model('CustomizationTemplate', customizationTemplateSchema);