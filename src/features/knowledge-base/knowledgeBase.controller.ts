import type { Request, Response } from 'express'
import { ingestDocument } from './knowledgeBase.service.js'
import { DocumentJob } from './documentJob.model.js'

async function processInBackground(jobId: string, fileBuffer: Buffer, filename: string) {
  try {
    await DocumentJob.findByIdAndUpdate(jobId, { status: 'processing' })
    const chunksCount = await ingestDocument(fileBuffer, filename)
    await DocumentJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      chunks: chunksCount,
      fileBuffer,
    })
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : String(error)
    await DocumentJob.findByIdAndUpdate(jobId, { status: 'failed', error: msg })
  }
}

export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ message: 'Only PDF files are allowed' })

    const job = await DocumentJob.create({ filename: req.file.originalname })

    setImmediate(() =>
      processInBackground(String(job._id), req.file!.buffer, req.file!.originalname),
    )

    return res.status(202).json({
      message: 'Document received, processing in background',
      jobId: job._id,
      filename: req.file.originalname,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: `Upload failed: ${msg}` })
  }
}

export async function getJobStatus(req: Request, res: Response) {
  try {
    const job = await DocumentJob.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    return res.status(200).json({
      jobId: job._id,
      filename: job.filename,
      status: job.status,
      chunks: job.chunks,
      error: job.error,
      created_at: job.get('created_at'),
      updated_at: job.get('updated_at'),
    })
  } catch {
    return res.status(500).json({ message: 'Failed to get job status' })
  }
}

export async function viewDocument(req: Request, res: Response) {
  try {
    const job = await DocumentJob.findById(req.params.id)
      .select('fileBuffer filename')
      .lean()
    if (!job) return res.status(404).json({ message: 'Document not found' })
    if (!job.fileBuffer) return res.status(404).json({ message: 'File not available' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${job.filename}"`)
    return res.send(job.fileBuffer)
  } catch {
    return res.status(500).json({ message: 'Failed to retrieve document' })
  }
}

export async function listDocuments(req: Request, res: Response) {
  try {
    const jobs = await DocumentJob.find({ status: 'completed' })
      .select('filename chunks created_at')
      .sort({ created_at: -1 })
      .lean()

    return res.status(200).json({ documents: jobs })
  } catch {
    return res.status(500).json({ message: 'Failed to list documents' })
  }
}
