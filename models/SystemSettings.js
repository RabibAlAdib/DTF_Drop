import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'DTF Drop',
    required: true
  },
  currency: {
    type: String,
    default: 'BDT',
    required: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  newUserRegistration: {
    type: Boolean,
    default: true
  },
  allowGuestCheckout: {
    type: Boolean,
    default: true
  },
  enableReviews: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
SystemSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);

export default SystemSettings;