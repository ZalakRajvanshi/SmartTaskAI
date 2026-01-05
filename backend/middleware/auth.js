// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export default function auth(req, res, next) {
  // Try to get token from httpOnly cookie first, then fallback to Authorization header
  let token = req.cookies?.auth_token;
  
  if (!token) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { sub: userId, role: "admin" }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }
}
