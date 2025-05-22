const db = require("../config/db");

//post opportunity for volunteering
const postOpportunity = async (opportunityData) => {
    const [result] = await db.promise().query(
        `INSERT INTO volunteering_opportunities
         (title, description, location, start, end, contact_email, contact_phone, ngo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            opportunityData.title,
            opportunityData.description,
            opportunityData.location,
            opportunityData.start,
            opportunityData.end,
            opportunityData.contact_email,
            opportunityData.phone_nr,
            opportunityData.ngo_id
        ]
    );
    return result.insertId;
};

//get all the volunteering opportunities
const getAllOpportunities = () => {
    return db.promise().query("SELECT * FROM volunteering_opportunities");
};

module.exports = {getAllOpportunities, postOpportunity};