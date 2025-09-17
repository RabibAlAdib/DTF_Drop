import { getAuth } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import Address from "@/models/Address"
import { NextResponse } from 'next/server';

// GET - Fetch user addresses
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }

        await connectDB()

        const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            addresses
        });

    } catch (error) {
        console.error('Fetch addresses error:', error);
        return NextResponse.json({
            success: false, 
            message: "Unable to fetch addresses"
        }, { status: 500 });
    }
}

// POST - Add new address
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        const addressData = await request.json();
        
        if (!addressData.fullName || !addressData.phoneNumber || !addressData.area || !addressData.city || !addressData.state) {
            return NextResponse.json({
                success: false, 
                message: "All required fields must be provided"
            }, { status: 400 });
        }

        await connectDB()

        // If this is set as default, remove default from other addresses
        if (addressData.isDefault) {
            await Address.updateMany(
                { userId },
                { isDefault: false }
            );
        }

        // Create new address
        const newAddress = new Address({
            userId,
            ...addressData,
            updatedAt: new Date()
        });

        await newAddress.save();

        return NextResponse.json({
            success: true,
            message: "Address added successfully",
            address: newAddress
        });

    } catch (error) {
        console.error('Add address error:', error);
        return NextResponse.json({
            success: false, 
            message: "Unable to add address"
        }, { status: 500 });
    }
}

// PUT - Update address
export async function PUT(request) {
    try {
        const { userId } = getAuth(request)
        
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        const { addressId, ...updateData } = await request.json();
        
        if (!addressId) {
            return NextResponse.json({
                success: false, 
                message: "Address ID is required"
            }, { status: 400 });
        }

        await connectDB()

        // If this is set as default, remove default from other addresses
        if (updateData.isDefault) {
            await Address.updateMany(
                { userId, _id: { $ne: addressId } },
                { isDefault: false }
            );
        }

        // Update address
        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedAddress) {
            return NextResponse.json({
                success: false, 
                message: "Address not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress
        });

    } catch (error) {
        console.error('Update address error:', error);
        return NextResponse.json({
            success: false, 
            message: "Unable to update address"
        }, { status: 500 });
    }
}

// DELETE - Delete address
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const addressId = searchParams.get('addressId');
        
        if (!addressId) {
            return NextResponse.json({
                success: false, 
                message: "Address ID is required"
            }, { status: 400 });
        }

        await connectDB()

        const deletedAddress = await Address.findOneAndDelete({ _id: addressId, userId });

        if (!deletedAddress) {
            return NextResponse.json({
                success: false, 
                message: "Address not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error('Delete address error:', error);
        return NextResponse.json({
            success: false, 
            message: "Unable to delete address"
        }, { status: 500 });
    }
}