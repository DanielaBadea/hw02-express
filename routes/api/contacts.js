const express = require('express')

const router = express.Router();
const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact
} = require('../../models/contacts')

const {validateContact, validateContactUpdate} = require('../../validate/contactJoi');
const Contact = require('../../validate/contactShema');
const { updateStatusContact } = require('./services/contactService');
const authMiddleware =  require('../../middlewares/authMiddleware');
const validateObjectId = require('../../middlewares/validateObjectId');

router.get('/', authMiddleware, async (req, res, next) => {
  const { _id: owner } = req.user;
  console.log('Fetching contacts for owner:', owner);
  try {
    const contacts = await Contact.find({owner});
    console.log('Contacts fetched:', contacts);
    res.status(200).json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    next(err);
  }
});

router.get('/:contactId', authMiddleware,validateObjectId,  async (req, res, next) => {
  const { _id: owner } = req.user;
  try{
    // const contact = await getContactById(req.params.contactId);
    const contact = await Contact.findOne({_id: req.params.contactId, owner})
    if(contact){
      res.status(200).json(contact);
    }else{
      res.status(404).json({message: 'Not found'})
    }
  }catch(err){
    next(err);
  }
});

router.post('/',authMiddleware,  async (req, res, next) => {
  const { _id: owner } = req.user;
  try{
    const {error} = validateContact(req.body)
    if(error){
      return res.status(400).json({ message: error.details[0].message });
    }
    // newContact = await addContact(req.body);
    // const newContact = new Contact(req.body);
    const newContact = new Contact({...req.body, owner});
    await newContact.save();
    if(newContact){
      res.status(201).json({ message: 'Contact created!', newContact });
    }
  }catch(err){
   next(err); 
  }
});

router.delete('/:contactId',authMiddleware, validateObjectId, async (req, res, next) => {
  const { _id: owner } = req.user;
  try{
    // const removedContact = await removeContact(contactId);
    const removeContact = await Contact.findOneAndDelete({ _id: req.params.contactId, owner });
    if(removeContact){
      res.status(200).json({message: "contact deleted", removeContact})
    }else{
      if (err.message === 'Contact not found') {
        return res.status(404).json({ message: 'Contact not found' });
      }
    }
  }catch{
    res.status(500).json({err: "Internal Server Error"})
    next(err);
  }
  
});

router.put('/:contactId',authMiddleware, validateObjectId, async (req, res, next) => {
  const { _id: owner } = req.user;
  try{
    const {error} = validateContactUpdate(req.body);
    if(error){
      return res.status(404).json({message: error.details[0].message});
    }
    // const contact = await updateContact(contactId, req.body);
    const updateContact = await Contact.findOneAndUpdate({ _id: req.params.contactId, owner }, req.body, {new:true})
    if(updateContact){
      res.status(200).json(updateContact);

    }
  }catch(err){
    next(err)
  }
});

router.patch('/:contactId/favorite',authMiddleware, validateObjectId,  async(req, res, next) => {
  const {contactId} = req.params;
  const {favorite} = req.body;
  const { _id: owner } = req.user;
  if(favorite === undefined){
    return res.status(400).json({message: 'missing field favorite'});
  }
try{
  const favoriteContact =  await updateStatusContact(contactId, {favorite, owner});
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
