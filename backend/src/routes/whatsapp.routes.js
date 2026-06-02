const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/status', whatsappController.getStatus);
router.get('/qr', whatsappController.getQR);
router.post('/restart', whatsappController.restart);
router.post('/pairing-code', whatsappController.requestPairingCode);
router.post('/logout', whatsappController.logout);
router.post('/send', whatsappController.sendMessage);

module.exports = router;
