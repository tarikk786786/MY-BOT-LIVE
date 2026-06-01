const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memory.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', memoryController.getAllMemories);
router.get('/:contactId', memoryController.getMemory);
router.put('/:contactId', memoryController.updateMemory);
router.delete('/:contactId', memoryController.deleteMemory);
router.post('/:contactId/facts', memoryController.addFact);
router.delete('/:contactId/facts/:factIndex', memoryController.removeFact);

module.exports = router;
