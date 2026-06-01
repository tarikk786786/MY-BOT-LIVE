const express = require('express');
const router = express.Router();
const personalityController = require('../controllers/personality.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', personalityController.getAllPersonalities);
router.get('/default', personalityController.getDefaultPersonality);
router.post('/', personalityController.createPersonality);
router.put('/:id', personalityController.updatePersonality);
router.delete('/:id', personalityController.deletePersonality);
router.post('/:id/set-default', personalityController.setDefaultPersonality);

module.exports = router;
