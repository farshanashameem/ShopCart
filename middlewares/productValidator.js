const { body } = require('express-validator');

const productValidationRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),

  body('description').trim().notEmpty().withMessage('Description is required'),

  body('variants.*.basePrice')
    .notEmpty().withMessage('Base Price is required')
    .isNumeric().withMessage('Base Price must be a number')
    .custom((value, { req, path }) => {
      if (value < 0) throw new Error('Base Price cannot be negative');
      const index = path.match(/\d+/)[0];
      const discountPrice = req.body.variants[index]?.discountPrice;  
      if (discountPrice && Number(value) <= Number(discountPrice)) {
        throw new Error('Base Price must be higher than Discount Price');
      }
      return true;
    }),

  body('variants.*.discountPrice')
    .notEmpty().withMessage('Discount Price is required')
    .isNumeric().withMessage('Discount Price must be a number')
    .custom((value) => {
      if (value < 0) throw new Error('Discount Price cannot be negative');
      return true;
    }),

  body('genderId').notEmpty().withMessage('Gender is required'),

  body('productTypeId').notEmpty().withMessage('Product type is required'),

  body('variants.*.fitId').notEmpty().withMessage('Fit is required'),

  body('variants.*.colorId').notEmpty().withMessage('Color is required'),

  body('variants.*.size').notEmpty().withMessage('Size is required'),

  body('variants.*.stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('images').custom((value, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error('At least one image is required');
    }
    return true;
  }),
];

const editProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),

  body('description').trim().notEmpty().withMessage('Description is required'),

  body('variants.*.basePrice')
    .notEmpty().withMessage('Base Price is required')
    .isNumeric().withMessage('Base Price must be a number')
    .custom((value, { req, path }) => {
      if (value < 0) throw new Error('Base Price cannot be negative');
      const index = path.match(/\d+/)[0];
      const discountPrice = req.body.variants[index]?.discountPrice;
      if (discountPrice && Number(value) <= Number(discountPrice)) {
        throw new Error('Base Price must be higher than Discount Price');
      }
      return true;
    }),

  body('variants.*.discountPrice')
    .notEmpty().withMessage('Discount Price is required')
    .isNumeric().withMessage('Discount Price must be a number')
    .custom((value) => {
      if (value < 0) throw new Error('Discount Price cannot be negative');
      return true;
    }),

  body('genderId').notEmpty().withMessage('Gender is required'),

  body('productTypeId').notEmpty().withMessage('Product type is required'),

  body('variants.*.fitId').notEmpty().withMessage('Fit is required'),

  body('variants.*.colorId').notEmpty().withMessage('Color is required'),

  body('variants.*.size').notEmpty().withMessage('Size is required'),

  body('variants.*.stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

module.exports = { productValidationRules, editProductValidator };
