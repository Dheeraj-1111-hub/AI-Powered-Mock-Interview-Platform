import { Router } from 'express';
import * as ResumeController from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx' && ext !== '.txt') {
      return cb(new Error('Only PDF, DOCX and TXT files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.use(authMiddleware);

// Wrapper to catch Multer errors gracefully
const uploadMiddleware = (req: any, res: any, next: any) => {
  const uploadSingle = upload.single('resume');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/analyze', uploadMiddleware, ResumeController.analyzeResume);
router.get('/history', ResumeController.getHistory);
router.get('/latest', ResumeController.getLatest);

export default router;
