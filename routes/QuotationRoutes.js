const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Quotation  = require('../models/Quotations');
const Partner = require('../models/Partner');
const Customer = require('../models/Customer');
const Product = require('../models/Product'); // ✅ Added missing import
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ✅ Configure transporter (embedded)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, userType, company, items, address } = req.body;

  try {
    let partnerId = null;
    let resolvedCompany = null;
    let resolvedAddress = null;
    let resolvedPhone = null;
    let resolvedName = name;

    // 🔁 If it's a partner, fetch partner info
    if (userType === 'normal' || userType === 'special') {
      const partner = await Partner.findOne({ where: { email } });

      if (partner) {
        partnerId = partner.id;
        resolvedCompany = partner.company || 'N/A';
        resolvedAddress = partner.address|| 'N/A';
        resolvedPhone = partner.phone|| phone || 'N/A';
        resolvedName = partner.company || name; 
      }
    }else if (userType === 'customer') {
      const customer = await Customer.findOne({ where: { email } });

      if (customer) {
        resolvedAddress = customer.address|| address || 'N/A';
        resolvedPhone = customer.phone|| phone || 'N/A';
        resolvedName = name;
      }
    }

    resolvedCompany = resolvedCompany || 'N/A';
    resolvedAddress = resolvedAddress || address || 'N/A';
    resolvedPhone = resolvedPhone || phone || 'N/A';

    // ✅ Create quotation entry
    const saved = await Quotation.create({
      name: resolvedName,
      email,
      phone: resolvedPhone,
      userType,
      company: resolvedCompany,
      address: resolvedAddress,
      partnerId,
      items
    });

    console.log('✅ Quotation created with ID:', saved.id);

    // ✅ Email notification logic stays the same
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🧾 New Quotation Request from ${name}`,
      html: `
        <h3>Quotation Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Type:</strong> ${userType}</p>
        <p><strong>Company:</strong> ${resolvedCompany || '-'}</p>
        <h4>Items:</h4>
        <ul>
          ${items.map(item => `<li>${item.title} - ${item.quantity} x ${item.price}</li>`).join('')}
        </ul>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email sending failed:', emailError);
    }

    res.status(201).json({
      success: true,
      quotation: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        userType: saved.userType,
        company: saved.company,
        items: saved.items,
        partnerId: saved.partnerId,
        address: saved.address
      }
    });

  } catch (err) {
    console.error('❌ Error submitting quotation:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// ✅ UPDATED: Include quotationPdfPath in response
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [
        {
          model: Partner,
          as: 'partner',
          attributes: ['company', 'address', 'name', 'phone'],
          
        }
      ],
      order: [['id', 'DESC']] // ✅ Show newest first
    });

    const formatted = quotations.map(q => ({
      id: q.id,
      name: q.partner?.name || q.name,
      phone: q.partner?.phone || q.phone,
      company: q.partner?.company || q.company || '-',
      userType: q.userType,
      items: q.items,
      partner: q.partner || null,
      quotationPdfPath: q.quotationPdfPath || null,
      createdAt: q.createdAt
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('❌ Failed to fetch quotations:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Fixed: Get single product (this was missing Product import)
router.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('❌ Fetch product failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id, {
      include: [
        {
          model: Partner,
          as: 'partner',
          attributes: ['company', 'address', 'name', 'phone'],
          required: false
        }
      ]
    });
    
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    res.json(quotation);
  } catch (err) {
    console.error('❌ Fetch quotation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Route to serve PDF files
router.get('/pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'quotations', filename);
    
    console.log('📄 Attempting to serve PDF from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ PDF file not found:', filePath);
      return res.status(404).json({ message: 'PDF file not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('❌ Error serving PDF:', err);
    res.status(500).json({ message: 'Error serving PDF file' });
  }
});

// ✅ FIXED: Save PDF with better error handling and timing
router.post('/save-pdf', async (req, res) => {
  const { quotationId, pdfBase64, filename } = req.body;

  try {
    console.log("📥 Received save-pdf request for quotationId:", quotationId, "Type:", typeof quotationId);

    // ✅ First, verify the quotation exists
    const quotation = await Quotation.findByPk(Number(quotationId));
    
    if (!quotation) {
      console.error(`❌ Quotation with ID ${quotationId} not found in database`);
      return res.status(404).json({ 
        success: false, 
        message: `Quotation with ID ${quotationId} not found` 
      });
    }

    console.log('✅ Quotation found:', quotation.id);

    // ✅ Create directory and save PDF file
    const buffer = Buffer.from(pdfBase64, 'base64');
    const savePath = `uploads/quotations/${filename}`;
    const absolutePath = path.join(__dirname, '../uploads/quotations', filename);



    // Ensure directory exists
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, buffer);

    console.log(`✅ PDF file saved to: ${absolutePath}`);

    // ✅ Update quotation with PDF path
    const [updatedRows] = await Quotation.update(
      { quotationPdfPath: savePath }, // ✅ Remove leading slash
      { where: { id: Number(quotationId) } }
    );

    if (updatedRows === 0) {
      console.warn(`⚠️ Failed to update quotation ${quotationId} with PDF path`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update quotation with PDF path' 
      });
    }

    console.log(`✅ Quotation ${quotationId} updated with PDF path: ${savePath}`);
    
    res.status(200).json({ 
      success: true, 
      path: savePath,
      message: 'PDF saved successfully'
    });

  } catch (err) {
    console.error('❌ Failed to save PDF:', err);
    res.status(500).json({ 
      success: false, 
      message: 'PDF save failed', 
      error: err.message 
    });
  }
});

module.exports = router;