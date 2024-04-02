import Contact from "../models/contact.js";

export const identificationController = async (req, res) => {
    const {email, phoneNumber} = req.body;

    try {
        if(email && phoneNumber) {
            const contactsWithEmail = await Contact.find({ email: email });
            const contactsWithPhoneNumber = await Contact.find({ phoneNumber: phoneNumber });
            const contactsWithEmailAndPhoneNumber = await Contact.find({$and: [{ email: email }, {phoneNumber: phoneNumber}]});

            if (contactsWithEmail.length === 0 && contactsWithPhoneNumber.length === 0 && contactsWithEmailAndPhoneNumber.length === 0) {
                // Case: Neither email nor phoneNumber match, create new primary contact
                const newContact = await Contact.create({ email, phoneNumber, linkedId: null, linkPrecedence: "primary" });
                return res.status(200).json({
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
                const primaryContact = await Contact.findOne({_id: findPrimaryId});

                let secondaryContactIds = await returnSecondaryIds(findPrimaryId);
                let emails = await returnSecondaryEmails(findPrimaryId);
                let phoneNumbers = await returnSecondaryPhoneNumbers(findPrimaryId);

                return res.status(200).json({
                    contact: {
                        primaryContactId: findPrimaryId,
                        emails: [primaryContact.email, emails],
                        phoneNumbers: [primaryContact.phoneNumber, phoneNumbers],
                        secondaryContactIds,
                    }
                });

            } else if (contactsWithEmail.length>0 && contactsWithPhoneNumber.length === 0) {
                // Case: Email matches with a contact but phone number does not match with any contact in the table, create new secondary contact
                const findPrimaryId = await contactsWithEmail[0].linkPrecedence === "primary" ? contactsWithEmail[0]._id : contactsWithEmail[0].linkedId;
                const primaryContact = await Contact.findOne({ _id: findPrimaryId });
                const newContact = await Contact.create({ email, phoneNumber, linkedId: findPrimaryId, linkPrecedence: "secondary" });
                await newContact.save();

                let secondaryContactIds = await returnSecondaryIds(findPrimaryId);
                let emails = await returnSecondaryEmails(findPrimaryId);
                let phoneNumbers = await returnSecondaryPhoneNumbers(findPrimaryId);

                return res.status(200).json({
                    contact: {
                        primaryContactId: findPrimaryId,
                        emails: [primaryContact.email, emails],
                        phoneNumbers: [primaryContact.phoneNumber, phoneNumbers],
                        secondaryContactIds,
                    },
                });

            } else if (contactsWithEmail.length === 0 && contactsWithPhoneNumber.length>0) {
                // Case: Phone numnber matches with a contact but email does not match with any contact in the table, create new secondary contact
                const findPrimaryId = await contactsWithPhoneNumber[0].linkPrecedence === "primary" ? contactsWithPhoneNumber[0]._id : contactsWithPhoneNumber[0].linkedId;
                const primaryContact = await Contact.findOne({ _id: findPrimaryId });
                const newContact = await Contact.create({ email, phoneNumber, linkedId: findPrimaryId, linkPrecedence: "secondary" });
                await newContact.save();

                let secondaryContactIds = await returnSecondaryIds(findPrimaryId);
                let emails = await returnSecondaryEmails(findPrimaryId);
                let phoneNumbers = await returnSecondaryPhoneNumbers(findPrimaryId);

                return res.status(200).json({
                    contact: {
                        primaryContactId: findPrimaryId,
                        emails: [primaryContact.email, emails],
                        phoneNumbers: [primaryContact.phoneNumber, phoneNumbers],
                        secondaryContactIds,
                    },
                });

            } else if(contactsWithEmail.length>0 && contactsWithPhoneNumber.length>0) {
                // Case: Email and phone number both match to different contacts in the table, turn the newer contact into a secondary contact
                const primaryContactFromEmail= contactsWithEmail.find(contact => contact.linkPrecedence === 'primary');
                const primaryContactFromPhoneNumber = contactsWithPhoneNumber.find(contact => contact.linkPrecedence === 'primary');
                
                if(primaryContactFromEmail._id < primaryContactFromPhoneNumber._id) {

                    const filter = {_id: primaryContactFromPhoneNumber._id};
                    const updateDoc = {
                        $set: {
                            linkedId: primaryContactFromEmail._id, linkPrecedence: 'secondary'
                        }
                    }
                    await Contact.updateOne(filter, updateDoc);

                    // if the new secondary contact had secondary contacts previously when it was primary, 
                    // we will have to change all their linkedIds to the primary one now.
                    
                    const allSecondaryContactsToBeChangedIds = await returnSecondaryIds(primaryContactFromPhoneNumber._id);
                    await updateDatabaseForSecondaryContacts(allSecondaryContactsToBeChangedIds, primaryContactFromEmail);
                    
                    let secondaryContactIds = await returnSecondaryIds(primaryContactFromEmail._id);
                    let emails = await returnSecondaryEmails(primaryContactFromEmail._id);
                    let phoneNumbers = await returnSecondaryPhoneNumbers(primaryContactFromEmail._id);


                    return res.status(200).json({
                        contact: {
                            primaryContactId: primaryContactFromEmail._id,
                            emails: [primaryContactFromEmail.email, emails],
                            phoneNumbers: [primaryContactFromEmail.phoneNumber, phoneNumbers],
                            secondaryContactIds,
                        }
                    });

                } else {
                    const filter = {_id: primaryContactFromEmail._id};
                    const updateDoc = {
                        $set: {
                            linkedId: primaryContactFromPhoneNumber._id, linkPrecedence: 'secondary'
                        }
                    }
                    await Contact.updateOne(filter, updateDoc);

                    // if the new secondary contact had secondary contacts previously when it was primary, 
                    // we will have to change all their linkedIds to the primary one now.
                    
                    const allSecondaryContactsToBeChangedIds = await returnSecondaryIds(primaryContactFromEmail._id);
                    await updateDatabaseForSecondaryContacts(allSecondaryContactsToBeChangedIds, primaryContactFromPhoneNumber);
                    
                    let secondaryContactIds = await returnSecondaryIds(primaryContactFromPhoneNumber._id);
                    let emails = await returnSecondaryEmails(primaryContactFromPhoneNumber._id);
                    let phoneNumbers = await returnSecondaryPhoneNumbers(primaryContactFromPhoneNumber._id);


                    return res.status(200).json({
                        contact: {
                            primaryContactId: primaryContactFromPhoneNumber._id,
                            emails: [primaryContactFromPhoneNumber.email, emails],
                            phoneNumbers: [primaryContactFromPhoneNumber.phoneNumber, phoneNumbers],
                            secondaryContactIds,
                        }
                    });

                }
            }

        } else if(email && !phoneNumber) {
            const contactsWithEmail = await Contact.find({ email });
            if(contactsWithEmail.length === 0) {
                res.status(400).json({error: "Email does not match any contact. Enter a phone number that is not null to create a new contact."});
            
            } else {
                let primaryContact = await contactsWithEmail.find(contact => contact.linkPrecedence === 'primary');
                let primaryContactId;
                
                if(primaryContact === undefined) {
                    primaryContactId = await contactsWithEmail[0].linkedId;
                    primaryContact = await Contact.findOne({_id: primaryContactId});
                } else {
                    primaryContactId = await primaryContact._id;
                }

                let secondaryContactIds = await returnSecondaryIds(primaryContactId);
                let emails = await returnSecondaryEmails(primaryContactId);
                let phoneNumbers = await returnSecondaryPhoneNumbers(primaryContactId);

                return res.status(200).json({
                    contact: {
                        primaryContactId,
                        emails: [primaryContact.email, emails],
                        phoneNumbers: [primaryContact.phoneNumber, phoneNumbers],
                        secondaryContactIds,
                    }
                });
            }

        } else if(!email && phoneNumber) {
            const contactsWithPhoneNumber = await Contact.find({ phoneNumber });
            if(contactsWithPhoneNumber.length === 0) {
                res.status(400).json({error: "Phone number does not match any contact. Enter an email that is not null to create a new contact."});
            
            } else {
                const primaryContact = await contactsWithPhoneNumber.find(contact => contact.linkPrecedence === 'primary');
                let primaryContactId;
                
                if(primaryContact === undefined) {
                    primaryContactId = await contactsWithEmail[0].linkedId;
                    primaryContact = await Contact.findOne({_id: primaryContactId});
                } else {
                    primaryContactId = await primaryContact._id;
                }

                let secondaryContactIds = await returnSecondaryIds(primaryContactId);
                let emails = await returnSecondaryEmails(primaryContactId);
                let phoneNumbers = await returnSecondaryPhoneNumbers(primaryContactId);

                return res.status(200).json({
                    contact: {
                        primaryContactId,
                        emails: [primaryContact.email, emails],
                        phoneNumbers: [primaryContact.phoneNumber, phoneNumbers],
                        secondaryContactIds,
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

async function returnSecondaryIds(primaryId) {
    const allSecondaryContacts = await Contact.find({linkedId: primaryId});
    let secondaryContactIds = await allSecondaryContacts.map(contact => contact._id);

    return secondaryContactIds;
}

async function returnSecondaryEmails(primaryId) {
    const allSecondaryContacts = await Contact.find({linkedId: primaryId});
    let secondaryContactEmails = await allSecondaryContacts.map(contact => contact.email);

    return secondaryContactEmails;
}

async function returnSecondaryPhoneNumbers(primaryId) {
    const allSecondaryContacts = await Contact.find({linkedId: primaryId});
    let secondaryContactPhoneNumbers = await allSecondaryContacts.map(contact => contact.phoneNumber);

    return secondaryContactPhoneNumbers;
}

async function updateDatabaseForSecondaryContacts(allSecondaryContactsToBeChangedIds, primaryContactFromEmail) {
    for(const i=0; i<allSecondaryContactsToBeChangedIds.length; i++) {
        Contact.updateOne({_id: allSecondaryContactsToBeChangedIds[i]}, {$set: {linkedId: primaryContactFromEmail._id}});
    }
}