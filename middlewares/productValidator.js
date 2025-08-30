const { body } = require('express-validator');

const productValidationRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),

  body('description').trim().notEmpty().withMessage('Description is required'),

  body('variants.*.basePrice').notEmpty().withMessage('Base Price is required')
    .isNumeric().withMessage('Base Price must be a number'),

  body('variants.*.discountPrice').notEmpty().withMessage('Discount Price is required')
    .isNumeric().withMessage('Discount Price must be a number'),

  body('genderId').notEmpty().withMessage('Gender is required'),

  body('productTypeId').notEmpty().withMessage('Product type is required'),

  body('variants.*.fitId').notEmpty().withMessage('Fit is required'),

  body('variants.*.colorId').notEmpty().withMessage('Color is required'),

  body('variants.*.size').notEmpty().withMessage('Size is required'),

  body('variants.*.stock').notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('images').custom((value, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error('At least one image is required');
    }
    
    return true;
  })
];

const editProductValidator=[
  body('name').trim().notEmpty().withMessage('Product name is required'),

  body('description').trim().notEmpty().withMessage('Description is required'),

  body('variants.*.basePrice').notEmpty().withMessage('Base Price is required')
    .isNumeric().withMessage('Base Price must be a number'),

  body('variants.*.discountPrice').notEmpty().withMessage('Discount Price is required')
    .isNumeric().withMessage('Discount Price must be a number'),

  body('genderId').notEmpty().withMessage('Gender is required'),

  body('productTypeId').notEmpty().withMessage('Product type is required'),

  body('variants.*.fitId').notEmpty().withMessage('Fit is required'),

  body('variants.*.colorId').notEmpty().withMessage('Color is required'),

  body('variants.*.size').notEmpty().withMessage('Size is required'),

  body('variants.*.stock').notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),


];

module.exports = { productValidationRules ,editProductValidator };
