/**
 * @jest-environment node
 */

//to run coverage report: npx jest --coverage

const request = require('supertest');
const app     = require('../server');
const db      = require('../config/db');

const testUser = {
    email: `testUser@gmail.com`,
    password: '4444',
    username: 'testUser',
    type: 'user'
};
describe('User Profile tests', () => {
    let cookie;

    beforeAll(async () => {

        // Log in and grab cookie
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });
        expect(login.statusCode).toBe(200);
        cookie = login.headers['set-cookie'];
    });

    it('Unauthenticated GET /api/profile → 401', async () => {
        await request(app).get('/api/profile').expect(401);
    });

    it('Authenticated GET /api/profile -> 200 + correct user data', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        // 1) Top‐level returned structure
        expect(res.body).toEqual(
            expect.objectContaining({
                user: expect.objectContaining({
                    email: testUser.email,
                    type: testUser.type,
                    username: testUser.username,
                }),
                donations: expect.any(Array),
                followings: expect.any(Array),
                subscriptions: expect.any(Array),
            })
        );

        //Bc I keep testUser unchanged for test purposes in db I can compare exact fields returned
        // 2) Exact donations array
        expect(res.body.donations).toEqual([
            expect.objectContaining({
                ngo_name: 'Women Rising',
                amount: '10',
            }),
            expect.objectContaining({
                ngo_name: 'Water for All',
                amount: '15',
            }),
        ]);

        // 3) Exact subscriptions array
        expect(res.body.subscriptions).toEqual([
            expect.objectContaining({
                ngo_id: 7,
                ngo_name: 'Water for All',
                status: 'active',
                amount: '50',
            }),
            expect.objectContaining({
                ngo_id: 8,
                ngo_name: 'Women Rising',
                status: 'canceled',
                amount: '65',
            }),
        ]);
    });


    it('Valid POST /api/profile/image -> success message', async () => {
        const small = 'data:image/png;base64,AAA=';
        const res = await request(app)
            .post('/api/profile/image')
            .set('Cookie', cookie)
            .send({ imageBase64: small })
            .expect(200);

        expect(res.body.message).toMatch(/Profile image saved successfully/i);
    });


    it('DELETE /api/profile/unfollow -> success message', async () => {
        const res = await request(app)
            .delete('/api/profile/unfollow')
            .set('Cookie', cookie)
            .send({ ngoId: 1 })
            .expect(200);

        expect(res.body.message).toMatch(/unfollow/i);

    });

    it('DELETE /api/profile/unsubscribe actually removes subscription', async () => {
        const before = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);
        expect(before.body.subscriptions.some(s => s.ngo_id === 7)).toBe(true);

        // unsubscribe
        await request(app)
            .delete('/api/profile/unsubscribe')
            .set('Cookie', cookie)
            .send({ ngoId: 7 })
            .expect(200);

        // now fetch again
        const after = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        expect(after.body.subscriptions.some(s => s.ngo_id === 7 && s.status === 'canceled')).toBe(true);
    });

    afterAll(async () => {
        // clean up
        await db.promise().query('INSERT INTO ngo_followers (ngo_id, user_id) VALUES (1, 238);');
        await db.promise().query('UPDATE subscriptions SET status = \'active\' WHERE user_id = 238 AND ngo_id = 7;');
        db.end();
    });
});
