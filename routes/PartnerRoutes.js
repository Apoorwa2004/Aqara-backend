const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const nodemailer = require('nodemailer');
require("dotenv").config();


router.post('/verify-submission/:id', async (req, res) => {
  try {
    const submission = await PartnerSubmission.findByPk(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.verified) {
      return res.status(400).json({ error: 'Already verified' });
    }

    const username = submission.email;
    const password = Math.random().toString(36).slice(-8);

    // ✅ Save to Partner table
    const newPartner = await Partner.create({
      name: submission.firstName,
      email: submission.email,
      phone: submission.phone,
      address: submission.companyAddress,
      company: submission.companyName,
      type: 'normal',
      verified: true,
      username,
      password
    });

    // ✅ Update submission as verified (optional)
    submission.verified = true;
    await submission.save();

    // ✅ Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `Aqara App <${process.env.EMAIL_USER}>`,
      to: submission.email,
      subject: 'You are now an Aqara Partner!',
      html: `
        <h2>Welcome to Aqara, ${submission.firstName}</h2>
        <p>We’re excited to have you as a verified partner.</p>
        <p><strong>Login URL:</strong> <a href="http://localhost:5173/sign-in">Click here</a></p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>You can now log in to the partner portal.</p>
      `
    });

    return res.status(200).json({ message: 'Partner verified and added to system.' });
  } catch (err) {
    console.error('❌ Verification failed:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});


module.exports = router;
