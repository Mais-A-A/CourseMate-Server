"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var courseGradeSchema = new mongoose_1.Schema({
    gradeNGrade: { type: Number },
    gradeResultGrade: { type: String },
    courseTaken: { type: Number },
    gradeCGrade: { type: String },
}, { _id: false });
var courseInGroupSchema = new mongoose_1.Schema({
    courseNo: { type: Number, required: true },
    coursesArabicName: { type: String },
    coursesCreditHours: { type: Number },
    courseLevel: { type: Number },
    courseOrder: { type: Number },
    courseSemester: { type: Number, default: null },
    courseYear: { type: Number, default: null },
    preCourse: [{ type: Number }],
    courseGrades: [courseGradeSchema],
    alternativeNo: { type: String },
}, { _id: false });
var planLevelSchema = new mongoose_1.Schema({
    id: { type: Number },
    groupArabicName: { type: String },
    groupEnglishName: { type: String },
    requiredHours: { type: Number },
    groupCoursList: [courseInGroupSchema],
}, { _id: false });
var planGroupSchema = new mongoose_1.Schema({
    groupArabicName: { type: String },
    groupEnglishName: { type: String },
    groupNo: { type: Number },
    calcMajorAvg: { type: Boolean },
    requiredHours: { type: Number },
    passedHours: { type: Number },
    medicineCourses: { type: Boolean },
    planYear: { type: Number },
    majorNo: { type: Number },
    groupCoursList: [courseInGroupSchema],
}, { _id: false });
var academicPlanSchema = new mongoose_1.Schema({
    majorNo: { type: Number, required: true },
    planYear: { type: Number, required: true },
    majorArabicName: { type: String },
    groups: [planGroupSchema],
    levels: [planLevelSchema],
}, {
    timestamps: {
        createdAt: 'issued_at',
        updatedAt: 'updated_at',
    },
});
var AcademicPlan = (0, mongoose_1.model)('AcademicPlan', academicPlanSchema);
exports.default = AcademicPlan;
