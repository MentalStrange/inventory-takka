import { body, validationResult } from 'express-validator';
const validateField = [
  body('field').isEmpty().withMessage('Field cannot be empty'),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
]

export default validateField;