import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    _id:{ type: String, required: true },
    clerkId: { type: String, unique: true, sparse: true }, // Clerk user ID for lookup
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl : { type: String, required: true},
    cartItems : { type: mongoose.Schema.Types.Mixed, default: {} },
    favorites: { type: [String], default: [] }, // Array of product IDs
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
    joinDate: { type: Number, required: true, default: Date.now() }  
}, {minimize: false});


const User = mongoose.models.user || mongoose.model('user', UserSchema);

export default User;