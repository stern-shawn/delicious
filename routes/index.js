const express = require('express');
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
// Since createStore is async-await, wrap it in a helper try/catch function
router.post('/add', catchErrors(storeController.createStore));

module.exports = router;
