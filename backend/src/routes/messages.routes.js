const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/recent', chatController.getRecentChats);
router.get('/search', chatController.searchMessages);

module.exports = router;
