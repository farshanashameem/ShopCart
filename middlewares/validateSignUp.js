const { body } = require("express-validator");

const signupValidationRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 3, max: 20 }).withMessage("Name must be between 3 and 20 characters long"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email"),

  body("mobile")
    .trim()
    .notEmpty().withMessage("Mobile number is required")
    .isNumeric().withMessage("Mobile number must be numeric")
    .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be 10 digits"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage("Password must have 8+ chars, uppercase, lowercase, number, and special character"),

  body("cpassword")
    .notEmpty().withMessage("Confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
];


// Change password form validation
const changePasswordValidationRules = [
  body("password")
    .notEmpty().withMessage("New Password is required")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage("Password must have 8+ chars, uppercase, lowercase, number, and special character"),

  body("cpassword")
    .notEmpty().withMessage("Confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })
];


const editProfileValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 3, max: 10 }).withMessage("Name must be between 3 and 10 characters long"),

  body("email")
    .trim()
    .notEmpty().withMessage("valid email required")
    .isEmail().withMessage("Enter a valid email"),
  body("phone")
    .trim()
    .notEmpty().withMessage("This feild cannot be empty")
    .isNumeric().withMessage("Mobile number must be numeric")
    .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be 10 digits")
];

const changePasswordRules = [
  body("old")
    .trim()
    .notEmpty().withMessage("This feild cannot be empty"),

  body("password")
    .notEmpty().withMessage("New Password is required")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/).withMessage("Password must have 8+ chars, uppercase, lowercase, number, and special character"),

  body("cpassword")
    .notEmpty().withMessage("Confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    })

]

// Export both
module.exports = {
  signupValidationRules,
  changePasswordValidationRules, 
  editProfileValidation,
  changePasswordRules
};