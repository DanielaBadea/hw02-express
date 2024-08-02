const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Set name for contact'],
    },
    email: {
        type: String,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    },
    favorite: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
    }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema, 'contacts');
module.exports = Contact;
