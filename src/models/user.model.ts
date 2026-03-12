import { model, Schema } from "mongoose";

const completedCourseSchema = new Schema(
  {
    course_id: { type: String, required: true },
    course_name: { type: String, required: true },
    grade: { type: String, required: true },
  },
  { _id: false },
);

const studentDataSchema = new Schema(
  {
    completed_courses: {
      type: [completedCourseSchema],
      default: [],
    },
    gpa: {
      type: Number,
      default: 45.0,
      min: 45.0,
      max: 100.0,
    },
    warnings: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "supervisor"],
      required: true,
      default: "student",
    },

    student_data: {
      type: studentDataSchema,
      validate: {
        validator: function (value: any) {
          if (this.role === "student") {
            return value !== undefined;
          }
          if (this.role !== "student" && value !== undefined) {
            return false;
          }
          return true;
        },
        message:
          "Student data is required for users with the student role and should not be provided for non-student roles.",
      },
      default: undefined,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const UserModel = model("User", userSchema);
