const tokenBlacklist = new Set();

/**
 * Add token to blacklist
 */
const addToBlacklist = (token, expiresIn) => {
  tokenBlacklist.add(token);
  
  // Optional: Auto-remove expired tokens after the expiration time
  if (expiresIn) {
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, expiresIn * 1000);
  }
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Clear entire blacklist (useful for testing)
 */
const clearBlacklist = () => {
  tokenBlacklist.clear();
};

module.exports = {
  addToBlacklist,
  isTokenBlacklisted,
  clearBlacklist,
};
