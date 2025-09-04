import mongoose from 'mongoose';

// Previous schema (commented for reference)
/*
const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  images: { type: Array, required: true },
  date: { type: Number, required: true },
  ratings: { type: Number, required: false, default: 0 },
  numOfReviews: { type: Number, required: false, default: 0 },
  reviews: { type: Array, required: false, default: [] },
  numberofSales: { type: Number, required: false, default: 0 }
}, { timestamps: true });
*/

// Updated schema with all new fields
const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  
  // UPDATED: Category options
  category: { 
    type: String, 
    required: true,
    enum: ['Drop Shoulder', 'T-Shirt']
  },
  
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: false },
  images: { type: Array, required: true },
  date: { type: Number, required: true, default: Date.now() },
  
  // UPDATED: Rating system with default values
  ratings: { type: Number, required: false, default: 4.3 },
  numOfReviews: { type: Number, required: false, default: 2 },
  reviews: { type: Array, required: false, default: [] },
  numberofSales: { type: Number, required: false, default: 0 },
  
  // NEW: Gender field
  gender: { 
    type: String, 
    required: true,
    enum: ['male', 'female', 'both'],
    default: 'both'
  },
  
  // NEW: Design Type field
  designType: { 
    type: String, 
    required: true,
    enum: ['Anima', 'Typography', 'game', 'wwe', 'sports', 'motivational', 'jokes', 'Islamic', 'customized'],
    default: 'customized'
  },
  
  // Color and size variants (existing)
  colors: { 
    type: [String], 
    required: true,
    enum: ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'],
    default: ['Black']
  },
  sizes: { 
    type: [String], 
    required: true,
    enum: ['M', 'L', 'XL',],
    default: ['M']
  },
  
  // Inventory tracking for each variant
  variants: [{
    color: { type: String, required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true, unique: true }
  }]
}, { timestamps: true });

const Product = mongoose.models.product || mongoose.model('product', productSchema);
export default Product;