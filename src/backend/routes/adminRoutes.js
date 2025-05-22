/* --- adminRoutes.js ---
 *
 * In this file the /api/admin/* routes are defined.
 * Supports the Controller part of the MVC model.
 *
 * Routes: subscriptions/:id/status, actions
 *
 */

const express = require("express");
// Functions Model
const { updateSubscriptionStatus, addAdminAction } = require("../models/adminModel");
const {addTag, deleteTag} = require("../models/tagModel");

const router = express.Router();                    // Creates a router

// Define update subscription route
router.put('/subscriptions/:id/status', updateSubscriptionStatus);  // PUT /api/subscriptions/:id/status
// Define the route to add admin actions
router.post('/actions', addAdminAction);                            // POST /api/admin/actions
// Define route to add a tag
router.post('/tag', addTag);                                        // POST /api/admin/tag
// Define route to remove a tag
router.post('/delete-tag', deleteTag);                               // POST /api/admin/removeTag

module.exports = router;                                   // Export the router so it can be used in server.js
