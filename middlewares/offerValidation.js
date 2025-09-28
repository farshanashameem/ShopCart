const { body } = require('express-validator');

const offerValidationRules = [
 

  body('category').trim().notEmpty().withMessage('Category must be specified.'),

  body('discountValue').trim().notEmpty().withMessage('Discount value is required')
    .isNumeric().withMessage('Base Price must be a number'),

  body('discountType').trim().notEmpty().withMessage('Discount Type is required'),

  body('minValue').trim().notEmpty().withMessage('Minimum order amount is required')
    .isNumeric().withMessage('This field  must be a number'),

  body('startDate').notEmpty().withMessage('Start date is required'),

  body('endDate').notEmpty().withMessage('End date is required'),

];

module.exports = { offerValidationRules };
