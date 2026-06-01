const express = require('express');
const router = express.Router();
const brainController = require('../controllers/brain.controller');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes (only admins can manage API keys)
router.use(auth);

router.get('/keys', brainController.getKeys);
router.post('/keys', brainController.addKey);
router.delete('/keys/:id', brainController.deleteKey);
router.get('/analytics', brainController.getAnalytics);

module.exports = router;
