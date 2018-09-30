/* eslint-disable global-require */
const jwt = require('jsonwebtoken');

if (!process.env.PORT) {
  require('dotenv').config();
}


const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    const NotFoundError = new Error();
    NotFoundError.errmsg = 'Token neads to be provided';
    return res.status(401).json({ error: NotFoundError, message: 'Token neads to be provided' });
  }

  return jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      const JsonWebTokenError = new Error();
      JsonWebTokenError.errmsg = error.message;
      return res.status(500).json({ error: JsonWebTokenError, message: 'Error during authentification of token' });
    }
    req.userId = decoded.user._id;
    req.isAdmin = decoded.user.type === 'admin';
    return next();
  });
};

export default verifyToken;
