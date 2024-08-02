const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  const { contactId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return res.status(400).json({ message: 'Invalid ObjectId' });
  }
  next();
};

module.exports = validateObjectId;
