import { app } from "./app";
import connectDB from "./utils/db";
import dotenv from "dotenv";
import { envVariables } from "./utils/env";
import z from "zod";
dotenv.config();

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);
  connectDB();
});
