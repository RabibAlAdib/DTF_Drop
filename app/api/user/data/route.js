import { getAuth } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import User from "@/models/User"
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // console.log("Fetching user data...")
        // console.log(request)
        const {userId } = getAuth(request)
        await connectDB()

        const user = await User.findById(userId)

        if (!user) {
            return NextResponse.json({success:false, message:"User not found"})
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('User data fetch error:', error);
        return NextResponse.json({success:false, message: "Unable to fetch user data"})
    }
}