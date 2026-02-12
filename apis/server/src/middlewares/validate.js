// middlewares/validate.js
const validate = (validator, isUpdate = false) => {
  return async (req, res, next) => {
    try {
      const errors = await validator(req.body, isUpdate);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { validate };