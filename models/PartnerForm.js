class PartnerForm {
  constructor(data) {
    this.firstName = data.firstName || "";
    this.email = data.email || "";
    this.phone = data.phone || "";
    this.address = data.address || "";
    this.designation = data.designation || "";
    this.reffered = data.reffered || "";

    this.companyName = data.companyName || "";
    this.companyAddress = data.companyAddress || "";
    this.companyWebsite = data.companyWebsite || "";
    this.city = data.city || "";
    this.companyemail = data.companyemail || "";
    this.companyphone = data.companyphone || "";
    this.country = data.country || "";
    this.businessphone = data.businessphone || "";

    this.expertise = Array.isArray(data.expertise) ? data.expertise : [];
    this.industries = Array.isArray(data.industries) ? data.industries : [];

    this.directorName = data.directorName || "";
    this.directorEmail = data.directorEmail || "";
    this.directorPhone = data.directorPhone || "";
    this.directorWPhone = data.directorWPhone || "";
  }

  formatEmail() {
    try {
      return `
        <h2>New Partner Application Received</h2>
        <p><strong>Name:</strong> ${this.firstName}</p>
        <p><strong>Email:</strong> ${this.email}</p>
        <p><strong>Phone:</strong> ${this.phone}</p>
        <p><strong>Address:</strong> ${this.address}</p>
        <p><strong>Designation:</strong> ${this.designation}</p>
        <p><strong>Referred By:</strong> ${this.reffered}</p>
        <hr />
        <p><strong>Company Name:</strong> ${this.companyName}</p>
        <p><strong>Company Address:</strong> ${this.companyAddress}</p>
        <p><strong>Website:</strong> ${this.companyWebsite}</p>
        <p><strong>City:</strong> ${this.city}</p>
        <p><strong>Company Email:</strong> ${this.companyemail}</p>
        <p><strong>Company Phone:</strong> ${this.companyphone}</p>
        <p><strong>Country:</strong> ${this.country}</p>
        <p><strong>Business WhatsApp:</strong> ${this.businessphone}</p>
        <hr />
        <p><strong>Expertise:</strong> ${(this.expertise || []).join(", ")}</p>
        <p><strong>Industries:</strong> ${(this.industries|| []).join(", ")}</p>
        <hr />
        <p><strong>Director Name:</strong> ${this.directorName}</p>
        <p><strong>Director Email:</strong> ${this.directorEmail}</p>
        <p><strong>Director Phone:</strong> ${this.directorPhone}</p>
        <p><strong>Director WhatsApp:</strong> ${this.directorWPhone}</p>
      `;
    } catch (err) {
      console.error("❌ Error formatting email:", err);
      return "<p>Error formatting email content.</p>";
    }
  }
}

module.exports = PartnerForm;
