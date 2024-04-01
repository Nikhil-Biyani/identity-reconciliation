import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    email: {
        type: String,
    },

    phoneNumber: {
        type: String,
    },

    linkedId: {
        type: String,
    },

    linkPrecedence: {
        type: String,
        enum: ["primary", "secondary"],
    },
    // createdAt, updatedAt
}, {timestamps: true});

const Contact = mongoose.model("contact", contactSchema);

export default Contact;