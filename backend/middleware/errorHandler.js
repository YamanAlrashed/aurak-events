// Global error handler — same response shape as the Sohail platform:
// { error: { message, code } }
module.exports = function errorHandler(err, req, res, _next) {
  // PostgreSQL error codes → friendly API errors
  if (err.code === '23505') { err.statusCode = 409; err.code = 'CONFLICT'; err.message = err.friendly || 'Record already exists'; }
  if (err.code === '23503') { err.statusCode = 400; err.code = 'VALIDATION_ERROR'; err.message = 'Referenced record does not exist'; }
  if (err.code === '23514' || err.code === '22P02' || err.code === '22007' || err.code === '22008') {
    err.statusCode = 400; err.code = 'VALIDATION_ERROR'; err.message = 'Invalid value: ' + (err.constraint || err.message);
  }
  if (err.name === 'MulterError') { err.statusCode = 400; err.code = 'VALIDATION_ERROR'; }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) console.error(err.stack || err);
  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? 'Internal Server Error' : err.message,
      code: typeof err.code === 'string' && statusCode < 500 ? err.code : 'SERVER_ERROR'
    }
  });
};
