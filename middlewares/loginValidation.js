const { body } = require("express-validator");

const signupValidationRules = [
  
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email"),

 
  body("password")
    .notEmpty().withMessage("Password is required")
];

module.exports = signupValidationRules;
