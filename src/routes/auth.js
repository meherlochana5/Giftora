const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');
const { generateOTP } = require('../utils/otp');
const { sendEmail } = require('../utils/email');

const router = express.Router();


// =========================
// CREATE JWT TOKEN
// =========================

function tokenFor(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
}


// =========================
// CREATE AND SEND OTP
// =========================

async function createAndSendOTP(user, purpose) {

    const otp = generateOTP();

    const hash = await bcrypt.hash(otp, 10);

    await pool.query(
        'DELETE FROM otp_verifications WHERE user_id=? AND purpose=?',
        [user.id, purpose]
    );

    await pool.query(
        `INSERT INTO otp_verifications
        (user_id, otp_hash, purpose, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [user.id, hash, purpose]
    );

    await sendEmail(
        user.email,

        purpose === 'EMAIL_VERIFICATION'
            ? 'Giftora Email Verification OTP'
            : 'Giftora Password Reset OTP',

        `Your Giftora OTP is ${otp}. It expires in 10 minutes.`
    );
}


// =========================
// CUSTOMER REGISTER
// =========================

router.post('/register', async (req, res, next) => {

    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            password.length < 6
        ) {

            return res.status(400).json({
                message:
                    'Enter all fields. Password must be at least 6 characters.'
            });
        }


        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email=?',
            [email]
        );


        if (existing.length) {

            return res.status(409).json({
                message: 'Email already registered.'
            });
        }


        const passwordHash =
            await bcrypt.hash(password, 12);


        const [result] = await pool.query(
            `INSERT INTO users
            (name, email, phone, password_hash)
            VALUES (?, ?, ?, ?)`,
            [
                name,
                email,
                phone,
                passwordHash
            ]
        );


        const [rows] = await pool.query(
            'SELECT * FROM users WHERE id=?',
            [result.insertId]
        );


        await createAndSendOTP(
            rows[0],
            'EMAIL_VERIFICATION'
        );


        res.status(201).json({

            message:
                'Registration successful. Verify the OTP sent to your email.',

            userId:
                result.insertId

        });

    } catch (e) {

        next(e);

    }

});


// =========================
// VERIFY CUSTOMER EMAIL
// =========================

router.post('/verify-email', async (req, res, next) => {

    try {

        const {
            userId,
            otp
        } = req.body;


        const [rows] = await pool.query(
            `SELECT *
             FROM otp_verifications
             WHERE user_id=?
             AND purpose="EMAIL_VERIFICATION"
             AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [userId]
        );


        if (
            !rows.length ||
            !(await bcrypt.compare(
                otp,
                rows[0].otp_hash
            ))
        ) {

            return res.status(400).json({
                message: 'Invalid or expired OTP.'
            });
        }


        await pool.query(
            'UPDATE users SET is_verified=TRUE WHERE id=?',
            [userId]
        );


        await pool.query(
            `DELETE FROM otp_verifications
             WHERE user_id=?
             AND purpose="EMAIL_VERIFICATION"`,
            [userId]
        );


        res.json({
            message:
                'Email verified. You can now login.'
        });

    } catch (e) {

        next(e);

    }

});


// =========================
// CUSTOMER LOGIN
// =========================

router.post('/login', async (req, res, next) => {

    try {

        const {
            email,
            password
        } = req.body;


        const [rows] = await pool.query(
    'SELECT * FROM users WHERE email=? AND role="CUSTOMER"',
    [email]
);


        if (
            !rows.length ||
            !(await bcrypt.compare(
                password,
                rows[0].password_hash
            ))
        ) {

            return res.status(401).json({
                message:
                    'Invalid email or password.'
            });
        }


        if (!rows[0].is_verified) {

            return res.status(403).json({
                message:
                    'Please verify your email first.'
            });
        }


        const user = rows[0];


        res.json({

            token: tokenFor(user),

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });

    } catch (e) {

        next(e);

    }

});

// =========================
// ADMIN LOGIN
// =========================

