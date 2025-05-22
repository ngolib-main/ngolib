/* --- contactRoutes.js ---
 *
 * In this file the /api/contact/* routes are defined.
 * Supports the Controller part of the MVC model.
 *
 * Routes:
 *
 */

const express = require("express");
// Functions Controller
const { sendContactEmail} = require("../controllers/contactController");

const router = express.Router();                    // Creates a router

// Define update subscription route
router.post('/form', sendContactEmail);                             // POST /api/contact/form

module.exports = router;                                   // Export the router so it can be used in server.js
