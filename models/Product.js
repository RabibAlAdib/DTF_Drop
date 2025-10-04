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
  
  // UPDATED: Category options (relaxed for backward compatibility)
  category: { 
    type: String, 
    required: true,
    // Note: enum restrictions removed temporarily for backward compatibility
  },
  
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: false },
  images: { type: Array, required: true }, // Legacy field for backward compatibility
  
  // NEW: Color-aware images for dynamic color switching
  colorImages: [{
    color: { 
      type: String, 
      required: true,
      enum: ['Black', 'White', 'Lite Radish', 'Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue']
    },
    url: { type: String, required: true }
  }],
  
  date: { type: Number, required: true, default: Date.now() },
  
  // Standardized rating system
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },
  reviewCount: { 
    type: Number, 
    default: 0 
  },
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
    enum: [
      // Canonical values (current)
      'Anime', 'Typography', 'Game', 'WWE', 'Solid', 'Sports', 'Motivational', 'Jokes', 'Islamic', 'Customized', 'Cartoon', 'Movie/TV', 'Music/Band', 'Minimalist', 'Abstract', 'Nature', 'Festival/Seasonal', 'Couple/Friendship', 'Quotes', 'Retro/Vintage', 'Geek/Tech', 'Streetwear', 'Hip-Hop/Rap', 'Graffiti/Urban', 'Fantasy/Mythology', 'Sci-Fi', 'Superheroes/Comics', 'Animals/Pets', 'Cars/Bikes', 'Food/Drinks', 'Travel/Adventure', 'National/Patriotic', 'Memes', 'Spiritual/Inspirational', 'Kids/Family', 'Occupations (Doctor, Engineer, etc.)', 'College/University Life', 'Fitness/Gym', 'Luxury/High Fashion', 'Gaming Esports Teams',
      // Legacy values for backward compatibility
      'anime', 'typography', 'game', 'wwe', 'solid','sports', 'motivational', 'jokes', 'islamic', 'customized', 'cartoon', 'movie/tv', 'music/band', 'minimalist', 'abstract', 'nature', 'festival/seasonal', 'couple/friendship', 'quotes', 'retro/vintage', 'geek/tech', 'streetwear', 'hip-hop/rap', 'graffiti/urban', 'fantasy/mythology', 'sci-fi', 'superheroes/comics', 'animals/pets', 'cars/bikes', 'food/drinks', 'travel/adventure', 'national/patriotic', 'memes', 'spiritual/inspirational', 'kids/family', 'occupations', 'college/university', 'fitness/gym', 'luxury/fashion', 'gaming', 'esports'
    ],
    default: 'Customized'
  },
  
  // Color and size variants (existing)
  colors: { 
    type: [String], 
    required: true,
    enum: ['Black', 'White', 'Lite Radish','Lite Pink', 'Coffee', 'Offwhite', 'NevyBlue'],
    default: ['Black']
  },
  sizes: { 
    type: [String], 
    required: true,
    default: ['M']
    // Note: enum restriction removed to allow custom sizes from seller dashboard
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