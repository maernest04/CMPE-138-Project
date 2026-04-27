// SJSU CMPE 138 SPRING 2026 TEAM2
// Auth helpers for password hashing/verification
// Used by auth routes and potentially user management

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10; // bcrypt cost factor

/**
 * Hash a plaintext password for storage
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  if (!password || typeof password !== "string" || password.length === 0) {
    throw new Error("Invalid password");
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a hash
 * @param {string} password - Plaintext password to check
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword, SALT_ROUNDS };