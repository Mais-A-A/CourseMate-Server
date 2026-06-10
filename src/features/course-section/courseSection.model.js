"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseSection = void 0;
var mongoose_1 = require("mongoose");
var courseSectionSchema = new mongoose_1.Schema({
    acdYear: { type: Number, required: true },
    semesterNo: { type: Number, required: true },
    courseNo: { type: Number, required: true },
    courseName: { type: String, required: true },
    courseCredietHrs: { type: Number, required: true },
    sectionNo: { type: Number, required: true },
    labSectionNo: { type: Number, default: -1 },
    roomName: { type: String },
    buildingName: { type: String },
    supervisorName: { type: String },
    capacity: { type: Number },
    counter: { type: Number, default: 0 },
    majorNo: { type: Number },
    isOpen: { type: Boolean, default: true },
    packageCaption: { type: String },
    secTime: { type: String },
    collageArabicName: { type: String },
    majorArabicName: { type: String },
    lSectionNo: { type: String, default: '' },
}, {
    timestamps: {
        createdAt: 'issued_at',
        updatedAt: 'updated_at',
    },
});
exports.CourseSection = (0, mongoose_1.model)('CourseSection', courseSectionSchema);
exports.default = exports.CourseSection;
