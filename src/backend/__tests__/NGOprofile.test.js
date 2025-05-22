/**
 * @jest-environment node
 */

const request = require('supertest');
const app     = require('../server');
const db      = require('../config/db');

const testNGO = {
    email:    'testNGO@gmail.com',
    password: '4444',
    username: 'testNGO',
    type:     'NGO',
};

let createdOpportunityId;

describe('NGO Profile tests', () => {
    let cookie;
    let profileBody;

    beforeAll(async () => {
        // Log in and capture the session cookie
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: testNGO.email, password: testNGO.password })
            .expect(200);

        cookie = login.headers['set-cookie'];
        expect(cookie).toBeDefined();

        // Fetch the profile once for all subsequent tests
        const res = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        profileBody = res.body;
    });


    it('has the correct top-level structure', () => {
        expect(profileBody).toMatchObject({
            donations:   expect.any(Array),
            followers:   expect.any(Array),
            followings:  expect.any(Array),
            post_volunt: expect.any(Array),
            user:        expect.any(Array),
            image:       null,
        });
    });

    it('contains the donation record for waterforall (and possibly others)', () => {
        expect(profileBody.donations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    users_who_donated: 'waterforall',
                    amount:            '40',
                })
            ])
        );
    });

    it('contains at least those two followers', () => {
        expect(profileBody.followers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ username: 'alicej'   }),
                expect.objectContaining({ username: 'charliel' })
            ])
        );

    });

    it('returns exactly the two followings', () => {
        expect(profileBody.followings).toEqual([
            expect.objectContaining({ ngo_id: 7, ngo_name: 'Water for All' }),
            expect.objectContaining({ ngo_id: 8, ngo_name: 'Women Rising' })

        ]);
    });

    it('returns volunteering post', () => {
        expect(profileBody.post_volunt).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    opportunity_id: 18,
                    ngo_id:         30,
                    title:          'test volunteering',
                    description:    'bla bla bla',
                    location:       'Leuven, Belgium'
                })
            ])
        );
    });

    it('returns correct NGO user info', () => {

        expect(profileBody.user).toEqual([
            expect.objectContaining({
                ngo_id:      30,
                user_id:     271,
                name:        'Test NGO',
                description: expect.stringContaining('mmmmdmdm'),
                website_url: 'http://lightbridge.world'
            })
        ]);

        expect(profileBody.user).toHaveLength(1);
    });

    it('DELETE /api/profile/unfollow actually removes one following', async () => {
        const del = await request(app)
            .delete('/api/profile/unfollow')
            .set('Cookie', cookie)
            .send({ ngoId: 8 })
            .expect(200);

        expect(del.body.message).toMatch(/unfollow/i);

        const after = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        const afterFollowings = after.body.followings;
        expect(afterFollowings).toHaveLength(1);
        expect(
            afterFollowings.some(f => f.ngo_id === 8)
        ).toBe(false);
    });


    it('successfully posts a volunteering opportunity', async () => {
        const opportunity = {
            title:       'Test Opportunity',
            description: 'A chance to help our NGO!',
            location:    'Brussels, Belgium',
            start:       '2025-06-01',
            end:         '2025-06-30'
        };

        const res = await request(app)
            .post('/api/postOpportunity')
            .set('Cookie', cookie)
            .send(opportunity)
            .expect(201);

        expect(res.body).toHaveProperty('message', 'Opportunity posted successfully');
        expect(res.body).toHaveProperty('opportunityId');
        expect(typeof res.body.opportunityId).toBe('number');
        createdOpportunityId = res.body.opportunityId;
    });

    it('fails to post without a required field (e.g. title)', async () => {
        const incomplete = {
            description: 'Missing title',
            location:    'Antwerp',
            start:       '2025-06-01',
            end:         '2025-06-10'
        };

        const res = await request(app)
            .post('/api/postOpportunity')
            .set('Cookie', cookie)
            .send(incomplete)
            .expect(400);

        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    it('rejects unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/postOpportunity')
            .send({
                title:       'Unauth test',
                description: 'Should fail',
                location:    'Ghent',
                start:       '2025-06-01',
                end:         '2025-06-15'
            })
            .expect(401);

        expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    // Add this new section for NGO Info ONLY
    describe('NGO Information Endpoints', () => {
        it('fetches NGO details successfully', async () => {
            const response = await request(app)
                .get(`/api/ngos/5`)
                .expect(200);

            expect(response.body).toMatchObject({
                ngo_id: 5,
                name: expect.any(String),
                description: expect.any(String),
                website_url: expect.any(String),
                contact_email: expect.any(String),

            });
        });

        it('returns 404 for non-existent NGO', async () => {
            const response = await request(app)
                .get('/api/ngos/9999')
                .expect(404);

            expect(response.body).toEqual({ error: 'NGO not found' });
        });

        it('returns 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/ngos/invalid_id')
                .expect(400);

            expect(response.body).toEqual({ error: 'Invalid NGO ID format' });
        });
    });

    afterAll(async () => {
        // clean up
        if (createdOpportunityId) {
            await db.promise().query(
                'DELETE FROM volunteering_opportunities WHERE opportunity_id = ?',
                [createdOpportunityId]
            );
        }
        await db.promise().query('INSERT INTO ngo_followers (ngo_id, user_id) VALUES (8, 271);');
        db.end();
    });
});
