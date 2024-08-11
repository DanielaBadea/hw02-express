const Contact = require("../../../validate/validateDB");

async function updateStatusContact (contactId, {favorite}) {
    try{
    const contact = await Contact.findById(contactId);
    if(!contact){
        throw new Error ('Contact not found')
    }
    // Proprietatea favorite a contactului este actualizata cu valoarea furnizata, de pe body
    contact.favorite = favorite;
    await contact.save();
    return contact;
    }catch (error){
        throw new Error(`Failed to update contact status: ${error.message}`);
    }
};

module.exports = {updateStatusContact};