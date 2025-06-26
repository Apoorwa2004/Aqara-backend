const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const PartnerForm = require("../models/PartnerForm");
const db = require("../config/db");
const { DataTypes } = require("sequelize");
const Partner = require('../models/Partner');
const logoUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv-ep6BmN3eB5BTXgxFHKRE5xTeQRsfYWO8Q&s';

// Define dynamic model here to store full form data
const PartnerSubmission = db.define("PartnerSubmission", {
  firstName: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  address: DataTypes.TEXT,
  designation: DataTypes.STRING,
  reffered: DataTypes.STRING,
  companyName: DataTypes.STRING,
  companyAddress: DataTypes.STRING,
  companyWebsite: DataTypes.STRING,
  city: DataTypes.STRING,
  companyemail: DataTypes.STRING,
  companyphone: DataTypes.STRING,
  country: DataTypes.STRING,
  businessphone: DataTypes.STRING,
  expertise: DataTypes.TEXT,
  industries: DataTypes.TEXT,
  directorName: DataTypes.STRING,
  directorEmail: DataTypes.STRING,
  directorPhone: DataTypes.STRING,
  directorWPhone: DataTypes.STRING,
  type: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
    validate: {
      isIn: [['normal', 'special']]
    }
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

PartnerSubmission.sync({ alter: true });

router.post("/submit", async (req, res) => {
  try {
    const formData = new PartnerForm(req.body);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Aqara App <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL,
      subject: "New Partner Application Submitted",
      html: formData.formatEmail(),
    };

    await transporter.sendMail(mailOptions);

    // Save full details to database
    await PartnerSubmission.create({
      ...req.body,
      expertise: (formData.expertise || []).join(","),
      industries: (formData.industries || []).join(","),
      type: 'normal', // Default to normal
      verified: false
    });

    res.status(200).json({ message: "Email sent and partner data saved." });
  } catch (err) {
    console.error("❌ EMAIL or DB ERROR:", err);
    res.status(500).json({ error: "Failed to process submission", details: err.message });
  }
});

router.get('/submissions', async (req, res) => {
  try {
    const submissions = await PartnerSubmission.findAll({
      attributes: ['id', 'firstName', 'email', 'phone', 'companyName', 'companyAddress', 'type', 'verified']
    });
    res.json(submissions);
  } catch (error) {
    console.error('❌ Failed to fetch submissions list:', error);
    res.status(500).json({ error: 'Failed to fetch submissions list' });
  }
});

router.get('/submissions/:id', async (req, res) => {
  try {
    // Log the request for debugging
    console.log(`Fetching partner with ID: ${req.params.id}`);
    
    const submission = await PartnerSubmission.findByPk(req.params.id);
    if (!submission) {
      console.log(`No partner found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Partner submission not found' });
    }
    
    console.log(`Partner found: ${submission.firstName}`);
    
    // Parse CSV-style fields back to arrays
    const data = submission.toJSON();
    if (data.expertise) data.expertise = data.expertise.split(',');
    if (data.industries) data.industries = data.industries.split(',');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Failed to fetch partner details:', error);
    res.status(500).json({ error: 'Failed to fetch partner details' });
  }
});

router.delete('/submissions/:id', async (req, res) => {
  try {
    const count = await PartnerSubmission.destroy({
      where: { id: req.params.id }
    });
    
    if (count === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete partner:', error);
    res.status(500).json({ error: 'Failed to delete partner' });
  }
});

router.post("/admin-submit", async (req, res) => {
  try {
    const data = req.body;
    await PartnerSubmission.create(data);
    res.status(201).json({ message: "Partner added by admin." });
  } catch (error) {
    console.error("❌ Admin submission failed:", error);
    res.status(500).json({ error: "Failed to add partner" });
  }
});

router.patch('/submissions/:id/type', async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['normal', 'special'].includes(type)) {
      return res.status(400).json({ error: 'Invalid partner type. Must be "normal" or "special"' });
    }

    const submission = await PartnerSubmission.findByPk(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Partner submission not found' });
    }

    // 1. Update PartnerSubmission
    submission.type = type;
    await submission.save();

    // 2. Also update Partner table if already verified
    if (submission.verified) {
      const existingPartner = await Partner.findOne({ where: { email: submission.email } });
      if (existingPartner) {
        existingPartner.type = type;
        await existingPartner.save();
      }
    }

    res.json({ message: 'Partner type updated successfully', type });
  } catch (error) {
    console.error('❌ Failed to update partner type:', error);
    res.status(500).json({ error: 'Failed to update partner type' });
  }
});

router.put('/submissions/:id', async (req, res) => {
  try {
    const submission = await PartnerSubmission.findByPk(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // ✅ Allowlist of fields
    const allowedFields = [
      'firstName', 'email', 'phone', 'address', 'designation', 'reffered',
      'companyName', 'companyAddress', 'companyWebsite', 'city', 'companyemail',
      'companyphone', 'country', 'businessphone', 'expertise', 'industries',
      'directorName', 'directorEmail', 'directorPhone', 'directorWPhone', 'type'
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Convert arrays to CSV strings if needed
        if (['expertise', 'industries'].includes(field) && Array.isArray(req.body[field])) {
          updateData[field] = req.body[field].join(',');
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    await submission.update(updateData);

    // ✅ Update main Partner record too (if verified)
    if (submission.verified) {
      const partner = await Partner.findOne({ where: { email: submission.email } });
      if (partner) {
        await partner.update({
          name: updateData.firstName || partner.name,
          email: updateData.email || partner.email,
          phone: updateData.phone || partner.phone,
          address: updateData.companyAddress || updateData.address || partner.address,
          type: updateData.type || partner.type,
        });
      }
    }

    res.json({ message: 'Partner updated successfully.' });
  } catch (err) {
    console.error('❌ Update failed:', err);
    res.status(500).json({ error: 'Failed to update partner.' });
  }
});


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
      type: submission.type,
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
  subject: '🎉 You are now an Aqara Partner!',
  html: `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9; padding: 30px; color: #333;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
        <div style="background-color: #00bcd4; padding: 20px; text-align: center;">
          <img src="${logoUrl}" alt="Aqara Logo" style="height: 60px; margin-bottom: 10px;" />
          <h2 style="color: white; margin: 0;">Welcome to Aqara!</h2>
        </div>
        <div style="padding: 30px;">
          <p>Hi <strong>${submission.firstName}</strong>,</p>
          <p>We’re excited to welcome you as a verified Aqara Partner. You now have access to exclusive partner tools and pricing.</p>

          <div style="background-color: #f1f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 0;"><strong>Login Link:</strong> <a href="http://localhost:5173/sign-in" style="color: #00bcd4;">Click here to login</a></p>
          </div>

          <p>If you have any questions or need assistance, feel free to reach out to us.</p>
          <p>Thank you,<br /><strong>Aqara Team</strong></p>
        </div>
        <div style="background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Aqara. All rights reserved.
        </div>
      </div>
    </div>
  `
});

    return res.status(200).json({ message: 'Partner verified and added to system.' });
  } catch (err) {
    console.error('❌ Verification failed:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});
module.exports = router;