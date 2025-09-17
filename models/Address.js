import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

const Address = mongoose.models.Address || mongoose.model('Address', AddressSchema);

export default Address;