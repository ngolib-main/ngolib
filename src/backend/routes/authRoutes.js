/* --- authRoutes.js ---
 *
 * In this file the /api/auth/* routes are defined.
 * Supports the Controller part of the MVC model.
 *
 * Routes: signup, login, logout, me, forgot
 *
 */

const express = require("express");
// Functions Model
const { signup, login, logout, me, forgot, findUserByToken, resetPassword} = require("../controllers/authController");

const router = express.Router();                    // Creates a router

// Define signup route
router.post("/signup", signup);                       // POST /api/auth/signup
// Define login route
router.post("/login", login);                         // POST /api/auth/login
// Define logout route
router.post("/logout", logout);                       // POST /api/auth/logout
// Define route to get current session user
router.get("/me", me);                                // POST /api/auth/me
// Define route for password recovery
router.post("/forgot-password", forgot);              // POST /api/auth/forgot-password
// Define route to find a user by token
router.post("/find-user", findUserByToken);           // POST /api/auth/find-user
// Define route to update the hashed password
router.post("/reset-password", resetPassword);        // POST /api/auth/reset-password

module.exports = router;                                   // Export the router so it can be used in server.js
