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

exports.getStores = async (req, res) => {
  // Get our stores from the database first
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // 1. Get the store by id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm user has permissions to edit the store
  // TODO, no auth yet... :(
  // 3. Render the edit form to the user
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // Ensure that location data has type of point
  req.body.location.type = 'Point';
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // Return the new store instead of the old record (default gives us the old one)
    runValidators: true,
  }).exec();
  // 2. Redirect them to the edited store's page and notify of success
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store ➡</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};
