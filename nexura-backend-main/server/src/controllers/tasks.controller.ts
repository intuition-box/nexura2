import logger from "@/config/logger";
import { campaign, campaignCompleted } from "@/models/campaign.model";
import { campaignTask, ecosystemTask, quest } from "@/models/tasks.model";
import { campaignTaskCompleted, ecosystemTaskCompleted, questCompleted } from "@/models/tasksCompleted.models";
import { user } from "@/models/user.model";
import { performIntuitionOnchainAction } from "@/utils/account";
import { INTERNAL_SERVER_ERROR, OK, BAD_REQUEST, FORBIDDEN, NOT_FOUND } from "@/utils/status.utils";
import { validateEcosystemTaskData, validateTaskData } from "@/utils/utils";

// todo: add ecosystem completed to eco tasks
export const fetchEcosystemDapps = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const ecosystemTasks = await ecosystemTask.find();

		res.status(OK).json({ message: "tasks fetched!", ecosystemTasks });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching tasks" });
	}
};

export const fetchQuests = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const allQuests = await quest.find();

		const oneTimeQuestsInDB = await allQuests.filter((quest) => quest.category === "one-time");

		const oneTimeQuestsCompleted = await questCompleted.find({ user: req.id });

		const oneTimeQuests: any[] = [];

		for (const oneTimeQuest of oneTimeQuestsInDB) {
			const oneTimeQuestCompleted = oneTimeQuestsCompleted.find(
				(completedQuest) => completedQuest.user === oneTimeQuest._id
			);

			const mergedQuest: Record<string, unknown> = { ...oneTimeQuest };

			if (oneTimeQuestCompleted) {
				mergedQuest.done = oneTimeQuestCompleted.done;
			} else {
				mergedQuest.done = false;
			}
			
			oneTimeQuests.push(mergedQuest);
		} 

		const dailyQuestsInDB = allQuests.filter((quest) => quest.category === "daily");
		const dailyQuestsCompleted = await questCompleted.find({ user: req.id });

		const dailyQuests: any[] = [];

		for (const dailyQuest of dailyQuestsInDB) {
			const dailyQuestCompleted = dailyQuestsCompleted.find(
				(completedQuest) => completedQuest.user === dailyQuest._id
			);

			const mergedQuest: Record<string, unknown> = { ...dailyQuest };

			if (dailyQuestCompleted) {
				mergedQuest.done = dailyQuestCompleted.done;
			} else {
				mergedQuest.done = false;
			}

			dailyQuests.push(mergedQuest);
		}

		res.status(OK).json({ message: "quests fetched!", oneTimeQuests, dailyQuests });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching quests" });
	}
}

export const fetchCampaignTasks = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
		const id = req.query.id as string;
		const userId = req.id!;

		const currentCampaign = await campaign.findById(id);
		if (!currentCampaign) {
			res.status(NOT_FOUND).json({ error: "id associated with campaign is invalid" });
			return;
		}

		const tasks = await campaignTask.find({ campaign: id });
		
		const campaignTasksCompleted = await campaignTaskCompleted.find({ user: userId, campaign: id });

		const completedCampaign = await campaignCompleted.findOne({ user: userId, campaign: id });

		const campaignTasks: any[] = [];

		for (const task of tasks) {
			const taskCompleted = campaignTasksCompleted.find(
				(completedCampaignTask) => completedCampaignTask.campaignTask === task._id
			);

			const mergedCampaignTask: Record<string, unknown> = { ...task }
			if (taskCompleted) {
				mergedCampaignTask.done = taskCompleted.done;
			} else {
				mergedCampaignTask.done = false;
			}

			campaignTasks.push(mergedCampaignTask);
		}

		if (currentCampaign.noOfTasks === campaignTasksCompleted.length) {
			completedCampaign!.tasksCompleted = true;

			await performIntuitionOnchainAction({
				action: "allow-claim",
				userId,
				contractAddress: currentCampaign.contractAddress!
			});

			await completedCampaign?.save();
		}

    res.status(OK).json({ message: "tasks fetched!", campaignTasks, campaignCompleted: completedCampaign });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching tasks for campaign" });
  }
}

export const createCampaignTasks = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { success } = validateTaskData(req.body);
		if (!success) {
      res.status(BAD_REQUEST).json({ error: "send the correct data required to create a campaign task" });
      return;
    }

		const campaignToUpdate = await campaign.findById(req.body.campaign);
		if (!campaignToUpdate) {
			res.status(BAD_REQUEST).json({ error: "id associated with campaign is invalid" });
      return;
		}

		await campaignTask.create(req.body);

		campaignToUpdate.noOfTasks += 1;
		await campaignToUpdate.save();

		res.status(OK).json({ message: "campaign task created!" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error creating campaign task" });
	}
}

