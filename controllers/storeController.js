const mongoose = require('mongoose');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const Store = mongoose.model('Store');
const User = mongoose.model('User');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      // Node convention for 'everything is great, pass along second value to next middleware
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  },
};

exports.homePage = (req, res) => {
  // Render the index.pug template, and pass a title of 'Index'
  res.render('index', { title: 'Index' });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

// Time to try async-await!
exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // eslint-disable-line no-underscore-dangle
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

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // If MongoDB returns null for our query, let middleware handle the 404
  if (!store) return next();
  // Otherwise, render our store template with the returned store json
  res.render('store', { title: store.name, store });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) { // eslint-disable-line no-underscore-dangle
    throw Error('You must own this store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  // 1. Get the store by id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm user has permissions to edit the store
  confirmOwner(store, req.user);
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
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store ➡</a>`);
  res.redirect(`/stores/${store._id}/edit`); // eslint-disable-line no-underscore-dangle
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // If there is no file to resize, skip this process entirely
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  // Get the file extension
  const ext = req.file.mimetype.split('/')[1]; // ex. split 'image/jpeg' and take 'jpeg'
  // Generate a unique name for the photo and add it to request body since we save using req.body
  req.body.photo = `${uuid.v4()}.${ext}`;
  // Now, read the file
  const photo = await jimp.read(req.file.buffer);
  // Resize it
  await photo.resize(800, jimp.AUTO);
  // Write to filesystem
  await photo.write(`./public/uploads/${req.body.photo}`);
  // Go on to createStore() now that req.body has a reference to the photo
  next();
};

exports.getStoresByTag = async (req, res) => {
  const activeTag = req.params.tag;
  // Add tagQuery so that if no active tag is defined, grab all stores (each one has a tags array)
  const tagQuery = activeTag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // Use Promise.all to wait for both promises to resolve, then destructure the result!
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { title: 'tags', tags, activeTag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
  // Find stores by the given search query
  .find({
    // Since we have both name and description indexed as text, we can do this...
    $text: {
      // Search for text fields (both name/description since they're compound) including our query
      $search: req.query.q,
    },
  }, {
    // Project a 'score' onto each result, so we can sort by results which have heavier weight
    // ie. If I search for coffee, give me results with more refs to coffee first
    score: { $meta: 'textScore' },
  })
  // Sort the results with highest textScore first (descending, default is ascending apparently)
  .sort({
    score: { $meta: 'textScore' },
  })
  // Limit our results to the top 5
  .limit(5);

  res.json(stores);
};

// API for grabbing stores within 10km of the given coordinates
// Syntax: /api/stores/near?lat=x&lng=x
exports.mapStores = async (req, res) => {
  // Grab coordinates and convert from strings to floats
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 10000, // 10km radius
      },
    },
  };

  // Use .select to only return the fields we want, reducing the size of each AJAX call for speed
  const stores = await Store
    .find(q)
    .select('slug name description location photo')
    .limit(10);

  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

// Toggle heart status for given store
exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  // If the id is already in the array, assign operator to remove, otherwise add it
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id, // eslint-disable-line no-underscore-dangle
    { [operator]: { hearts: req.params.id } }, // Use ES6 computed property instead of explicitly
    { new: true } // eslint-disable-line comma-dangle
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  // The current user contains a list of hearted store ids, search all stores, and return only those
  // that are in ($in) that array
  const stores = await Store.find({ _id: { $in: req.user.hearts } });
  // Reuse the stores template, except now we're just passing in a subset of stores
  res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { title: 'Top Stores', stores });
};
