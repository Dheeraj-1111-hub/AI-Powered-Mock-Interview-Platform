import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';

const aiBase = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

export const analyzeResume = async (req: Request, res: Response) => {
  const file = (req as any).files?.resume;
  if (!file || Array.isArray(file)) return res.status(400).json({ message: 'Resume upload required' });

  const form = new FormData();
  form.append('resume', file.data, file.name);

  const response = await axios.post(`${aiBase}/resume`, form, { headers: { ...form.getHeaders() } });
  res.json(response.data);
};

export const generateInterview = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/generate`, req.body);
  res.json(response.data);
};

export const evaluateAnswer = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/evaluate`, req.body);
  res.json(response.data);
};

export const reviewCode = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/review`, req.body);
  res.json(response.data);
};

export const generateChallenge = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/challenge`, req.body);
  res.json(response.data);
};

export const analyzeSkillGap = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/career/gap`, req.body);
  res.json(response.data);
};

export const generateRoadmap = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/career/roadmap`, req.body);
  res.json(response.data);
};

export const careerMentor = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/career/mentor`, req.body);
  res.json(response.data);
};

export const followUpQuestion = async (req: Request, res: Response) => {
  const response = await axios.post(`${aiBase}/follow-up`, req.body);
  res.json(response.data);
};
