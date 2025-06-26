const ContactModel = {
    validate(data) {
      const errors = {};
      if (!data.firstName) errors.firstName = "Required";
      if (!data.lastName) errors.lastName = "Required";
      if (!data.email) errors.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = "Invalid email";
      if (data.phone && !/^\+?\d{7,}$/.test(data.phone)) errors.phone = "Invalid phone number";
      if (data.comment && data.comment.length > 1000) errors.comment = "Too long";
      return errors;
    },
  };
  
  module.exports = ContactModel;
  