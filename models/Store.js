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
}, {
  // By default, virtual fields like reviews are attached but not visible for dumps,
  // but passing these arguments will tell MongoDB to attach them as normal fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define some indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

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

// Generate a list of the top 10 Stores based on average review (if more than 1 review)
storeSchema.statics.getTopStores = function generateTopStores() {
  return this.aggregate([
    // Get our stores, populate their reviews. (Mongo takes the model name Review and converts to
    // 'reviews' when you do lookup, be careful about this). We don't actually have access to the
    // virtual field 'reviews' at this level...
    // 'as' is the name given to the result
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
    // Filter for stores with 2+ reviews (in MongoDB world, get reviews with index 1)
    { $match: { 'reviews.1': { $exists: true } } },
    // Add an average reviews field by taking the $avg of each aggregate's .rating items
    // In MongoDB 3.4+ we can use $addField instead of $project to keep our other fields...
    // Since we're in 3.2, we'll need to add back our fields using $$ROOT's properties
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      slug: '$$ROOT.slug',
      reviews: '$$ROOT.reviews',
      averageRating: { $avg: '$reviews.rating' },
    } },
    // Sort by average review field w/ highest rating first
    { $sort: { averageRating: -1 } },
    // Limit to first/top 10 at most
    { $limit: 10 },
  ]);
};

// Find reviews where the store _id matches the store property in a review object
storeSchema.virtual('reviews', {
  ref: 'Review', // What model are we linking
  // The fields below should match
  localField: '_id', // The field we're matching with from Store (this)
  foreignField: 'store', // The field we're matching with from Review
});

function autoPopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
