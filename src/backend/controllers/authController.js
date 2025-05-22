const {createUser, findUserByEmail, storeResetToken, findByToken, updatePassword} = require("../models/userModel");
const {createNGO} = require("../models/NGOModel");
const {sendEmail} = require('../controllers/contactController');
const bcrypt = require("bcryptjs"); // Import bcrypt to compare password hashes
const crypto = require("crypto");

// Sign up function
// Creates a new user and in case that "isNGO" is true, creates an NGO too.
const signup = async (req, res) => {
    const {
        username,
        email,
        password,
        password_rep,
        isNGO,
        ngoName,
        ngoEmail,
        ngoWebsite,
        ngoPhone,
        ngoDescription
    } = req.body;

    if (!email || !password || !password_rep) {  // in front
        return res.status(400).json({message: "All fields are required"});
    }
    if (password !== password_rep) {
        return res.status(400).json({message: "Passwords do not match"});
    }

    try {
        // Step 1: Create the user and get the ID
        const userId = await createUser(username, email, password, isNGO);
        //console.log("User ID:", userId.insertId);
        // Step 2: If it's an NGO, create the NGO with the user's ID
        if (isNGO) {
            await createNGO(ngoName, ngoDescription, ngoEmail, ngoWebsite, ngoPhone, userId.insertId);
        }
        // Step 3: Respond once, at the end
        res.status(201).json({
            message: isNGO ? "User and NGO registered successfully" : "User registered successfully"
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({message: "Email already in use"});
        } else {
            console.error("Signup error:", error);
            res.status(500).json({message: "Error registering user", error});
        }
    }

};

// Login function
// Controller function to handle login
const login = async (req, res) => {
    const {email, password} = req.body; // Extract email and password from the request

    if (!email || !password) {
        return res.status(400).json({message: "All fields are required"}); // Ensure both fields are provided
    }

    try {
        const user = await findUserByEmail(email); // Retrieve user by email from database
        if (!user) {
            return res.status(401).json({message: "Invalid credentials"}); // User not found
        }

        // Compare input password with stored password hash
        const isMatch = await bcrypt.compare(password, user.pw_hash);
        if (!isMatch) {
            return res.status(401).json({message: "Invalid credentials"}); // Password mismatch
        }

        // Set a cookie with user ID (or session token)
        req.session.user = {
            id: user.user_id,
            name: user.username,
            email: user.email,
            type: user.type
        };

        //console.log("Session set:", req.session.user);

        // Successful login response
        res.status(200).json({
            message: "Login successful",
            type: user.type
        });
    } catch (error) {
        res.status(500).json({message: "Error logging in", error});
    }
};

// Function to logout
const logout = (req, res) => {
    req.session.destroy();
    res.status(200).json({message: "Logout successful"});
}

// Function to check cookie
const me = (req, res) => {
    if (req.session && req.session.user) {
        // Send only safe user info (avoid exposing password hashes, etc.)
        const {id, name, email, type} = req.session.user;
        return res.status(200).json({id, name, email, type});
    } else {
        return res.status(401).json({message: "Not authenticated"});
    }
};


const forgot = async (req, res) => {
    const {email} = req.body;
    if (!email) return res.status(400).json({message: "Email is required"});

    try {
        const user = await findUserByEmail(email);
        //console.log(user);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await storeResetToken(user.user_id, token, expiry);

        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        // Use the sendEmail function directly
        const emailResult = await sendEmail(
            email,
            "Password Reset",
            `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`
        );

        if (!emailResult.success) {
            return res.status(500).json({message: "Failed to send reset email"});
        }

        res.status(200).json({message: "Reset email sent"});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
};


//
const findUserByToken = async (req, res) => {
    const {token} = req.body;

    try {
        const result = await findByToken(token);

        if (result.error) {
            return res.status(result.status).json({message: result.error});
        }

        return res.status(result.status).json({
            user_id: result.user_id,
            email: result.email
        });
    } catch (error) {
        console.error('Error in findUserByToken controller:', error);
        return res.status(500).json({
            message: 'Error processing your request',
            error: error.message
        });
    }
};

//
const resetPassword = async (req, res) => {
    const {userId, password, password_rep} = req.body;
    //console.log(userId, password, password_rep);
    if (!password || !password_rep) {
        return res.status(400).json({message: "Repeat the password"});
    }
    if (password !== password_rep) {
        return res.status(400).json({message: "Passwords do not match"});
    }
    try {
        const result = await updatePassword(userId, password);
        //console.log("Restul in resetPassword:")
        //console.log(result);
        if (result.error) {
            return res.status(result.status).json({message: result.error});
        }
        res.status(200).json({message: "Password updated successfully"});
    } catch (error) {
        console.error('Error in reset password controller:', error);
        return res.status(500).json({
            message: 'Error processing your request',
            error: error.message
        });
    }
}


// Export it all, baby
module.exports = {
    login,
    logout,
    signup,
    me,
    forgot,
    findUserByToken,
    resetPassword
};


