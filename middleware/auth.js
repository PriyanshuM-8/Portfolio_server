import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate requests using JWT tokens.
 */
const auth = (req, res, next) => {
  try {
    // Get token from Authorization header (format: Bearer <token>)
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Access denied. Invalid or expired token." });
  }
};

export default auth;
