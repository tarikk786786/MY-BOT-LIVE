const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/status', whatsappController.getStatus);
router.post('/reconnect', whatsappController.reconnect);
router.post('/logout', whatsappController.logout);

module.exports = router;
