export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[property]);
      req[property] = parsed;
      next();
    } catch (err) {
      return res.status(422).json({
        error: 'Validation error',
        details: err.errors
      });
    }
  };
};
