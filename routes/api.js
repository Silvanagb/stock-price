const express = require('express');
const router = express.Router();
const stockHandler = require('../controllers/stockHandler');

router.get('/stock-prices', stockHandler.handleStock);

module.exports = router;
