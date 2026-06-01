const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);
router.put('/:key', settingsController.updateSetting);
router.post('/bulk', settingsController.updateMultipleSettings);

module.exports = router;
