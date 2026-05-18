class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  static error(res, message = 'Error', statusCode = 500, details = null) {
    const errorResponse = {
      status: 'error',
      message
    };
    if (details) errorResponse.details = details;
    
    return res.status(statusCode).json(errorResponse);
  }
}

module.exports = ApiResponse;