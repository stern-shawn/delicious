const mongoose = require('mongoose');

mongoose.Promise = global.Promise;  // Use the global (ES6 Node) Promise that's built in!
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true, // Automatically trim whitespace
    required: 'Please enter a store name!', // Same as using true, but a message
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String], // Format for 'this is an array of strings'
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: { // Special format for declaring geolocation type
      type: String,
      default: 'Point',
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!',
    }],
    address: {
      type: String,
      required: 'You must supply an address!',
    },
  },
});

// Automatically generate a slug for this entry before saving to DB
storeSchema.pre('save', function autoGenSlug(next) {
  // Only generate a new slug if the name has been changed
  if (!this.isModified('name')) {
    next(); // Skip
    return; // Stop the function from running
  }
  this.slug = slug(this.name);
  next();
  // TODO make more robust by having unique slugs for same-named stores
});

module.exports = mongoose.model('Store', storeSchema);
