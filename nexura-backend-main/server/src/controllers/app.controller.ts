import logger from "@/config/logger";
import { user } from "@/models/user.model";
import { INTERNAL_SERVER_ERROR, OK, CREATED, BAD_REQUEST } from "@/utils/status.utils";

export const home = async (req: GlobalRequest, res: GlobalResponse) => {
	res.send("hi!");
};

export const updateUsername = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { username }: { username: string } = req.body;

    const userToUpdate = await user.findById(req.id);

    if (!userToUpdate) {
      res.status(BAD_REQUEST).json({ error: "invalid user id" });
			return;
    }

    userToUpdate.username = username;
    await userToUpdate.save();

    res.status(OK).json({ message: "username updated!" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error updating username" });
  }
}

export const fetchUser = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const userFetched = await user.findById(req.id);

    if (!userFetched) {
      res.status(BAD_REQUEST).json({ error: "invalid user id" });
      return;
    }

    res.status(OK).json({ message: "user fetched!", user: userFetched });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching user data" });
  }
}
