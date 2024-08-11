const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'any.required': 'missing required name field',
    'string.empty': 'missing required name field'
  }),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().messages({
    'any.required': 'missing required email field',
    'string.empty': 'missing required email field',
    'string.email': 'email must be a valid email'
  }),
  phone: Joi.string().min(10).required().messages({
    'any.required': 'missing required phone field',
    'string.empty': 'missing required phone field',
    'string.min': 'phone must be at least 10 characters'
  }),
});

const contactUpdateSchema = Joi.object({
  name: Joi.string().min(3).messages({
    'string.min': 'name must be at least 3 characters'
  }),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).messages({
    'string.email': 'email must be a valid email'
  }),
  phone: Joi.string().min(10).messages({
    'string.min': 'phone must be at least 10 characters'
  }),
}).or('name', 'email', 'phone').messages({
  'object.missing': 'missing fields'
});

const validateContact = (contact) => {
  return contactSchema.validate(contact);
};

const validateContactUpdate = (contact) => {
  return contactUpdateSchema.validate(contact);
};

module.exports = { validateContact, validateContactUpdate };
