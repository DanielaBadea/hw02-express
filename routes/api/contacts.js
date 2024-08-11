const express = require('express')

const router = express.Router();
const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact
} = require('../../models/contacts')

const {validateContact, validateContactUpdate} = require('../../validate/validateJoi');
const Contact = require('../../validate/validateDB');
const { updateStatusContact } = require('./services/contactService');

router.get('/', async (req, res, next) => {
  try{
    // const contacts = await listContacts();
    const contacts = await Contact.find();
    console.log('Contacts fetched:', contacts);
    res.status(200).json(contacts);

  }catch(err){
    next(err);
  }
});

router.get('/:contactId', async (req, res, next) => {
  try{
    // const contact = await getContactById(req.params.contactId);
    const contact = await Contact.findById(req.params.contactId)
    if(contact){
      res.status(200).json(contact);
    }else{
      res.status(404).json({message: 'Not found'})
    }
  }catch(err){
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  console.log('POST /api/contacts route hit');
  try{
    const {error} = validateContact(req.body)
    if(error){
      return res.status(400).json({ message: error.details[0].message });
    }
    // newContact = await addContact(req.body);
    const newContact = new Contact(req.body);
    newContact.save();
    if(newContact){
      res.status(201).json({ message: 'Contact created!', newContact });
    }
  }catch(err){
   next(err); 
  }
});

router.delete('/:contactId', async (req, res, next) => {
  const {contactId}= req.params;
  try{
    // const removedContact = await removeContact(contactId);
    const removeContact = await Contact.findByIdAndDelete(contactId);
    if(removeContact){
      res.status(200).json({message: "contact deleted", removeContact})
    }else{
      res.status(404).json({message: "Not found"})
    }
  }catch{
    res.status(500).json({err: "Internal Server Error"})
    next(err);
  }
  
});

router.put('/:contactId', async (req, res, next) => {
  const{contactId} = req.params;
  try{
    const {error} = validateContactUpdate(req.body);
    if(error){
      return res.status(404).json({message: error.details[0].message});
    }
    // const contact = await updateContact(contactId, req.body);
    const updateContact = await Contact.findByIdAndUpdate(contactId, req.body, {new:true})
    if(updateContact){
      res.status(200).json(updateContact);

    }
  }catch(err){
    next(err)
  }
});

router.patch('/:contactId/favorite', async(req, res, next) => {
  const {contactId} = req.params;
  const {favorite} = req.body;
  if(favorite === undefined){
    return res.status(400).json({message: 'missing field favorite'});
  }
try{
  const favoriteContact =  await updateStatusContact(contactId, {favorite});
  res.status(200).send(favoriteContact);
  }catch(err){
    if(err.message = 'Contact not found'){
      return res.status(404).json({message: 'Not found'});
    }else{
      next(err);
    }
}
});
module.exports = router;
