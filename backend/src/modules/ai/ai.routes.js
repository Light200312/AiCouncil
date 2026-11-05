import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { suggestDomains ,suggestExperts} from "./ai.controller.js";
import { suggestDomainsSchema,suggestExpertsSchema } from "./ai.schema.js";

const router = Router();

router.post(
  "/suggest-domains",
  validate(suggestDomainsSchema),
  suggestDomains
);

router.post(
  "/suggest-experts",
  validate(suggestExpertsSchema),
  suggestExperts
);

export default router;