import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const requestedLimit = parseInt(searchParams.get('limit')) || 10;
    const limit = Math.min(requestedLimit, 20); // Max 20 results for performance
    
    if (!query || query.trim().length < 2) {
      return Response.json({ products: [] });
    }
    
    // Prevent overly long queries that could cause performance issues
    if (query.trim().length > 50) {
      return Response.json({ products: [] });
    }
    
    // Escape special regex characters to prevent regex injection
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');
    
    // Search across multiple fields with priority scoring
    const products = await Product.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { designType: { $regex: searchRegex } }
      ]
    })
    .select('_id name description category price offerPrice images colorImages designType gender')
    .limit(limit)
    .lean() // Use lean() for faster queries
    .maxTimeMS(5000); // 5 second timeout
    
    // Transform products for frontend
    const transformedProducts = products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      offerPrice: product.offerPrice,
      designType: product.designType,
      gender: product.gender,
      image: product.colorImages?.[0]?.url || product.images?.[0] || '/placeholder-image.jpg'
    }));
    
    return Response.json({ products: transformedProducts });
    
  } catch (error) {
    console.error('Search API Error:', error);
    return Response.json({ error: 'Search failed', products: [] }, { status: 500 });
  }
}