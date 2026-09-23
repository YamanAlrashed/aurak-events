// Small helper so every controller returns the same error shape:
// { error: { message, code } }  (same contract as the Sohail platform)
function httpError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

const badRequest = (msg) => httpError(400, 'VALIDATION_ERROR', msg);
const unauthorized = (msg = 'Not authenticated') => httpError(401, 'UNAUTHORIZED', msg);
const forbidden = (msg = 'Forbidden') => httpError(403, 'FORBIDDEN', msg);
const notFound = (msg = 'Not found') => httpError(404, 'NOT_FOUND', msg);
const conflict = (msg) => httpError(409, 'CONFLICT', msg);

module.exports = { httpError, badRequest, unauthorized, forbidden, notFound, conflict };
