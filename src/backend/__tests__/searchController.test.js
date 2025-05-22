/**
 * @jest-environment node
 */

/*
 * --- searchController.test.js ---
 *
 * Unit tests for the searchController.
 */

const { populateSearchNgos, populateSearchOpportunities } = require('../controllers/searchController');

jest.mock('../models/NGOModel', () => ({
    getAllNgos: jest.fn(),
}));
jest.mock('../models/opportunityModel', () => ({
    getAllOpportunities: jest.fn(),
}));
jest.mock('../models/tagModel', () => ({
    getAllTags: jest.fn(),
    getNgoTagPairs: jest.fn(),
    getOpportunityTagPairs: jest.fn(),
}));        // this type of syntax means whenever this module tries to require this, dont give it the real thing,
            // instead give it an object like { actualFunctionName: aMockFunction }
            // this is hoisted to the top, so for sure executed before any import or require
            // jest.fn() creates a special mock function, keeps track of no of calls and args, allows to specify return values

const NGOModel = require('../models/NGOModel');
const tagModel = require('../models/tagModel');
const opportunityModel = require('../models/opportunityModel');     // these get the mock functions

describe('Search Controller - Unit Tests', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Reset every time
        mockReq = {};       // no params, raw route
        mockRes = {
            json: jest.fn(),                        // res.json is also a function, so we can mock it
            status: jest.fn().mockReturnThis(),     // mockReturnThis makes chainable, (returns itself)
        };
        mockNext = jest.fn();

        NGOModel.getAllNgos.mockClear();        // clears stuff like how many calls
        tagModel.getAllTags.mockClear();
        tagModel.getNgoTagPairs.mockClear();
        tagModel.getOpportunityTagPairs.mockClear();
        opportunityModel.getAllOpportunities.mockClear();
    });

    describe('populateSearchNgos', () => {
        it('should return NGOs with correctly assembled tags and with verified as boolean', async () => {
            const mockNgosRaw = [
                { ngo_id: 1, name: 'NGO1', description: 'desc1', website_url: 'url1', contact_email: 'email1', bank_details: 'bank1', verified: Buffer.from([1]) },
                { ngo_id: 2, name: 'NGO2', description: 'desc2', website_url: 'url2', contact_email: 'email2', bank_details: 'bank2', verified: Buffer.from([0]) },
                { ngo_id: 3, name: 'NGO3 (empty tags)', description: 'desc3', website_url: 'url3', contact_email: 'email3', bank_details: 'bank3', verified: Buffer.from([1]) },
            ];
            const mockTagsRaw = [
                { tag_id: 13, tag: 'tag1' },
                { tag_id: 27, tag: 'tag2' },
            ];
            const mockNgoTagPairsRaw = [
                { ngo_id: 1, tag_id: 13 },
                { ngo_id: 1, tag_id: 27 },
                { ngo_id: 2, tag_id: 13 },
            ];

            NGOModel.getAllNgos.mockResolvedValue([mockNgosRaw]);
            tagModel.getAllTags.mockResolvedValue([mockTagsRaw]);
            tagModel.getNgoTagPairs.mockResolvedValue([mockNgoTagPairsRaw]);

            await populateSearchNgos(mockReq, mockRes, mockNext);

            expect(NGOModel.getAllNgos).toHaveBeenCalledTimes(1);       // all functions should be called once
            expect(tagModel.getAllTags).toHaveBeenCalledTimes(1);
            expect(tagModel.getNgoTagPairs).toHaveBeenCalledTimes(1);

            expect(mockRes.json).toHaveBeenCalledWith({
                ngos: [
                    {ngo_id: 1, name: 'NGO1', description: 'desc1', website_url: 'url1', contact_email: 'email1', bank_details: 'bank1', verified: true, tags: ['tag1', 'tag2'] },
                    {ngo_id: 2, name: 'NGO2', description: 'desc2', website_url: 'url2', contact_email: 'email2', bank_details: 'bank2', verified: false, tags: ['tag1'] },
                    {ngo_id: 3, name: 'NGO3 (empty tags)', description: 'desc3', website_url: 'url3', contact_email: 'email3', bank_details: 'bank3', verified: true, tags: [] },
                ],
                tags: ['tag1', 'tag2'],
            });
            expect(mockNext).not.toHaveBeenCalled(); // no error
        });

        it('should handle cases when there are no NGOs', async () => {
            NGOModel.getAllNgos.mockResolvedValue([[]]);            // empty
            tagModel.getAllTags.mockResolvedValue([[{ tag_id: 10, tag: 'tag1' }]]); // some tags might be there
            tagModel.getNgoTagPairs.mockResolvedValue([[]]); // No pairs

            await populateSearchNgos(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                ngos: [],
                tags: ['tag1'],
            }); // graceful response
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle cases when there are no tags', async () => {
            NGOModel.getAllNgos.mockResolvedValue([[{ ngo_id: 1, name: 'NGO Alpha', verified: Buffer.from([1]) }]]);
            tagModel.getAllTags.mockResolvedValue([[]]); // empty
            tagModel.getNgoTagPairs.mockResolvedValue([[]]); // no pairs

            await populateSearchNgos(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                ngos: [
                    { ngo_id: 1, name: 'NGO Alpha', verified: true, tags: [] },
                ],
                tags: [],
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next with error if there is an error', async () => {
            const mockError = new Error('some error');
            NGOModel.getAllNgos.mockRejectedValue(mockError);       // simulates rror

            await populateSearchNgos(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();    // no response now
        })
    });

    describe('populateSearchOpportunities', () => {
        it('should return opportunities with correctly assembled tags', async () => {
            const mockOpportunitiesRaw = [
                {
                    opportunity_id: 1,
                    ngo_id: 101,
                    title: 'Beach Cleanup',
                    description: 'Help clean the beach',
                    location: 'City Beach',
                    start: '2025-06-01T00:00:00.000Z', // ISO string form
                    end: '2025-06-01T00:00:00.000Z',
                    contact_email: 'volunteer@beach.org',
                    contact_phone: '123-456-7890'
                },
                {
                    opportunity_id: 2,
                    ngo_id: 102,
                    title: 'Soup Kitchen Volunteer',
                    description: 'Serve meals',
                    location: 'Downtown Shelter',
                    start: '2025-07-10T00:00:00.000Z',
                    end: '2025-07-10T00:00:00.000Z',
                    contact_email: 'contact@soupkitchen.com',
                    contact_phone: '098-765-4321'
                },
                { // no tags
                    opportunity_id: 3,
                    ngo_id: 103,
                    title: 'Tutoring Program (No Tags)',
                    description: 'Help students',
                    location: 'Community Center',
                    start: '2025-08-01T00:00:00.000Z',
                    end: '2025-08-30T00:00:00.000Z',
                    contact_email: 'tutor@community.org',
                    contact_phone: '555-555-5555'
                },
            ];
            const mockTagsRaw = [
                { tag_id: 30, tag: 'Environment' },
                { tag_id: 40, tag: 'Community' },
            ];
            const mockOpportunityTagPairsRaw = [
                { volunteering_id: 1, tag_id: 30 }, // Beach Cleanup has 'Environment'
                { volunteering_id: 2, tag_id: 40 }, // Soup Kitchen has 'Community'
                { volunteering_id: 2, tag_id: 30 }, // Soup Kitchen has 'Environment'
            ];

            opportunityModel.getAllOpportunities.mockResolvedValue([mockOpportunitiesRaw]);
            tagModel.getAllTags.mockResolvedValue([mockTagsRaw]);
            tagModel.getOpportunityTagPairs.mockResolvedValue([mockOpportunityTagPairsRaw]);

            await populateSearchOpportunities(mockReq, mockRes, mockNext);

            expect(opportunityModel.getAllOpportunities).toHaveBeenCalledTimes(1);
            expect(tagModel.getAllTags).toHaveBeenCalledTimes(1);
            expect(tagModel.getOpportunityTagPairs).toHaveBeenCalledTimes(1);

            expect(mockRes.json).toHaveBeenCalledWith({
                opportunities: [
                    {
                        opportunity_id: 1,
                        ngo_id: 101,
                        title: 'Beach Cleanup',
                        description: 'Help clean the beach',
                        location: 'City Beach',
                        start: '2025-06-01T00:00:00.000Z',
                        end: '2025-06-01T00:00:00.000Z',
                        contact_email: 'volunteer@beach.org',
                        contact_phone: '123-456-7890',
                        tags: ['Environment']
                    },
                    {
                        opportunity_id: 2,
                        ngo_id: 102,
                        title: 'Soup Kitchen Volunteer',
                        description: 'Serve meals',
                        location: 'Downtown Shelter',
                        start: '2025-07-10T00:00:00.000Z',
                        end: '2025-07-10T00:00:00.000Z',
                        contact_email: 'contact@soupkitchen.com',
                        contact_phone: '098-765-4321',
                        tags: ['Community', 'Environment']
                    },
                    {
                        opportunity_id: 3,
                        ngo_id: 103,
                        title: 'Tutoring Program (No Tags)',
                        description: 'Help students',
                        location: 'Community Center',
                        start: '2025-08-01T00:00:00.000Z',
                        end: '2025-08-30T00:00:00.000Z',
                        contact_email: 'tutor@community.org',
                        contact_phone: '555-555-5555',
                        tags: []
                    },
                ],
                tags: ['Environment', 'Community'], // top level
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle cases when there are no opportunities', async () => {
            opportunityModel.getAllOpportunities.mockResolvedValue([[]]); // empty
            tagModel.getAllTags.mockResolvedValue([[{ tag_id: 10, tag: 'Animals' }]]); // some tags
            tagModel.getOpportunityTagPairs.mockResolvedValue([[]]); // No pairs

            await populateSearchOpportunities(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                opportunities: [],
                tags: ['Animals'],
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next with error if there is an error)', async () => {
            const mockError = new Error('Failed to fetch tags');
            tagModel.getAllTags.mockRejectedValue(mockError);

            await populateSearchOpportunities(mockReq, mockRes, mockNext);

            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

})