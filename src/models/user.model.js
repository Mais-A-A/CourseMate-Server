"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var mongoose_1 = require("mongoose");
var completedCourseSchema = new mongoose_1.Schema({
    courseNo: { type: Number, required: true },
    courseArabicName: { type: String },
    academicYear: { type: Number },
    semesterNo: { type: Number },
    creditHours: { type: String },
    grade: { type: String, required: true },
    weight: { type: String, default: '' },
    caption: { type: String, default: '' },
}, { _id: false });
var supervisorSchema = new mongoose_1.Schema({
    supervisorNo: { type: Number },
    supervisorArabicName: { type: String },
    supervisorEmail: { type: String },
}, { _id: false });
var studentDataSchema = new mongoose_1.Schema({
    studentNo: { type: Number },
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
    academic_plan: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AcademicPlan',
        required: true,
    },
    supervisor: supervisorSchema,
    notifications: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Notification',
        },
    ],
}, { _id: false });
var userSchema = new mongoose_1.Schema({
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
        enum: ['student', 'admin', 'supervisor'],
        required: true,
        default: 'student',
    },
    student_data: {
        type: studentDataSchema,
        required: function () {
            return this.role === 'student';
        },
        validate: {
            validator: function (value) {
                if (this.role !== 'student' && value != null) {
                    return false;
                }
                return true;
            },
            message: 'student_data must not be provided for non-student users.',
        },
        default: null,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
exports.default = exports.User;
