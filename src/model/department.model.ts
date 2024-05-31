import mongoose, { Model, mongo } from "mongoose";
import { IDepartment } from "../interface";
import ITAndCSSubjects from "../enum/subjects.enum";

export const departmentSchema = new mongoose.Schema<IDepartment>({
    departmentName: {
        type: String,
        required: [true, "Please enter the name of the Department"],
        trim: true,
        maxlength: 100,
    },

    teacher: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please Enter the Id of the Teacher"]
    }],
    students: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please Enter the Id of the Student"]
        },
        studentUniqueNo: {
            type: String,
            required: [true, "Please Enter the number of the student"]
        }
    }],
    subjects: [{
        name: {
            type: String,
            required: [true, "Please Enter the name of the subject"],
            enum:[ITAndCSSubjects, ITAndCSSubjects]
            
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Please enter the Id of teacher"]
        }
    }]
}, {
    timestamps: true
})

export const Department: Model<IDepartment> = mongoose.model<IDepartment>("Department", departmentSchema)  