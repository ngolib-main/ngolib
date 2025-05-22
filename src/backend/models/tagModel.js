const db = require("../config/db");

const getAllTags = () => {
    return db.promise().query("SELECT * FROM tags_cause");
};

const getNgoTagPairs = () => {
    return db.promise().query("SELECT * FROM ngo_tags");
};

const getOpportunityTagPairs = () => {
    return db.promise().query("SELECT * FROM volunteering_tags");
}

// Function to add a tag to the tags_cause table
// This function is called from the createTag function in tagController.js
// The function takes the following parameters:
// - req: The request object containing the tag
// - res: The response object to return the result of the operation
// The function returns a promise that resolves to the result of the operation
const addTag = async (req, res) => {
    const {tag} = req.body;
    console.log(tag);

    try {
        const [result] = await db.promise().query(
            "INSERT INTO tags_cause (tag) VALUES (?)",
            [tag]
        );

        // Return success response with the newly created tag ID
        return res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Tag added successfully"
        });
    } catch (error) {
        // Check for duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'duplicate_tag',
                message: 'This tag already exists'
            });
        }

        // Handle other database errors
        console.error("Database error:", error);
        return res.status(500).json({
            success: false,
            error: 'database_error',
            message: 'An error occurred while adding the tag'
        });
    }
}

const deleteTag = async (req, res) => {
    const {tag_id} = req.body;

    // Validate tag_id
    if (!tag_id || isNaN(parseInt(tag_id))) {
        return res.status(400).json({
            success: false,
            error: 'invalid_id',
            message: 'Invalid tag ID provided'
        });
    }

    try {
        // First check if tag is in use by any NGOs
        const [tagUsage] = await db.promise().query(
            "SELECT COUNT(*) as count FROM ngo_tags WHERE tag_id = ?",
            [tag_id]
        );

        if (tagUsage[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: 'tag_in_use',
                message: 'Cannot delete a tag that is currently in use by one or more NGOs'
            });
        }

        // If not in use, proceed with deletion
        const [result] = await db.promise().query(
            "DELETE FROM tags_cause WHERE tag_id = ?",
            [tag_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'tag_not_found',
                message: 'Tag not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tag deleted successfully'
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({
            success: false,
            error: 'database_error',
            message: 'An error occurred while deleting the tag'
        });
    }
}


module.exports = {getAllTags, getNgoTagPairs, getOpportunityTagPairs, addTag, deleteTag};