router.post('/admin-login', async (req, res, next) => {

    try {

        const {
            email,
            password
        } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email=? AND role="ADMIN"',
            [email]
        );

        if (
            !rows.length ||
            !(await bcrypt.compare(
                password,
                rows[0].password_hash
            ))
        ) {
            return res.status(401).json({
                message: 'Invalid admin email or password.'
            });
        }

        const user = rows[0];

        res.json({
            token: tokenFor(user),

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (e) {
        next(e);
    }

});
// =========================
// ADMIN REGISTER
// =========================

router.post('/admin-register', async (req, res, next) => {

    try {

        const {
            name,
            email,
            phone,
            password,
            adminKey
        } = req.body;


        // Check all required fields
        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !adminKey
        ) {

            return res.status(400).json({
                message:
                    'Please fill all admin registration fields.'
            });
        }


        // Check password length
        if (password.length < 6) {

            return res.status(400).json({
                message:
                    'Password must be at least 6 characters.'
            });
        }


        // Check admin signup key
        if (
            adminKey !==
            process.env.ADMIN_SIGNUP_KEY
        ) {

            return res.status(403).json({
                message:
                    'Invalid admin signup key.'
            });
        }


        // Check whether email already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email=?',
            [email]
        );


        if (existing.length) {

            return res.status(409).json({
                message:
                    'Email already registered.'
            });
        }


        // Hash admin password
        const hash =
            await bcrypt.hash(password, 12);


        // Create admin account
        const [result] = await pool.query(
            `INSERT INTO users
            (name, email, phone, password_hash, role, is_verified)
            VALUES (?, ?, ?, ?, 'ADMIN', TRUE)`,
            [
                name,
                email,
                phone,
                hash
            ]
        );


        res.status(201).json({

            message:
                'Admin account created. Use the separate admin login.',

            adminId:
                result.insertId

        });

    } catch (e) {

        next(e);

    }

});


// =========================
// FORGOT PASSWORD
// =========================
router.post('/forgot-password', async (req, res, next) => {

    try {

        const { email } = req.body;

        // Check email format
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        // Find the account
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email=?',
            [email]
        );

        // Email does not exist
        if (!rows.length) {
            return res.status(404).json({
                message: 'No account found with this email address.'
            });
        }

        // ADMIN accounts cannot use customer forgot password
        if (rows[0].role !== 'CUSTOMER') {
            return res.status(403).json({
                message: 'This email belongs to an admin account. Please use Admin Forgot Password.'
            });
        }

        // Send OTP only to CUSTOMER accounts
        await createAndSendOTP(
            rows[0],
            'PASSWORD_RESET'
        );

        res.json({
            message: 'Password reset OTP sent to your email.',
            userId: rows[0].id
        });

    } catch (e) {
        next(e);
    }

});

// =========================
// RESET PASSWORD
// =========================
router.post('/reset-password', async (req, res, next) => {

    try {

        const {
            userId,
            otp,
            newPassword
        } = req.body;

        if (
            !newPassword ||
            newPassword.length < 6
        ) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters.'
            });
        }

        // Make sure this account is a CUSTOMER
        const [users] = await pool.query(
            'SELECT * FROM users WHERE id=?',
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({
                message: 'Account not found.'
            });
        }

        if (users[0].role !== 'CUSTOMER') {
            return res.status(403).json({
                message: 'Admin accounts cannot be reset through customer password recovery.'
            });
        }

        // Find valid password reset OTP
        const [rows] = await pool.query(
            `SELECT *
             FROM otp_verifications
             WHERE user_id=?
             AND purpose="PASSWORD_RESET"
             AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [userId]
        );

        if (
            !rows.length ||
            !(await bcrypt.compare(
                otp,
                rows[0].otp_hash
            ))
        ) {
            return res.status(400).json({
                message: 'Invalid or expired OTP.'
            });
        }

        // Hash new password
        const hash = await bcrypt.hash(
            newPassword,
            12
        );

        // Update customer password
        await pool.query(
            'UPDATE users SET password_hash=? WHERE id=?',
            [
                hash,
                userId
            ]
        );

        // Delete used OTP
        await pool.query(
            `DELETE FROM otp_verifications
             WHERE user_id=?
             AND purpose="PASSWORD_RESET"`,
            [userId]
        );

        res.json({
            message: 'Password reset successful.'
        });

    } catch (e) {
        next(e);
    }

});

module.exports = router;