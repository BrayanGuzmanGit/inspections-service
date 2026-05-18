const ApiResponse = require('../shared/ApiResponse');
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  console.error('ERROR 💥:', err);
  return ApiResponse.error(res, 'Internal Server Error. Algo salió muy mal!', 500, err.message);
};

module.exports = errorHandler;
