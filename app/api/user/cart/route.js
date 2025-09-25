import { getAuth } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import User from "@/models/User"
import { NextResponse } from 'next/server';
import { updateUserByClerkId } from "@/lib/userLookup";

export async function PUT(request) {
    try {
        const { userId } = getAuth(request)
        
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        const { cartItems } = await request.json();
        
        if (!cartItems || typeof cartItems !== 'object') {
            return NextResponse.json({
                success: false, 
                message: "Invalid cart data"
            }, { status: 400 });
        }

        await connectDB()

        // Update user's cart items using the helper
        const user = await updateUserByClerkId(userId, { cartItems: cartItems });

        if (!user) {
            return NextResponse.json({
                success: false, 
                message: "User not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Cart updated successfully",
            cartItems: user.cartItems
        });

    } catch (error) {
        console.error('Cart update error:', error);
        return NextResponse.json({
            success: false, 
            message: "Unable to update cart"
        }, { status: 500 });
    }
}