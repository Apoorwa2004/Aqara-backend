const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2h' }
    );

    // ✅ Set as cookie (IMPORTANT: must use cookie-parser middleware in server.js)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production (HTTPS)
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash: hash,
      role: 'admin',
    });

    return res.json({ message: 'Admin registered successfully', user });
  } catch (err) {
    console.error('❌ Registration error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};