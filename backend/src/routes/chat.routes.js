const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/:contactId', chatController.getChatHistory);
router.post('/:contactId/send', chatController.sendMessage);
router.delete('/:contactId', chatController.deleteChatHistory);

module.exports = router;
