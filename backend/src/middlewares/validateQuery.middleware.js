const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error.issues[0].message });
  }
  req.query = result.data;
  next();
};

export default validateQuery;
