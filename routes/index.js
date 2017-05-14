const express = require('express');
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/add', storeController.addStore);

// Add upload and resize middlewares so that photos can be uploaded to stores
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore) // eslint-disable-line comma-dangle
);

router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore) // eslint-disable-line comma-dangle
);

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

// 1 - Validate registration data
// 2 - Register User
// 3 - Log them in
router.post('/register',
  userController.validateRegister,
  userController.register
);

module.exports = router;
