const express = require('express');
const router = express.Router();
// const { createGroup, getGroups } = require('../controllers/groupController');
const { createGroup, getGroups, getGroupSettlement } = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware'); // Don't forget your auth middleware!

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/:id/settle', protect, getGroupSettlement);

module.exports = router;