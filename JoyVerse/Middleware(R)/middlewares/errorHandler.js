const errorHandler= (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
};

const notFound = (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
};

module.exports = {
  notFound,
  errorHandler
};