"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicWarning = void 0;
var mongoose_1 = require("mongoose");
var academicWarningSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, required: true },
    value: { type: String, required: true },
    textColour: { type: String },
    orderNo: { type: Number },
    warning_type: { type: String },
    is_resolved: { type: Boolean, default: false },
    resolved_at: { type: Date },
}, {
    timestamps: {
        createdAt: 'issued_at',
        updatedAt: 'updated_at',
    },
});
exports.AcademicWarning = (0, mongoose_1.model)('AcademicWarning', academicWarningSchema);
exports.default = exports.AcademicWarning;
