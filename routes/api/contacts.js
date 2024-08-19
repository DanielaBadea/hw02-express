const express = require('express')
const router = express.Router();
// const mongoose = require('mongoose');

const {validateContact, validateContactUpdate} = require('../../validate/contactJoi');
const { updateStatusContact } = require('./services/contactService');
const Contact = require('../../validate/contactShema');
const authMiddleware =  require('../../middlewares/authMiddleware');
// const validateObjectId = require('../../middlewares/validateObjectId');

router.get('/', authMiddleware, async (req, res, next) => {
  const { _id: owner } = req.user;

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1) {
      return res.status(400).json({ error: 'Page and limit must be positive integers.' });
    }

    const query = { ...req.query, owner };
    let favoriteMessage = null;

    if (query.favorite !== undefined) {
      if (query.favorite === 'true') {
        query.favorite = true;
      } else if (query.favorite === 'false') {
        query.favorite = false;
        favoriteMessage = 'Showing contacts that are not marked as favorite.';
      }
    }

    delete query.page;
    delete query.limit;

    const contacts = await Contact.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Contact.countDocuments(query);

    const response = {
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };

    if (favoriteMessage) {
      response.favoriteMessage = favoriteMessage;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
});


router.get('/:contactId',authMiddleware, async (req, res, next) => {
  const {_id: owner} = req.user;
  try {
    const contact = await Contact.findOne({_id: req.params.contactId, owner});
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});


router.post('/', authMiddleware, async (req, res, next) => {
  const {_id: owner} = req.user;
  try {
    const { error } = validateContact(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const newContact = new Contact({ ...req.body, owner });
    await newContact.save();
    res.status(201).json({ message: 'Contact created!', newContact });
  } catch (err) {
    next(err);
  }
});

router.delete('/:contactId',authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  const {_id: owner} = req.user;
  try {
    const removedContact = await Contact.findOneAndDelete({_id: contactId, owner});
    if (removedContact) {
      res.status(200).json({ message: 'Contact deleted', removedContact });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId',authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  const {_id: owner} = req.user;
  try {
    const { error } = validateContactUpdate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedContact = await Contact.findOneAndUpdate({_id: contactId, owner}, {...req.body}, { new: true });
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});

router.patch('/:contactId/favorite',authMiddleware, async(req, res, next) => {
  const {contactId} = req.params;
  const {favorite} = req.body;
  const {_id:owner} = req.user;
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
