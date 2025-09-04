import mongose from 'mongoose';

const UserSchema = new mongose.Schema({
    _id:{ type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl : { type: String, required: true},
    cartItems : { type: Object, default: {} },
}, {minimize: false});


const User = mongose.models.user || mongose.model('user', UserSchema);

export default User;