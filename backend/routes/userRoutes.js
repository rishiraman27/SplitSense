const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, addFriend, getFriends, updateUserProfile, updateUserPassword } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Map the routes to the controller functions
router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/', protect, getUsers);
router.post('/add-friend', protect, addFriend);
router.get('/friends', protect, getFriends);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);

module.exports = router;