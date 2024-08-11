const joi = require('joi');

const userSchema = joi.object({
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().messages({
        'string.email': "Email  must be followed by '.' domain suffix. For example adrian@gmail.com",
      }),
      password: joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
        subscription: joi.string()
        .valid('starter', 'pro', 'business')
                  .required()
                  .messages({
                    'string.base': `{{#label}} should be a type of string`,
                    'string.empty': `{{#label}} must contain value`,
                    'any.required': `missing field {{#label}}`,
                  }),
                  token: joi.string().alphanum().min(3).max(200).messages({
                    'string.base': `{{#label}} should be a type of string`,
                    'string.empty': `{{#label}} must contain value`,
                    'string.min': `{{#label}} should have a minimum length of {#limit}`,
                    'string.max': `{{#label}} should have a maximum length of {#limit}`
                })
});
const validateUser = (user) => {
    return userSchema.validate(user)

}
module.exports = {validateUser};

