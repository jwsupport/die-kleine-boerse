import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import listingsRouter from "./listings";
import messagesRouter from "./messages";
import statsRouter from "./stats";
import ratingsRouter from "./ratings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(listingsRouter);
router.use(messagesRouter);
router.use(statsRouter);
router.use(ratingsRouter);
router.use(adminRouter);

export default router;
