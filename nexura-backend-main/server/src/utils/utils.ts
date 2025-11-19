import jwt from "jsonwebtoken";
import { z } from "zod";
import { JWT_SECRET, REFRESH_SECRET } from "./env.utils";

export const validateCampaignData = (reqData: any) => {
  const campaignSchema = z.object({
    title: z.string().trim(),
    description: z.string().trim(),
    nameOfProject: z.string().trim(),
    startDate: z.string().trim(),
    endDate: z.string().trim(),
    reward: z.object({
      xp: z.number(),
      tTrust: z.number()
    }),
    totaltTrustAvailable: z.number(),
    contractAddress: z.string().optional()
  });

  const parseData = campaignSchema.safeParse(reqData);

  return parseData;
};

export const validateQuestData = (reqData: any) => {
  const questSchema = z.object({
    title: z.string().trim(),
    description: z.string().trim(),
    category: z.enum(["one-time", "daily"]),
    reward: z.object({
      xp: z.number(),
      tTrust: z.number()
    })
  });

  const parseData = questSchema.safeParse(reqData);

  return parseData;
};

export const validateTaskData = (reqData: any) => {
  const taskSchema = z.object({
    task: z.string().trim(),
    link: z.string().trim().optional(),
    campaign: z.string().trim(),
    xp: z.number(),
  });

  const parseData = taskSchema.safeParse(reqData);

  return parseData;
};

export const validateEcosystemTaskData = (reqData: any) => {
	const ecosystemSchema = z.object({
		title: z.string().trim(),
		description: z.string().trim(),
		timer: z.string().trim(),
		link: z.string().trim(),
		tags: z.enum([
			"defi",
			"lending-protocols",
			"prediction-markets",
			"nft",
			"social",
			"gaming",
			"portal",
			"domain-name",
			"launchpads",
		]),
		rewards: z.object({
			xp: z.number(),
			tTrust: z.number(),
		}),
	});

	const parseData = ecosystemSchema.safeParse(reqData);

	return parseData;
};

export const validateProjectData = (reqData: any) => {
  const projectSchema = z.object({
    name: z.string().trim(),
    email: z.email().trim(),
    logo: z.string().trim(),
  });

  const parseData = projectSchema.safeParse(reqData);

  return parseData;
}

export const JWT = {
  sign: (data: any) => {
    return jwt.sign(data, JWT_SECRET, { expiresIn: "1d" });
  },

  verify: (jwtToken: string) => {
    return new Promise((resolve, reject) => {
      jwt.verify(jwtToken, JWT_SECRET, (error, decodedText) => {
				if (error) reject(error.message);
				else if (typeof decodedText === "object") {
					resolve(decodedText);
				} else {
					reject("Invalid JWT payload");
				}
			});
    })
  }
}

export const getRefreshToken = (id: any) => {
  return jwt.sign({ id }, REFRESH_SECRET, { expiresIn: "30d" });
}
