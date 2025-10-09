const { body } = require("express-validator");

const signupValidationRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required"),

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
    .notEmpty().withMessage("Name is required"),

  body("email")
    .trim()
    .notEmpty().withMessage("valid email required")
    .isEmail().withMessage("Enter a valid email"),
  body("phone")
    .trim()
    .notEmpty().withMessage("This feild cannot be empty")
    .isNumeric().withMessage("Mobile number must be numeric")
    .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be 10 digits"),

  body("profileImage").custom((value, { req }) => {
    if (req.file) {
      // Allowed mime types
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only image files (jpg, jpeg, png, webp) are allowed");
      }
    }
    return true; // no file uploaded is okay if image is optional
  }),
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

const validateAddress = [

  body("name")
    .trim()
    .notEmpty().withMessage("Name is required"),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number required")
    .isNumeric().withMessage("Mobile number must be numeric")
    .isLength({ min: 10, max: 10 }).withMessage("Mobile number must be 10 digits"),

  body("pin")
    .trim()
    .notEmpty().withMessage("pin number required")
    .isLength({ min: 6, max: 6 }).withMessage("pin number must contain  6 digits")
    .isNumeric().withMessage("Pin must be numeric"),

  body("locality")
    .trim()
    .notEmpty().withMessage("locality required"),

  body("address")
    .trim()
    .notEmpty().withMessage("Address must be filled"),

  body("city")
    .trim()
    .notEmpty().withMessage("City must be specified")
    .matches(/^[A-Za-z\s]+$/).withMessage('City should contain only letters and spaces'),

  body("state")
    .trim()
    .notEmpty().withMessage("One state should be selected"),

  body("landmark")
    .optional({ checkFalsy: true })
    .trim(),

  body("altnumber")
    .optional({ checkFalsy: true })
    .trim()
    .isNumeric().withMessage("Enter valid number")
    .isLength({ min: 10, max: 10 }).withMessage("Phone number is 10 digits long")
    .custom((value, { req }) => {
      if (value && value === req.body.phone) {
        throw new Error("Alternate number cannot be same as primary phone number");
      }
      return true;
    }),  
  body("addressType")
    .trim()
    .notEmpty().withMessage("Select one Type")

]

// Export both
module.exports = {
  signupValidationRules,
  changePasswordValidationRules,
  editProfileValidation,
  changePasswordRules,
  validateAddress
};