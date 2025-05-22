const {
    postOpportunity,
    getAllOpportunities
} = require('../models/opportunityModel');
const {getNgoContactInfo} = require('../models/NGOModel');

exports.createOpportunity = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({error: 'Unauthorized'});
        }

        if (req.session.user.type.toLowerCase() !== 'ngo') {
            return res.status(403).json({error: 'Only NGOs can post opportunities'});
        }

        // Correctly handle array result from getNgoContactInfo
        const rows = await getNgoContactInfo(req.session.user.id);
        const ngoContact = rows[0];

        console.log("Resolved NGO Contact Info:", ngoContact);

        if (!ngoContact || !ngoContact.contact_email) {
            return res.status(400).json({error: 'NGO contact information not found'});
        }

        const opportunityData = {
            ...req.body,
            ngo_id: ngoContact.ngo_id,
            contact_email: ngoContact.contact_email,
            phone_nr: ngoContact.phone_nr
        };

        if (!opportunityData.title || !opportunityData.location) {
            return res.status(400).json({error: 'Missing required fields'});
        }

        const opportunityId = await postOpportunity(opportunityData);

        res.status(201).json({
            message: 'Opportunity posted successfully',
            opportunityId   // shorthand for opportunityId: opportunityId
        });
    } catch (error) {
        console.error('Opportunity post error:', error);
        res.status(500).json({error: 'Server error'});
    }
};

exports.getAllOpportunities = async (req, res) => {
    try {
        const opportunities = await getAllOpportunities();
        res.json(opportunities);
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        res.status(500).json({error: 'Server error'});
    }
};