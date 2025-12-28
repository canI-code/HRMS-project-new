import { Router } from 'express';
import { documentController } from '../controllers/DocumentController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('documents', 'create'), documentController.createDocument.bind(documentController));
/**
 * @openapi
 * /documents:
 *   post:
 *     summary: Create a new document
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Document created
 */

router.post(
  '/:documentId/versions',
  checkPermission('documents', 'update'),
  documentController.addVersion.bind(documentController)
);
/**
 * @openapi
 * /documents/{documentId}/versions:
 *   post:
 *     summary: Add a new version to document
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Document version created
 */

router.patch(
  '/:documentId/access',
  checkPermission('documents', 'update'),
  documentController.updateAccess.bind(documentController)
);
/**
 * @openapi
 * /documents/{documentId}/access:
 *   patch:
 *     summary: Update document access permissions
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Access permissions updated
 */

router.patch(
  '/:documentId/archive',
  checkPermission('documents', 'delete'),
  documentController.archive.bind(documentController)
);

router.patch(
  '/:documentId/unarchive',
  checkPermission('documents', 'update'),
  documentController.unarchive.bind(documentController)
);
/**
 * @openapi
 * /documents/{documentId}/archive:
 *   patch:
 *     summary: Archive a document
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document archived
 */

router.get(
  '/',
  checkPermission('documents', 'read', {
    getUserId: (req) => req.user?.userId,
  }),
  documentController.listDocuments.bind(documentController)
);
/**
 * @openapi
 * /documents:
 *   get:
 *     summary: List all documents
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get(
  '/:documentId',
  checkPermission('documents', 'read', {
    getUserId: (req) => req.user?.userId,
  }),
  documentController.getDocument.bind(documentController)
);
/**
 * @openapi
 * /documents/{documentId}:
 *   get:
 *     summary: Get document details
 *     tags: [documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 */

export { router as documentRoutes };
