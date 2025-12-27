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
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

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

export default router;
