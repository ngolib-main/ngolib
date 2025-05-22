/**
 * @jest-environment node
 */

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const app     = require('../server');
const db      = require('../config/db');

const adminUser = {
    email:    'testAdmin@gmail.com',
    password: 'AdminPass123',
    username: 'testAdmin',
    type:     'admin'
};

const tagName = `testTag_${Date.now()}`;

describe('Admin API tests', () => {
    let cookie;
    let createdTagId;
    let subscriptionId;
    let originalStatus;
    let adminUserId;

    beforeAll(async () => {
        // 1) Seed a real admin user
        const hash = bcrypt.hashSync(adminUser.password, 8);
        await db.promise().query(
            `INSERT INTO users (email, pw_hash, username, type)
       VALUES (?, ?, ?, ?)`,
            [adminUser.email, hash, adminUser.username, adminUser.type]
        );
        // grab back the user_id
        const [[row]] = await db.promise().query(
            'SELECT user_id FROM users WHERE email = ?',
            [adminUser.email]
        );
        adminUserId = row.user_id;

        // also insert into admin table
        await db.promise().query(
            'INSERT INTO admin (user_id) VALUES (?)',
            [adminUserId]
        );

        // 2) Log in and grab session cookie
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: adminUser.email, password: adminUser.password });
        expect(login.statusCode).toBe(200);
        cookie = login.headers['set-cookie'];

        // 3) Prime subscriptionId + originalStatus for later tests
        const prof = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        expect(prof.body.allSubscriptions).toEqual(expect.any(Array));
        expect(prof.body.allSubscriptions.length).toBeGreaterThan(0);
        subscriptionId  = prof.body.allSubscriptions[0].subscription_id;
        originalStatus  = prof.body.allSubscriptions[0].status;
    });

    it('POST /api/admin/tag → 201 + new tag object', async () => {
        const res = await request(app)
            .post('/api/admin/tag')
            .set('Cookie', cookie)
            .send({ tag: tagName })
            .expect(201);

        expect(res.body).toEqual(
            expect.objectContaining({
                id: expect.any(Number),
                message: expect.any(String),
                success: true
            })
        );
        createdTagId = res.body.id;
    });

    it('POST /api/admin/tag duplicate → 409', async () => {
        await request(app)
            .post('/api/admin/tag')
            .set('Cookie', cookie)
            .send({ tag: tagName })
            .expect(409);
    });

    it('PUT /api/admin/subscriptions/:id/status toggles status', async () => {
        const newStatus = originalStatus === 'active' ? 'canceled' : 'active';

        const res = await request(app)
            .put(`/api/admin/subscriptions/${subscriptionId}/status`)
            .set('Cookie', cookie)
            .send({ status: newStatus })
            .expect(200);

        expect(res.body).toEqual({ message: 'Subscription status updated' });

        // verify by fetching profile again
        const profile = await request(app)
            .get('/api/profile')
            .set('Cookie', cookie)
            .expect(200);

        const updated = profile.body.allSubscriptions.find(
            s => s.subscription_id === subscriptionId
        );
        expect(updated.status).toBe(newStatus);
    });

    // it('POST /api/admin/delete-tag → 200 + removed', async () => {
    //     const res = await request(app)
    //         .post('/api/admin/delete-tag')
    //         .set('Cookie', cookie)
    //         .send({ tagId: createdTagId })
    //         .expect(200);
    //
    //         expect(res.body).toEqual(
    //             expect.objectContaining({
    //                 success: true,
    //                 message: expect.stringMatching(/deleted successfully/i)
    //         })
    //         );
    // });

    afterAll(async () => {
        // Restore original subscription status
        await db
            .promise()
            .query(
                'UPDATE subscriptions SET status = ? WHERE subscription_id = ?',
                [originalStatus, subscriptionId]
            );

        // Clean up the tag record we inserted back into tags (in case the duplicate‐insert logic in tests)
        if (createdTagId) {
            await db
                .promise()
                .query(
                    'DELETE FROM tags_cause WHERE tag_id = ?',
                    [createdTagId]
                );
        }

        // Remove our seeded admin user and its admin row
        if (adminUserId) {
            await db
                .promise()
                .query('DELETE FROM admin WHERE user_id = ?', [adminUserId]);
            await db
                .promise()
                .query('DELETE FROM users WHERE user_id = ?', [adminUserId]);
        }

        db.end();
    });
});
