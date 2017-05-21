const mongoose = require('mongoose');

const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  // Add the author and store data to the form body before submitting to DB
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  const newReview = new Review(req.body);
  await newReview.save();

  req.flash('success', 'Review Saved!');
  res.redirect('back');
};
