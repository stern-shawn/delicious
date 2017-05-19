const express = require('express');
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/add',
  authController.isLoggedIn,
  storeController.addStore // eslint-disable-line comma-dangle
);

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
router.post('/login',
  authController.sanitizeLogin,
  authController.login // eslint-disable-line comma-dangle
);

router.get('/register', userController.registerForm);

// 1 - Validate registration data
// 2 - Register User
// 3 - Log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login // eslint-disable-line comma-dangle
);

router.get('/logout', authController.logout);

router.get('/account',
  authController.isLoggedIn,
  userController.account // eslint-disable-line comma-dangle
);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));

router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update) // eslint-disable-line comma-dangle
);

// API Endpoints

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

module.exports = router;
