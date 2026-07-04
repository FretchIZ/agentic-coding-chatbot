import { Request, Response } from 'express';

export class CourseController {
  async list(req: Request, res: Response): Promise<void> {
    res.json({ courses: [] });
  }

  async create(req: Request, res: Response): Promise<void> {
    const { title, description } = req.body;
    res.status(201).json({ course: { id: crypto.randomUUID(), title, description, createdAt: new Date() } });
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ course: { id, title: 'Sample Course', lessons: [] } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ course: { id, ...req.body } });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ message: `Course ${id} deleted` });
  }

  async getLessons(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    res.json({ courseId: id, lessons: [] });
  }
}