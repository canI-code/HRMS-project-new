import { Router } from 'express';
import { documentController } from '../controllers/DocumentController';
import { authenticate } from '@/shared/middleware/auth';
import { checkPermission } from '@/shared/middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('documents', 'create'), documentController.createDocument.bind(documentController));

router.post(
  '/:documentId/versions',
  checkPermission('documents', 'update'),
  documentController.addVersion.bind(documentController)
);

router.patch(
  '/:documentId/access',
  checkPermission('documents', 'update'),
  documentController.updateAccess.bind(documentController)
);

router.patch(
  '/:documentId/archive',
  checkPermission('documents', 'delete'),
  documentController.archive.bind(documentController)
);

router.get('/', checkPermission('documents', 'read'), documentController.listDocuments.bind(documentController));
router.get('/:documentId', checkPermission('documents', 'read'), documentController.getDocument.bind(documentController));

export { router as documentRoutes };
