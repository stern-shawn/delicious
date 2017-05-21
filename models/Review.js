const mongoose = require('mongoose');

mongoose.Promise = global.Promise;  // Use the global (ES6 Node) Promise that's built in!

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author!',
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply a store',
  },
  text: {
    type: String,
    required: 'Your review must have text!',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

function autoPopulate(next) {
  this.populate('author');
  next();
}

// Hook so that if the review is queried, populate the author field for the query-er
reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Review', reviewSchema);
