const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const ContactModel = require("../models/ContactUs");
const ContactSubmission = require("../models/ContactSubmission");
require("dotenv").config();

const router = express.Router();

const loadTemplate = (filename) =>
  fs.readFileSync(path.join(__dirname, "..", "templates", filename), "utf-8");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Validate form data
    const errors = ContactModel.validate(data);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { firstName, lastName, email, phone, company, comment, submissionDate } = data;

    const adminHtml = `
      <h3>New Contact Submission</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Company:</strong> ${company || "N/A"}</p>
      <p><strong>Message:</strong> ${comment}</p>
      <p><strong>Date:</strong> ${submissionDate}</p>
    `;

    const userHtml = `
      <h3>Hi ${firstName},</h3>
      <p>Thanks for contacting Aqara. We have received your message and will get back to you soon.</p>
    `;

    const adminMailOptions = {
      from: `"Aqara Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Inquiry from ${firstName} ${lastName}`,
      html: adminHtml,
    };

    const userMailOptions = {
      from: `"Aqara Support Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for contacting Aqara",
      html: userHtml,
    };

    // Send emails
    console.log("📨 Sending admin email...");
    const adminResponse = await transporter.sendMail(adminMailOptions);
    console.log("✅ Admin email sent:", adminResponse.response);

    console.log("📨 Sending user email...");
    const userResponse = await transporter.sendMail(userMailOptions);
    console.log("✅ User email sent:", userResponse.response);

    // Save submission to the database
    await ContactSubmission.create({
      firstName,
      lastName,
      email,
      phone,
      company,
      comment,
      submissionDate,
    });

    res.status(200).json({ message: "Emails sent and submission saved!" });
  } catch (err) {
    console.error("❌ Email or DB save failed:", err);
    res.status(500).json({ message: "Internal server error", error: err.toString() });
  }
});

router.get("/", async (req, res) => {
    try {
      const submissions = await ContactSubmission.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(submissions);
    } catch (err) {
      console.error("❌ Error fetching contact submissions:", err);
      res.status(500).json({ message: "Failed to fetch contact submissions" });
    }
  });

module.exports = router;
