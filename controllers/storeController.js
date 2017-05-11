const mongoose = require('mongoose');

const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  // Render the index.pug template, and pass a title of 'Index'
  res.render('index', { title: 'Index' });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// Time to try async-await!
exports.createStore = async (req, res) => {
  // req.body already defines the same keys as the schema, we can pass directly
  // If we inline await/save, store will have access to the generated .slug value
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  // Redirect on completion, await makes this line not execute until store.save() is finished
  res.redirect(`/store/${store.slug}`);
};
