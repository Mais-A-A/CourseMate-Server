import dotenv from "dotenv"

dotenv.config();

const mongoUsername=process.env.MONGO_USERNAME
const mongoPassword=process.env.MONGO_PASSWORD
const mongoCluster=process.env.MONGO_CLUSTER
const mongoDatabaseName=process.env.MONGO_DATABASE_NAME
const serverPort=process.env.SERVER_PORT || 3000

if (!mongoUsername || !mongoPassword || !mongoCluster || !mongoDatabaseName) {
  throw new Error("Missing MongoDB environment variables");
}

const mongoURL= `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}/${mongoDatabaseName}?retryWrites=true&w=majority`

// #TO-DO: handle different envs 
export const settings = {
  env: process.env.NODE_ENV || "development",
  mongoURL: mongoURL,
  serverPort: serverPort
};