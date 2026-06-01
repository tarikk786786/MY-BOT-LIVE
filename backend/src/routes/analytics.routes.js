const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/chart', analyticsController.getChartData);

module.exports = router;
