import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '@/shared/middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', AuthController.login);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 */

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', AuthController.logout);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
 */

/**
 * @route   POST /api/auth/password-reset/request
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password-reset/request', AuthController.requestPasswordReset);

/**
 * @route   POST /api/auth/password-reset/confirm
 * @desc    Confirm password reset with token
 * @access  Public
 */
router.post('/password-reset/confirm', AuthController.confirmPasswordReset);

/**
 * @route   POST /api/auth/otp/request
 * @desc    Request OTP for password reset / new account creation
 * @access  Public
 */
router.post('/otp/request', AuthController.requestOtp);

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/otp/verify', AuthController.verifyOtp);

/**
 * @route   POST /api/auth/otp/set-password
 * @desc    Set password after OTP verification
 * @access  Public
 */
router.post('/otp/set-password', AuthController.setPasswordWithOtp);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email exists
 * @access  Public
 */
router.post('/check-email', AuthController.checkEmail);

/**
 * @route   POST /api/auth/password/change
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/password/change', authenticate, AuthController.changePassword);

/**
 * @route   POST /api/auth/mfa/setup
 * @desc    Setup MFA for user
 * @access  Private
 */
router.post('/mfa/setup', authenticate, AuthController.setupMfa);

/**
 * @route   POST /api/auth/mfa/verify
 * @desc    Verify and enable MFA
 * @access  Private
 */
router.post('/mfa/verify', authenticate, AuthController.verifyMfa);

/**
 * @route   POST /api/auth/mfa/disable
 * @desc    Disable MFA
 * @access  Private
 */
router.post('/mfa/disable', authenticate, AuthController.disableMfa);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token', AuthController.verifyEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */

export default router;
