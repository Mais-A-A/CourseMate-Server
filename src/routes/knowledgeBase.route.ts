import { Router } from 'express'
import multer from 'multer'
import {
  uploadDocument,
  getJobStatus,
  listDocuments,
  viewDocument,
} from '../controllers/knowledgeBase.controller.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

/**
 * @swagger
 * /knowledge-base/upload:
 *   post:
 *     tags:
 *       - Knowledge Base
 *     summary: Upload a PDF to the knowledge base (processed in background)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Document received, processing started in background
 *       400:
 *         description: No file uploaded or invalid file type
 *       500:
 *         description: Upload failed
 */
router.post('/upload', upload.single('file'), uploadDocument)

/**
 * @swagger
 * /knowledge-base/jobs/{jobId}:
 *   get:
 *     tags:
 *       - Knowledge Base
 *     summary: Check the status of a document processing job
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *       404:
 *         description: Job not found
 */
router.get('/jobs/:jobId', getJobStatus)

/**
 * @swagger
 * /knowledge-base/documents:
 *   get:
 *     tags:
 *       - Knowledge Base
 *     summary: List all successfully processed documents
 *     responses:
 *       200:
 *         description: List of successfully processed documents
 */
/**
 * @swagger
 * /knowledge-base/documents:
 *   get:
 *     tags:
 *       - Knowledge Base
 *     summary: List all successfully processed documents
 *     responses:
 *       200:
 *         description: List of successfully processed documents
 */
router.get('/documents', listDocuments)

/**
 * @swagger
 * /knowledge-base/documents/{id}/view:
 *   get:
 *     tags:
 *       - Knowledge Base
 *     summary: View a PDF document inline
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 */
router.get('/documents/:id/view', viewDocument)

export default router