// todo: link ecosystem task to project
export const createEcosystemTasks = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const { success } = validateEcosystemTaskData(req.body);
		if (!success) {
      res.status(BAD_REQUEST).json({ error: "send the correct data required to create an ecosystem task" });
      return;
    }

		await ecosystemTask.create(req.body);

		res.status(OK).json({ message: "campaign task created!" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error creating ecosystem task" });
	}
}

export const performCampaignTask = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const id = req.query.id;

		const campaignTaskk = await campaignTask.findById(id);
		if (!campaignTaskk) {
			res.status(NOT_FOUND).json({ error: "id associated with campaign task is invalid" });
      return;
		}

		const campaignDone = await campaignTaskCompleted.findOne({ user: req.id, campaignTask: id });
		if (!campaignDone) {
			// todo: validate task to be sure user performed it
			await campaignTaskCompleted.create({ done: true, user: req.id, campaigntask: id });

			res.status(OK).json({ error: "campaign task done!" });
      return;
		}

		res.status(FORBIDDEN).json({ error: "already performed this campaign task" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error performing campaign task" });
	}
}

export const claimQuest = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const id = req.query.id as string;

		if (!id) {
			res.status(BAD_REQUEST).json({ error: "send quest id" });
			return;
		}

		const questFound = await quest.findById(id);
		if (!questFound) {
			res
				.status(NOT_FOUND)
				.json({ error: "id associated with quest is invalid" });
			return;
		}

		const questUser = await user.findById(req.id);
		if (!questUser) {
			res.status(NOT_FOUND).json({ error: "invalid user" });
			return;
		}

		questUser.questsCompleted += 1;

		questUser.xp += questFound.reward?.xp as number;

		questUser.tTrustEarned += questFound.reward?.tTrust ?? 0;

		const category = questFound.category;
		if (category != "one-time") {
			await questCompleted.create({
				done: true,
				quest: id,
				user: questUser._id,
				category,
				expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
			});
		} else {
			await questCompleted.create({ done: true, quest: id, user: questUser._id, category });
		}

		res.status(OK).json({ message: "quest done!" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error claiming quest" });
	}
}

export const claimEcosystemTask = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const id = req.query.id;

		const userId = req.id;

		const ecosystemTaskUser = await user.findById(userId);
		if (!ecosystemTaskUser) {
			res.status(NOT_FOUND).json({ error: "id associated with user is invalid" });
			return;
		}

		const ecosystemTaskFound = await ecosystemTask.findById(id);
		if (!ecosystemTaskFound) {
			res.status(NOT_FOUND).json({ error: "id associated with ecosystem task is invalid" });
			return;
		}

		const ecosystemTaskToClaim = await ecosystemTaskCompleted.findOne({ user: userId, ecosystemTask: id });
		if (!ecosystemTaskToClaim) {
			res.status(FORBIDDEN).json({ error: "this operation cannot be performed" });
			return;
		}

		const now = new Date();

		if (now < ecosystemTaskToClaim.timer) {
			res.status(FORBIDDEN).json({ error: "this operation cannot be performed by the user until the required time is met" });
			return;
		}

		ecosystemTaskUser.xp += ecosystemTaskFound.rewards?.xp as number;
		ecosystemTaskUser.tTrustEarned += ecosystemTaskFound.rewards?.tTrust as number;

		ecosystemTaskToClaim.done = true;

		await ecosystemTaskToClaim.save();
		await ecosystemTaskUser.save();

		res.status(OK).json({ message: "error claiming ecosystem task" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error claiming ecosystem task" });
	}
}

export const setTimer = async (req: GlobalRequest, res: GlobalResponse) => {
	try {
		const id = req.query.id;

		const taskForEcosystem = await ecosystemTask.findById(id);
		if (!taskForEcosystem) {
			res.status(NOT_FOUND).json({ error: "invalid id associated with ecosystem task" });
			return;
		}

		const now = new Date();

		const timer = new Date(now.getTime() + (taskForEcosystem.timer * 60 * 1000));

		await ecosystemTaskCompleted.create({ done: false, timer, ecosystemTask: id, user: req.id });

		res.status(OK).json({ message: "timer set" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error setting timer" });
	}
}

// for tasks requiring input submission for validation before task completion
export const submitTask = async (req: GlobalRequest, res: GlobalResponse) => {
	try {

		res.status(OK).json({ message: "task submitted" });
	} catch (error) {
		logger.error(error);
		res.status(INTERNAL_SERVER_ERROR).json({ error: "error submitting task" });
	}
}

