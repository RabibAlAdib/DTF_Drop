import mongoose from 'mongoose';

const headerSliderSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' }, // Seller who created this slide
  title: { type: String, required: true },
  shortText: { type: String, required: true }, // Offer or promotional text
  productImage: { type: String, required: true }, // Cloudinary URL for transparent product image
  
  // Button configurations
  buyButtonText: { type: String, default: 'Buy Now' },
  buyButtonAction: { 
    type: String, 
    enum: ['addToCart', 'redirect'], 
    default: 'addToCart' 
  },
  buyButtonLink: { type: String }, // Product ID for addToCart or external URL for redirect
  
  learnMoreButtonText: { type: String, default: 'Learn More' },
  learnMoreLink: { type: String, required: true }, // Custom URL provided by user
  
  // Visibility and order controls
  isVisible: { type: Boolean, default: true }, // Checkbox to show/hide in slider
  order: { type: Number, default: 0 }, // For ordering slides (newest first)
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// Ensure newest items appear first
headerSliderSchema.index({ order: -1, createdAt: -1 });

const HeaderSlider = mongoose.models.HeaderSlider || mongoose.model('HeaderSlider', headerSliderSchema);

export default HeaderSlider;