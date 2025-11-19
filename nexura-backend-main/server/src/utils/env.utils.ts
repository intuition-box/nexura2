import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

export const port = process.env.PORT || "5600";
export const DB_URI = process.env.DB_URI as string;
export const environment = process.env.ENVIRONMENT as "development" | "production";
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const REFRESH_SECRET = process.env.REFRESH_SECRET as string;
export const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
export const REDIS_PORT = process.env.REDIS_PORT as unknown as number;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD as string;
