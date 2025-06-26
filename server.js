require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const sequelize = require('./config/db'); 
const productRoutes = require('./routes/ProductRoutes');
const categoryRoutes = require('./routes/CategoryRoutes');
const contactRoutes = require("./routes/ContactUsRoutes");
const ContactSubmission = require("./models/ContactSubmission");
const Product = require('./models/Product');
const Category = require('./models/Category');
const partnerRoutes = require('./routes/PartnerRoutes');
const Partner = require('./models/Partner');
const Quotation = require('./models/Quotations');
const PartnerFormRoutes = require("./routes/PartnerFormRoutes");
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });
const CustomerAuthRoutes = require('./routes/CustomerAuthRoutes');
const QuotationRoutes =  require('./routes/QuotationRoutes');
const userRoutes = require('./routes/userRoutes')
const app = express();
const morgan = require('morgan')
const cookieParser = require('cookie-parser');
Partner.hasMany(Quotation, { foreignKey: 'partnerId', as: 'quotations' });
Quotation.belongsTo(Partner, { foreignKey: 'partnerId', as: 'partner' });

app.use(morgan('tiny'))
app.use(express.json());
app.use(cors({origin:['https://awurudu.connexit.biz','https://vms.connexit.biz'],credentials:true}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'uploads/videos')));

// Routes
app.use(cookieParser());
app.use('/api/admin', userRoutes)
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/partners', partnerRoutes);
app.use("/api/partner-form", PartnerFormRoutes);
app.use("/api/partners", require("./routes/PartnerLoginRoutes"));
app.use('/uploads', express.static('uploads'));
app.use('/api/customers', CustomerAuthRoutes);
app.use('/api/quotations', QuotationRoutes);


// Start server
sequelize.sync().then(() => {
  console.log('✅ DB Connected');
  app.listen(5000, () => console.log('🚀 Server running on port 5000'));
}).catch(err => {
  console.error('❌ Error connecting to the database:', err);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});