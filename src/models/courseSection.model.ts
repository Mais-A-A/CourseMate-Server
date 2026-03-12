import { Schema, model } from 'mongoose'

const courseSectionSchema = new Schema(
  {
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester_id: {type: String, required: true},
    instructor: { type: String, required: true}, // #TO-DO: Discuss --> this needs to be an id, we need an instructor collection
    class_days: [
      {
        type: String,
        enum: ['Sat','Sun','Mon','Tue','Wed','Thu'],
        required: true
      }
    ],
    start_time: { type: String, required: true }, // with format "HH:mm"
    end_time: { type: String, required: true }, // with format "HH:mm"
    classroom: {type: String, required: true},
    capacity: { type: Number, required: true}, 
    available_seats: {type: Number, required: true}
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

const CourseSection = model('CourseSection', courseSectionSchema)

export default CourseSection