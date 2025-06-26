const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // update path if needed

const ContactSubmission = sequelize.define("ContactSubmission", {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  comment: { type: DataTypes.TEXT },
  submissionDate: { type: DataTypes.DATEONLY },
}, {
  tableName: "contact_submissions", // optional: table name in DB
  timestamps: true, // adds createdAt and updatedAt
});

module.exports = ContactSubmission;
