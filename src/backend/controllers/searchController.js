const NGOModel = require('../models/NGOModel');
const tagModel = require('../models/tagModel');
const opportunityModel = require('../models/opportunityModel');

exports.populateSearchNgos = async (req, res, next) => {
    try {
        const [ngosRaw] = await NGOModel.getAllNgos();
        const [tagsRaw] = await tagModel.getAllTags();
        const [pairsRaw] = await tagModel.getNgoTagPairs();

        const tagMap = new Map(tagsRaw.map(t => [t.tag_id, t.tag]));

        const ngos = ngosRaw.map(ngo => {
            const myTagIds = pairsRaw
                .filter(p => p.ngo_id === ngo.ngo_id)   // match to only current ngo
                .map(p => p.tag_id);                    // map to tag

            const myTags = myTagIds
                .map(id => tagMap.get(id))              // match names by id
                .filter(Boolean);                       // defensive

            return {
                ...ngo,
                verified: ngo.verified?.[0] === 1,      // in SQL verified is a bit, so it will be fetched in buffer form, 0th index to be accessed,
                                                        // ? means if exists, otherwise undefined instead of error, verified set equal to boolean expression
                tags: myTags
            };                                          // ... spread operator takes properties of object into key value
                                                        // add or overwrite a property tags
        });

        res.json({
            ngos,
            tags: tagsRaw.map(t => t.tag)
        });
    } catch (err) {
        next(err);
    }
};

exports.populateSearchOpportunities = async (req, res, next) => {
    try {
        const [opportunitiesRaw] = await opportunityModel.getAllOpportunities();
        const [tagsRaw] = await tagModel.getAllTags();
        const [pairsRaw] = await tagModel.getOpportunityTagPairs();

        const tagMap = new Map(tagsRaw.map(tag => [tag.tag_id, tag.tag]));

        const opportunities = opportunitiesRaw.map(opportunity => {
            const myTagIds = pairsRaw
                .filter(pair => pair.volunteering_id === opportunity.opportunity_id)
                .map(pair => pair.tag_id);

            const myTags = myTagIds
                .map(id => tagMap.get(id))
                .filter(Boolean);

            return {...opportunity, tags: myTags};

        });

        res.json({
            opportunities,
            tags: tagsRaw.map(tag => tag.tag)
        });
    } catch (err) {
        next(err);
    }
}

exports.getNGOById = async (req, res) => {
    const startTime = Date.now();
    const {id} = req.params;

    console.log(`Starting NGO fetch for ID: ${id}`);
    console.log('Request headers:', req.headers);

    try {
        // Validate ID format
        if (!/^\d+$/.test(id)) {
            console.error('Invalid ID format:', id);
            return res.status(400).json({error: 'Invalid NGO ID format'});
        }

        // Stage 1: Fetch Base Info
        const ngoStart = Date.now();
        const ngoInfo = await NGOModel.fetchNGODisplayInfo(id);
        console.log(`Base info fetch: ${Date.now() - ngoStart}ms`);

        if (!ngoInfo || ngoInfo.length === 0) {
            console.log('No NGO found for ID:', id);
            return res.status(404).json({error: 'NGO not found'});
        }

        // Stage 2: Fetch Related Data
        const tagsStart = Date.now();
        const [tagsRaw, pairsRaw, followers] = await Promise.all([
            tagModel.getAllTags(),
            tagModel.getNgoTagPairs(),
            NGOModel.fetchNGOFollowers(id)
        ]);
        console.log(`Related data fetch: ${Date.now() - tagsStart}ms`);

        // Process data
        const processedData = {
            ...ngoInfo[0],
            tags: processTags(pairsRaw, tagsRaw, ngoInfo[0].ngo_id),
        };

        console.log(`Successful fetch for ${id} in ${Date.now() - startTime}ms`);
        res.json(processedData);

    } catch (err) {
        console.error('Critical error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            error: 'Internal server error',
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString()
        });
    }
};

// Helper function
const processTags = (pairs, tags, ngoId) => {
    const tagMap = new Map(tags.map(t => [t.tag_id, t.tag]));
    return pairs
        .filter(p => p.ngo_id === ngoId)
        .map(p => tagMap.get(p.tag_id))
        .filter(Boolean);
};