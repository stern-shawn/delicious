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
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
});

// Define some indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

// Automatically generate a slug for this entry before saving to DB
storeSchema.pre('save', async function autoGenSlug(next) {
  // Only generate a new slug if the name has been changed
  if (!this.isModified('name')) {
    next(); // Skip
    return; // Stop the function from running
  }

  this.slug = slug(this.name);
  // Check for duplicate slugs. If we find any, generate a new slug of slug-1, slug-2, etc.
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  // this.constructor is how we reference Store while inside the schema
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (storesWithSlug) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();
});

// Instead of manually getting all stores and summing tag counts, let MongoDB do the aggregation
storeSchema.statics.getTagsList = function generateTagList() {
  return this.aggregate([
    // Turn tags into single entries instead of arrays
    { $unwind: '$tags' },
    // Group together all tags by name, sum them together, and store as 'count' field
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    // Sort in descending order
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model('Store', storeSchema);
