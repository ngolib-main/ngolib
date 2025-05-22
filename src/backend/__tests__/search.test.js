/**
 * @jest-environment node
 */

/*
 * --- search.test.js ---
 *
 *     -- TESTS --
 *
 *  Integration test for search API
 */

const request = require('supertest');
const app = require('../server');

describe('Search API - Integration Tests', () => {
    describe('GET /api/ngos', () => {
        let res;
        beforeAll(async () => {
            // we fetch the data once for all tests in one block, this ensure te data does not change
            res = await request(app).get('/api/ngos')
        })
        it('should return 200 OK and the correct top level structure', async () => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('ngos');
            expect(res.body).toHaveProperty('tags');
            expect(Array.isArray(res.body.ngos)).toBe(true);
            expect(Array.isArray(res.body.tags)).toBe(true);
        });
        it('should return the correct structure for each ngo', async () => {
            if (res.body.ngos.length > 0) {
                const firstNgo = res.body.ngos[0];
                expect(firstNgo).toEqual(   // pick first ngo and check if it matches the expected object structure
                    expect.objectContaining(
                        {
                            ngo_id: expect.any(Number),
                            user_id: expect.any(Number),
                            name: expect.any(String),
                            description: expect.any(String),
                            website_url: expect.any(String),
                            contact_email: expect.any(String),
                            // bank_details: expect.any(String),    //bcs still null
                            verified: expect.any(Boolean),          // controller should convert bit to boolean
                        }
                    )
                )
                expect(firstNgo).toHaveProperty('tags');
                expect(Array.isArray(firstNgo.tags)).toBe(true);
                firstNgo.tags.forEach(tag => {
                    expect(typeof tag).toBe('string');
                });
            }
            else {
                console.warn("No NGOs found in test data, skipping test")
            }
        })
    })
    describe('GET /api/opportunities', () => {
        let res;
        beforeAll(async () => {
            // we fetch the data once for all tests in one block, this ensure te data does not change
            res = await request(app).get('/api/opportunities')
        })
        it('should return 200 OK and the correct top level structure', async () => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('opportunities');
            expect(res.body).toHaveProperty('tags');
            expect(Array.isArray(res.body.opportunities)).toBe(true);
            expect(Array.isArray(res.body.tags)).toBe(true);
        });
        it('should return the correct structure for each opportunity', async () => {
            if (res.body.opportunities.length > 0) {
                const firstOpp = res.body.opportunities[0];
                expect(firstOpp).toEqual(   // pick first ngo and check if it matches the expected object structure
                    expect.objectContaining(
                        {
                            opportunity_id: expect.any(Number),
                            ngo_id: expect.any(Number),
                            title: expect.any(String),
                            description: expect.any(String),
                            location: expect.any(String),
                            start: expect.any(String),
                            end: expect.any(String),
                            contact_email: expect.any(String),
                            contact_phone: expect.any(String),
                        }
                    )
                )
                expect(firstOpp).toHaveProperty('tags');
                expect(Array.isArray(firstOpp.tags)).toBe(true);
                firstOpp.tags.forEach(tag => {
                    expect(typeof tag).toBe('string');
                });
            }
            else {
                console.warn("No Opportunities found in test data, skipping test")
            }
        })
    })
    describe('Error handling and edge cases', () => {
        let resNgos;
        let resOpps;
        beforeAll(async () => {
            // we fetch the data once for all tests in one block, this ensure te data does not change
            resOpps = await request(app).get('/api/opportunities');
            resNgos = await request(app).get('/api/ngos');
        })
        it('should return a list of unique tags, consistent from both endpoints', async () => {
            expect(resNgos.statusCode).toBe(200);
            expect(resOpps.statusCode).toBe(200);

            // sort before comparing to ensure order plays no role
            const sortedTagsFromNgos = [...resNgos.body.tags].sort();
            const sortedTagsFromOpps = [...resOpps.body.tags].sort();

            expect(sortedTagsFromNgos).toEqual(sortedTagsFromOpps);
        })
    })
})