"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRule = void 0;
var mongoose_1 = require("mongoose");
var academicRuleSchema = new mongoose_1.Schema({
    // I assumed that there is no need to represent the relationship between the academic rules and the admin because the rules are created and managed by the admin but they are not directly associated with a specific admin user.
    rule_type: { type: String, required: true },
    description: { type: String, required: true },
});
exports.AcademicRule = (0, mongoose_1.model)('AcademicRule', academicRuleSchema);
exports.default = exports.AcademicRule;
