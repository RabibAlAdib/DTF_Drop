
import Product from '@/models/Product'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db';

export async function GET(request) {
    try {

        await connectDB()

        const products = await Product.find({})
        return NextResponse.json({ success: true, products, count: products.length });
    }
    catch (error) {
        console.error("Error fetching seller products:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
