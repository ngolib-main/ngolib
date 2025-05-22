const db = require("../config/db");

// Function to create an NGO
// Is triggered from the createUser function in userModel.js only if the boolean isNGO === true.
const createNGO = async (ngoName, ngoDescription, ngoEmail, ngoWebsite, ngoPhone, userId) => {
    return new Promise((resolve, reject) => {
        const query = "INSERT into ngo (name, description, contact_email, website_url, phone_nr, user_id) VALUES (?, ?, ?, ?, ?, ?);"
        db.query(query, [ngoName, ngoDescription, ngoEmail, ngoWebsite, ngoPhone, userId], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.length === 0) {
                return resolve(null)
            }
            resolve(result)
        });
    });
}
//fetch basic info about NGO to display in profile
const fetchNGODisplayInfo = async (id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT n.*, website_url, contact_email, phone_nr FROM ngo AS n INNER JOIN users AS u ON n.user_id = u.user_id WHERE n.ngo_id = ?;"
        db.query(query, [id], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.length === 0) {
                return resolve(null)
            }
            resolve(result)
        });
    });
}

//fetch basic NGO info for NGO info page
const fetchNGOInfo = async (id) => {
    return new Promise((resolve, reject) => {
        // const query = "SELECT *  FROM ngo WHERE user_id = ?;"
        const query = "SELECT ngo_id, u.user_id, name, description, website_url, contact_email, phone_nr, type, username FROM ngo AS n JOIN users AS u ON n.user_id = u.user_id WHERE n.user_id = ?;"
        db.query(query, [id], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.length === 0) {
                return resolve(null)
            }
            resolve(result)
        });
    });
}

//fetch NGO followers
const fetchNGOFollowers = async (id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT u.username FROM ngo_followers nf JOIN users u ON nf.user_id = u.user_id WHERE nf.ngo_id IN ( SELECT ngo_id FROM ngo WHERE user_id = ?);"
        db.query(query, [id], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.length === 0) {
                return resolve(null)
            }
            resolve(result)
        });
    });
}

const getAllNgos = () => {
    return db.promise().query("SELECT * FROM ngo");
};

//fetch all the donations to NGO (NGO specified by userid, not ngoid)
const fetchFromUserDonation = async (id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT u.username AS users_who_donated,  d.amount FROM donations AS d INNER JOIN ngo AS n ON d.ngo_id   = n.ngo_id INNER JOIN users  AS u ON d.user_id  = u.user_id WHERE n.user_id = ?;"
        db.query(query, [id], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.length === 0) {
                return resolve(null)
            }
            resolve(result)
        });
    });
}

//fetch only contact details of NGO
const getNgoContactInfo = async (userId) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT ngo_id, contact_email, phone_nr FROM ngo WHERE user_id = ?",
            [userId]
        );
        console.log("NGO Contact Info:", rows); // Logging the result
        return rows;
    } catch (error) {
        console.error("Error fetching NGO contact info:", error); // Logging any error
        throw error;
    }
};


module.exports = {
    createNGO,
    fetchNGOInfo,
    fetchNGOFollowers,
    getAllNgos,
    fetchNGODisplayInfo,
    fetchFromUserDonation,
    getNgoContactInfo
};
