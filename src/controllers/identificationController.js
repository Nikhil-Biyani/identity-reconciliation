import Contact from "../models/contact.js";

export const identificationController = async (req, res) => {
    const {email, phoneNumber} = req.body;

    try {
        if(email && phoneNumber) {
            const contactsWithEmail = await Contact.find({ email });
            const contactsWithPhoneNumber = await Contact.find({ phoneNumber });
            const contactsWithEmailAndPhoneNumber = await Contact.find({$and: [{ email }, {phoneNumber}]});

            if (contactsWithEmail.length === 0 && contactsWithPhoneNumber.length === 0 && contactsWithEmailAndPhoneNumber.length === 0) {
                // Case: Neither email nor phoneNumber match, create new primary contact
                const newContact = await Contact.create({ email, phoneNumber });
                return res.json({
                    contact: {
                        primaryContactId: null,
                        emails: [newContact.email],
                        phoneNumbers: [newContact.phoneNumber],
                        secondaryContactIds: [],
                    },
                });

            } else if(contactsWithEmailAndPhoneNumber.length>0) {
                // Case: Email and phone number matches to the same contact
                const findPrimaryId = await contactsWithEmailAndPhoneNumber[0].linkPrecedence === "primary" ? contactsWithEmailAndPhoneNumber[0]._id : contactsWithEmailAndPhoneNumber[0].linkedId;
                const primaryContact = await Contact.find({_id: findPrimaryId});
                const allSecondaryContacts = await Contact.find({linkedId: findPrimaryId});
                return res.status(200).json({
                    contact: {
                        primaryContatctId: findPrimaryId,
                        emails: [primaryContact.email, allSecondaryContacts.email],
                        phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                        secondaryContactIds: [allSecondaryContacts._id],
                    }
                });

            } else if (contactsWithEmail.length>0 && contactsWithPhoneNumber.length === 0) {
                // Case: Email matches with a contact but phone number does not match with any contact in the table, create new secondary contact
                const findPrimaryId = await contactsWithEmail[0].linkPrecedence === "primary" ? contactsWithEmail[0]._id : contactsWithEmail[0].linkedId;
                const primaryContact = await Contact.find({ _id: findPrimaryId });
                const newContact = await Contact.create({ email, phoneNumber, linkedId: findPrimaryId, linkPrecedence: "secondary" });
                await newContact.save();
                const allSecondaryContacts = await Contact.find({linkedId: findPrimaryId});
                return res.json({
                    contact: {
                        primaryContatctId: findPrimaryId,
                        emails: [primaryContact.email, allSecondaryContacts.email],
                        phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                        secondaryContactIds: [allSecondaryContacts._id],
                    },
                });

            } else if (contactsWithEmail.length === 0 && contactsWithPhoneNumber.length>0) {
                // Case: Phone numnber matches with a contact but email does not match with any contact in the table, create new secondary contact
                const findPrimaryId = await contactsWithPhoneNumber[0].linkPrecedence === "primary" ? contactsWithPhoneNumber[0]._id : contactsWithPhoneNumber[0].linkedId;
                const primaryContact = await Contact.find({ _id: findPrimaryId });
                const newContact = await Contact.create({ email, phoneNumber, linkedId: findPrimaryId, linkPrecedence: "secondary" });
                await newContact.save();
                const allSecondaryContacts = await Contact.find({linkedId: findPrimaryId});
                return res.json({
                    contact: {
                        primaryContatctId: findPrimaryId,
                        emails: [primaryContact.email, allSecondaryContacts.email],
                        phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                        secondaryContactIds: [allSecondaryContacts._id],
                    },
                });

            } else if(contactsWithEmail.length>0 && contactsWithPhoneNumber>0 && contactsWithEmailAndPhoneNumber.length === 0) {
                // Case: Email and phone number both match to different contacts in the table, turn the newer contact into a secondary contact
                // const primaryContactFromEmailArray = contactsWithEmail.find((contact) => {contact.linkPrecedence === 'primary'});
                // const primaryContactFromPhoneNumberArray = contactsWithPhoneNumber.find((contact) => {contact.linkPrecedence === 'primary'});
                
                // // Assumption: Timestamps are not equal for any 2 contacts
                // if(primaryContactFromEmailArray._id < primaryContactFromPhoneNumberArray._id) {
                //     primaryContactFromPhoneNumberArray.linkPrecedence = "secondary";
                //     primaryContactFromPhoneNumberArray.linkedId = primaryContactFromEmailArray._id;

                //     // if the new secondary contact had secondary contacts previously when it was primary, 
                //     // we will have to change all their linkedIds to the primary one now.
                    

                //     return res.status(200).json({
                //         contact: {
                //             primaryContatctId: findPrimaryId,
                //             emails: [, allSecondaryContacts.email],
                //             phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                //             secondaryContactIds: [allSecondaryContacts._id],
                //         }
                //     });

                // } else {
                //     primaryContactFromEmailArray.linkPrecedence = "secondary";
                //     primaryContactFromEmailArray.linkedId = primaryContactFromPhoneNumberArray._id;
                    
                //     // if the new secondary contact had secondary contacts previously when it was primary, 
                //     // we will have to change all their linkedIds to the primary one now.

                //     return res.status(200).json({
                //         contact: {
                //             primaryContatctId: findPrimaryId,
                //             emails: [, allSecondaryContacts.email],
                //             phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                //             secondaryContactIds: [allSecondaryContacts._id],
                //         }
                //     });
                // }
            }

        } else if(email && !phoneNumber) {
            const contactsWithEmail = await Contact.find({ email });
            if(contactsWithEmail.length === 0) {
                res.status(400).json({error: "Email does not match any contact. Enter a phone number that is not null to create a new contact."});
            
            } else {
                const primaryContact = await contactsWithEmail.find((contact) => {contact.linkPrecedence === 'primary'});
                const primaryId = await primaryContact._id;
                const allSecondaryContacts = await Contact.find({linkedId: primaryId});

                return res.status(200).json({
                    contact: {
                        primaryContatctId: primaryId,
                        emails: [primaryContact.email, allSecondaryContacts.email],
                        phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                        secondaryContactIds: [allSecondaryContacts._id],
                    }
                });
            }

        } else if(!email && phoneNumber) {
            const contactsWithPhoneNumber = await Contact.find({ phoneNumber });
            if(contactsWithPhoneNumber.length === 0) {
                res.status(400).json({error: "Phone number does not match any contact. Enter an email that is not null to create a new contact."});
            
            } else {
                const primaryContact = await contactsWithPhoneNumber.find((contact) => {contact.linkPrecedence === 'primary'});
                const primaryId = await primaryContact._id;
                const allSecondaryContacts = await Contact.find({linkedId: primaryId});

                return res.status(200).json({
                    contact: {
                        primaryContatctId: primaryId,
                        emails: [primaryContact.email, allSecondaryContacts.email],
                        phoneNumbers: [primaryContact.phoneNumber, allSecondaryContacts.phoneNumber],
                        secondaryContactIds: [allSecondaryContacts._id],
                    }
                });
            }

        } else {
            res.status(400).json({ error: "Either Email or Phone Number should be provided." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal Server Error"});
    }
}