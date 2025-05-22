/**
 * @jest-environment node
 */

/*
 * --- auth.test.js ---
 *
 *     -- TESTS --
 *
 *  -User creation
 *  -Fail "same user" creation (same email)
 *  -User fail login wrong password
 *  -User uses forgot password procedure
 *  -User correct login (user created in step 1)
 */

const request = require('supertest');
const app = require('../server'); // Adjust if the path is different
const db = require('../config/db');

// Use a unique email for each test run
const timestamp = Date.now();
const testUser = {
    email: `testuser${timestamp}@example.com`,
    password: 'Test123!',
    password_rep: 'Test123!'
};

describe('🔐 Auth Flow Integration Tests', () => {
    it('1️⃣ Should successfully register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(testUser);

        expect(res.statusCode).toBe(201); // Adjust if your code returns something else
        expect(res.body.message).toMatch(/User registered successfully/i);
    });

    it('2️⃣ Should fail to register the same user again', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(testUser);

        expect(res.statusCode).toBe(400); // Or whatever you return for duplicates
        expect(res.body.message).toMatch(/Email already in use/i);
    });

    it('3️⃣ Should fail to log in with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'WrongPassword123'
            });

        expect(res.statusCode).toBe(401); // Adjust to match your auth failure status
        expect(res.body.message).toMatch(/invalid/i);
    });

    it('4️⃣ Should trigger forgot password process', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testUser.email });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/Reset email sent/i); // adjust depending on your response
    });

    it('5️⃣ Should successfully log in with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/login successful/i);
    });



    it('6️⃣ Should successfully reset password with valid token', async () => {
        // Trigger forgot password
        const forgotRes = await request(app)
            .post('/api/auth/forgot-password')
            .send({email: testUser.email});

        expect(forgotRes.statusCode).toBe(200);

        console.log("Forgot res: ", forgotRes.body);
        // Query the database to get the token
        // This assumes you have a function to access your database
        const resetData = await getResetTokenFromDatabase(testUser.email);
        console.log("Reset data: ", resetData.user_id);
        expect(resetData).toBeDefined();
        expect(resetData.user_id).toBeDefined();

        const newPassword = 'NewTest123!';

        const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({
                userId: resetData.user_id,
                password: newPassword,
                password_rep: newPassword
            });

        expect(resetRes.statusCode).toBe(200);
        expect(resetRes.body.message).toMatch(/Password updated successfully/i);

        // Verify can login with new password
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: newPassword
            });

        expect(loginRes.statusCode).toBe(200);
        expect(loginRes.body.message).toMatch(/login successful/i);
    });

// Helper function to access the database (implement based on your DB setup)
    async function getResetTokenFromDatabase(email) {
        console.log("Getting reset token from database for email: ", email);
        const [rows] = await db.promise().query(
            //'SELECT token FROM reset_tokens WHERE user_id = (SELECT user_id FROM users WHERE email = ?) ORDER BY expiry DESC LIMIT 1',
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );
        console.log("Rows: ", rows);

        return rows && rows.length > 0 ? rows[0] : null;
    }


});
