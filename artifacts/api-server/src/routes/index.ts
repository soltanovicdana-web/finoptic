import { Router, type IRouter } from "express";
import healthRouter from "./health";
import finopsRouter from "./finops";

const router: IRouter = Router();

router.use(healthRouter);
router.use(finopsRouter);

export default router;
