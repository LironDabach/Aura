import { Request, Response } from "express";

class BaseController {
  model: any;

  constructor(model: any) {
    this.model = model;
  }

  async getAll(req: Request, res: Response) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 200));

    try {
      if (req.query) {
        const filterData = await this.model.find(req.query);
        return res.json(filterData);
      } else {
        const data = await this.model.find();
        res.json(data);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't retrieve entities");
    }
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    console.log("Get by ID: " + id);
    try {
      const data = await this.model.findById(id);
      if (!data) {
        return res.status(404).send("Error: Not found");
      } else {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't retrieve Entity by ID");
    }
  }

  async create(req: Request, res: Response) {
    const postData = req.body;
    console.log(postData);
    try {
      const data = await this.model.create(postData);
      res.status(201).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't create post");
    }
  }

  async del(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const deletedData = await this.model.findByIdAndDelete(id);
      res.status(200).json(deletedData);
      console.log("delete data -----" + deletedData);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't delete post");
    }
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    const updatedData = req.body;
    try {
      const data = await this.model.findByIdAndUpdate(id, updatedData, {
        new: true,
      });
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: Can't update post");
    }
  }
}

export default BaseController;
