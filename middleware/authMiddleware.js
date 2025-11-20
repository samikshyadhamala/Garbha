const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => { 
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      console.log("Received token:", token); // Log the token

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded); // Log the decoded payload

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      console.log(req.user)

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }
      console.log("i am near next")

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Not authorized as an admin" });
  }
};

