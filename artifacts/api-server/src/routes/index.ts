import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import listingsRouter from "./listings";
import messagesRouter from "./messages";
import statsRouter from "./stats";
import ratingsRouter from "./ratings";
import adminRouter from "./admin";
import stripeRouter from "./stripe";
import notifyRouter from "./notify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(listingsRouter);
router.use(messagesRouter);
router.use(statsRouter);
router.use(ratingsRouter);
router.use(adminRouter);
router.use(stripeRouter);
router.use(notifyRouter);

export default router;
