const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  // This creates a secure token containing the user's ID
  // It signs it with your secret key and expires in 30 days
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;