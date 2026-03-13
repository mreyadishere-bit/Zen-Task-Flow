import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/tasks", tasksRouter);
router.use("/categories", categoriesRouter);

export default router;
