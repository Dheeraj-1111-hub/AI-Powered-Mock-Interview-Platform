import { Router } from 'express';
import * as ResumeController from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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

router.post('/analyze', upload.single('resume'), ResumeController.analyzeResume);
router.get('/history', ResumeController.getHistory);
router.get('/latest', ResumeController.getLatest);

export default router;
