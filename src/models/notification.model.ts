import { Schema, model } from "mongoose";

// we could add some predefined set of types of the notification
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
const Notification = model("Notification", notificationSchema);
export default Notification;
