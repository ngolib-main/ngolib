const {
    fetchAllAdminActions,
    fetchAllSubscriptions,
    fetchAllDonations,
    fetchPendingVerifications,
    fetchAdminId
} = require("../models/adminModel");
const {
    findUserById,
    fetchUserFollowings,
    fetchUserSubscription,
    fetchUserDonation,
    storeUserImage,
    fetchUserImage,
    deleteNgoFollower,
    deleteUserSubscription,
    fetchNGOpostVoluntiring,
    addDonate
} = require("../models/userModel");
const {
    fetchNGOFollowers,
    fetchNGOInfo,
    fetchFromUserDonation
} = require("../models/NGOModel");
const {getAllTags} = require("../models/tagModel");

//generic for all types of users
const fetch_profile_data = async (req, res) => {
    //check if user is logged in
    const sessionUser = req.session.user;
    if (!sessionUser) {
        return res.status(401).json({message: "Unauthorized"});
    }
    const id = sessionUser.id;
    console.log("Session user ID:", id);

    try {
        //check if user with this id exists
        const user = await findUserById(id);
        console.log("User found:", user);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        //for all users fetch of image is same
        const imageBuffer = await fetchUserImage(id);
        let imageDataUrl = null;
        if (imageBuffer) {
            const b64 = imageBuffer.toString("base64");
            imageDataUrl = `data:image/png;base64,${b64}`;
        }

        if (user.type === "user") {
            const followings = await fetchUserFollowings(id);
            const subscriptions = await fetchUserSubscription(id);
            const donations = await fetchUserDonation(id);
            res.status(200).json({user, followings, subscriptions, donations, image: imageDataUrl});

        } else if (user.type === "admin") {
            // Added case where user is an admin.
            const adminId = await fetchAdminId(id);
            const allSubscriptions = await fetchAllSubscriptions();
            const allDonations = await fetchAllDonations();
            const actions = await fetchAllAdminActions();
            const tags = await getAllTags();
            const verifications = await fetchPendingVerifications();
            res.status(200).json({
                user,
                adminId,
                image: imageDataUrl,
                allSubscriptions,
                allDonations,
                tags,
                verifications,
                actions
            });

            //case for NGO profiles
        } else {
            const ngoInfo = await fetchNGOInfo(id);
            const followers = await fetchNGOFollowers(id);
            const followings = await fetchUserFollowings(id);
            const donations = await fetchFromUserDonation(id);
            const post_volunt = await fetchNGOpostVoluntiring(id);
            res.status(200).json({user: ngoInfo, followers, followings, donations, post_volunt, image: imageDataUrl});
        }
    } catch (error) {
        res.status(500).json({message: "Error retrieving user data", error});
    }
};

const store_user_image = async (req, res) => {
    //retrieve user id from session
    const sessionUser = req.session.user;
    if (!sessionUser) {
        return res.status(401).json({message: "Unauthorized"});
    }
    const userId = sessionUser.id;

    //check if body contains image encoded as Base64-encoded string and decodes it into Node.js buffer
    let imageBlob;
    if (req.body.imageBase64) {
        const base64 = req.body.imageBase64.split(",").pop();
        imageBlob = Buffer.from(base64, "base64");
    } else if (req.file && req.file.buffer) {
        imageBlob = req.file.buffer;
    } else {
        return res.status(400).json({message: "No image provided"});
    }

    //in response, we get status code and the number of affected rows
    try {
        const result = await storeUserImage(userId, imageBlob);
        return res.status(200).json({
            message: "Profile image saved successfully",
            affectedRows: result.affectedRows,
        });
    } catch (error) {
        console.error("Error saving user image:", error);
        return res.status(500).json({
            message: "Error saving profile image",
            error: error.message,
        });
    }
};

const delete_follower = async (req, res) => {
    //take id from session
    const userId = req.session.user.id;
    const {ngoId} = req.body;
    if (!ngoId) {
        return res.status(401).json({message: "Unauthorized"});
    }
    try {
        await deleteNgoFollower(userId, ngoId);
        return res.status(200).json({message: 'Unfollow successful'});
    } catch (err) {
        console.error('Error unfollowing NGO:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
};

const add_donate = async (req, res) => {
    //take id from session
    const userId = req.session.user.id;
    const {ngo_id, amount} = req.body;

    if (!req.session.user) {
        return res.status(401).json({message: "Unauthorized"});
    }

    try {
        await addDonate(userId, ngo_id, amount)
        return res.status(200).json({message: "Donate successful"})
    } catch (err) {
        return res.status(500).json({error: 'Internal server error'})
    }
}

//USER specific promise
const delete_user_subscr = async (req, res) => {
    //take id from session
    const userId = req.session.user.id;
    const {ngoId} = req.body;
    if (!ngoId) {
        return res.status(401).json({message: "Unauthorized"});
    }

    try {
        await deleteUserSubscription(userId, ngoId)
        return res.status(200).json({message: "Unsubscribe successful"})
    } catch (err) {
        console.error('Error unfollowing NGO:', err);
        return res.status(500).json({error: 'Internal server error'});
    }

}


module.exports = {fetch_profile_data, store_user_image, delete_follower, delete_user_subscr, add_donate};