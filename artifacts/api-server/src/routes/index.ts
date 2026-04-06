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
import favouritesRouter from "./favourites";
import aiRouter from "./ai";
import invoicesRouter from "./invoices";
import sponsoredAdsRouter from "./sponsored-ads";
import cryptoPaymentsRouter from "./crypto-payments";
import analyticsRouter from "./analytics";

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
router.use(favouritesRouter);
router.use(aiRouter);
router.use(invoicesRouter);
router.use(sponsoredAdsRouter);
router.use(cryptoPaymentsRouter);
router.use(analyticsRouter);

export default router;
