import { Router } from "express";
import { userService } from "../services/userService.js";
import { HttpError } from "../middleware/errorHandler.js";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.json(userService.list());
});

usersRouter.get("/:id", (req, res) => {
  const user = userService.get(req.params.id);
  if (!user) {
    throw new HttpError(404, `User ${req.params.id} not found`);
  }
  res.json(user);
});

usersRouter.post("/", (req, res) => {
  const { name, email } = req.body ?? {};
  if (typeof name !== "string" || typeof email !== "string") {
    throw new HttpError(400, "Both 'name' and 'email' are required strings");
  }
  const user = userService.create({ name, email });
  res.status(201).json(user);
});

usersRouter.delete("/:id", (req, res) => {
  const removed = userService.remove(req.params.id);
  if (!removed) {
    throw new HttpError(404, `User ${req.params.id} not found`);
  }
  res.status(204).send();
});
