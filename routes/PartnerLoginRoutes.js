// /routes/partnerLogin.js (or in PartnerRoutes.js)
const express = require("express");
const jwt = require("jsonwebtoken"); // Make sure to install: npm install jsonwebtoken
const router = express.Router();
const Partner = require("../models/Partner");

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await Partner.findOne({ where: { email } });

    if (!partner || partner.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!partner.verified) {
      return res.status(403).json({ error: 'Partner not verified' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: partner.id, 
        email: partner.email, 
        type: partner.type 
      },
      process.env.JWT_SECRET || 'your-secret-key', // Use environment variable in production
      { expiresIn: '24h' }
    );

    return res.json({
      partner: {
        id: partner.id,
        email: partner.email,
        name: partner.name,
        type: partner.type,           // 'normal' or 'special'
        verified: partner.verified,
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/partners/change-password
router.patch('/change-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const partner = await Partner.findOne({ where: { email } });

    if (!partner) return res.status(404).json({ error: "User not found" });

    partner.password = newPassword; // Consider hashing the password in production
    await partner.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await Partner.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




module.exports = router;