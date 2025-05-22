const express = require("express");
const {
    fetch_profile_data,
    store_user_image,
    delete_follower,
    delete_user_subscr,
    add_donate
} = require("../controllers/profileController");
const {getNgoContactInfo} = require("../models/NGOModel");
const router = express.Router();

// Add this route to your existing profileRoutes
router.get('/profile/ngo-contact', async (req, res) => {
    try {
        if (!req.session.user?.id || req.session.user.type.toLowerCase() !== 'ngo') {
            return res.status(403).json({error: 'NGO access required'});
        }

        const [result] = await getNgoContactInfo(req.session.user.id);

        if (!result) {
            return res.status(404).json({error: 'NGO not found'});
        }

        res.json({
            ngo_id: result.ngo_id,
            contact_email: result.contact_email,
            phone_nr: result.phone_nr
        });

    } catch (error) {
        console.error('Contact info error:', error);
        res.status(500).json({error: 'Server error'});
    }
});
router.get("/profile", fetch_profile_data);
router.post("/profile/image", express.json({limit: "10mb"}), store_user_image);
router.delete("/profile/unfollow", delete_follower)
router.delete("/profile/unsubscribe", delete_user_subscr)
router.post("/payment", add_donate)
module.exports = router;