import authSeller from '@/lib/authSeller'
import Product from '@/models/Product'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/config/db';

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isSeller = authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Unauthorized Access. Only sellers can view their products.' });
        }

        await connectDB()

        const products = await Product.find({})
        return NextResponse.json({ success: true, products, count: products.length });
    }
    catch (error) {
        console.error("Error fetching seller products:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
