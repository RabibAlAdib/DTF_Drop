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

// Updated schema with color and size variants
const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: false }, // Made optional
  images: { type: Array, required: true },
  date: { type: Number, required: true, default: Date.now() },
  ratings: { type: Number, required: false, default: 0 },
  numOfReviews: { type: Number, required: false, default: 0 },
  reviews: { type: Array, required: false, default: [] },
  numberofSales: { type: Number, required: false, default: 0 },
  
  // NEW: Color and size variants
  colors: { 
    type: [String], 
    required: true,
    enum: ['Black', 'White', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'],
    default: ['Black']
  },
  sizes: { 
    type: [String], 
    required: true,
    enum: ['M', 'L', 'XL'],
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