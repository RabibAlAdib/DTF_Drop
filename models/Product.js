import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    userId: {type: String, required: true, ref: 'User'},
    name: {type: String, required: true},
    description: {type: String, required: true},
    category: {type: String, required: true},
    price: {type: Number, required: true},
    offerPrice: {type: Number, required: true},
    images: {type: Array, required: true},
    date: {type: Number, required: true},
    ratings: {type: Number, required: false, default: 0},
    numOfReviews: {type: Number, required: false, default: 0},
    reviews: {type: Array, required: false, default: []},
    numberofSales: {type: Number, required: false, default: 0}
},{ timestamps: true })

const Product = mongoose.models.product || mongoose.model('product', productSchema);

export default Product;