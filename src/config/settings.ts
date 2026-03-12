import dotenv from "dotenv"
import env from "../../env.js";

dotenv.config();

const mongoUsername=env.MONGO_USERNAME
const mongoPassword=env.MONGO_PASSWORD
const mongoCluster=env.MONGO_CLUSTER
const mongoDatabaseName=env.MONGO_DATABASE_NAME
const serverPort=env.SERVER_PORT || 3000

if (!mongoUsername || !mongoPassword || !mongoCluster || !mongoDatabaseName) {
  throw new Error("Missing MongoDB environment variables");
}

const mongoURL= `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}/${mongoDatabaseName}?retryWrites=true&w=majority`

// #TO-DO: handle different envs --> almost done
export const settings = {
  env: env.NODE_ENV,
  mongoURL: mongoURL,
  serverPort: serverPort
};