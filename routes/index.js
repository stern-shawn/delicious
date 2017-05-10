const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', storeController.homePage);
router.get('/add', storeController.addStore);
// Since createStore is async-await, wrap it in a helper try/catch function
router.post('/add', catchErrors(storeController.createStore));

module.exports = router;
