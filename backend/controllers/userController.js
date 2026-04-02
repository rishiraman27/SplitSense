const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if all fields are filled
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Send back the new user data + token
    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user (Login)
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ email });

    // 2. Check if user exists AND passwords match
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get all users (for the dropdown)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    // Find all users EXCEPT the currently logged-in user
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Add a friend by email
// @route   POST /api/users/add-friend
// @access  Private
const addFriend = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find the user you want to add
    const friendToAdd = await User.findOne({ email });

    if (!friendToAdd) {
      return res.status(404).json({ message: 'User with that email not found' });
    }

    // 2. Prevent adding yourself
    if (friendToAdd._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    // 3. Find yourself in the database
    const currentUser = await User.findById(req.user.id);

    // 4. Check if you are already friends
    if (currentUser.friends.includes(friendToAdd._id)) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    // 5. Mutual Add! Add them to your list, and add you to their list
    currentUser.friends.push(friendToAdd._id);
    friendToAdd.friends.push(currentUser._id);

    await currentUser.save();
    await friendToAdd.save();

    res.status(200).json({ message: 'Friend added successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's friends
// @route   GET /api/users/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    // Find the user and "populate" the friends array with their actual names and emails
    const user = await User.findById(req.user.id).populate('friends', 'name email');
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
const updateUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { currentPassword, newPassword } = req.body;

    // 1. Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Verify the current password matches what is in the database
    // (If your User model has a matchPassword method, you can use that instead)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // 3. If it matches, update to the new password
    // Note: Your Mongoose User model should automatically hash this new password 
    // before saving it, thanks to the pre('save') hook we set up during authentication!
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  getUsers,
  
  addFriend,
  getFriends,
  updateUserProfile,
  updateUserPassword,
};
