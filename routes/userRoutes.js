const express = require('express');
const router = express.Router();
const { loginUser, registerAdmin } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth'); // Your existing middleware

// Existing routes
router.post('/login', loginUser);
router.post('/register', registerAdmin);

// ✅ New route to validate token
router.get('/validate-token', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});

module.exports = router;
