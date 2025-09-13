import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    _id:{ type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl : { type: String, required: true},
    cartItems : { type: Object, default: {} },
    favorites: { type: [String], default: [] },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
    joinDate: { type: Number, required: true, default: Date.now() }  
}, {minimize: false});


const User = mongoose.models.user || mongoose.model('user', UserSchema);

export default User;