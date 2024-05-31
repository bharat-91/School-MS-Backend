import mongoose, { Schema, Document } from "mongoose";
import { IMarks } from "../interface";
import { ErrorHandling } from "../helper/error.helper";
import { Department } from "./department.model";

const errorObj = new ErrorHandling();

const marksSchema = new Schema<IMarks>({
    totalMarks: {
        type: Number,
        required: [true, "Please provide the total marks of the student"],
        min: [0, "Total marks cannot be less than 0"]
    },
    obtainMarks: {
        type: Number,
        required: [true, "Please provide the obtained marks of the student"],
        min: [0, "Obtained marks cannot be less than 0"]
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Student ID is required"]
    },
    studentName: {
        type: String,
        trim: true
    },
    percentage: {
        type: Number,
        min: [0, "Percentage cannot be less than 0"],
        max: [100, "Percentage cannot be more than 100"],
        validate: {
            validator: function (this: IMarks) {
                return this.percentage === (this.obtainMarks / this.totalMarks) * 100;
            },
            message: "Percentage must be calculated as (obtainMarks / totalMarks) * 100"
        }
    },
    grade: {
        type: String,
        required: [true, "Please enter the grade of the student"]
    },
    rank: {
        type: String,
        trim: true,
        default: '' 
    },
    status: {
        type: String,
        enum: ["Pass", "Fail"],
        required: [true, "Please enter the status of the student"]
    },
    departmentName:{
        type:String,
        trim:true,
        required: [true, "Department name is required"]
    }
}, {
    timestamps: true
});

marksSchema.pre<IMarks>('save', async function(next) {
    try {
        const obtainMarks = this.obtainMarks;
        const totalMarks = this.totalMarks;

        if (totalMarks <= 0) {
            throw new Error("Total marks must be greater than 0.");
        }

        if (obtainMarks < 0) {
            throw new Error("Obtained marks cannot be less than 0.");
        }

        if (totalMarks < obtainMarks) {
            throw new Error("Obtained marks cannot be greater than total marks.");
        }

        const percentage = (obtainMarks / totalMarks) * 100;

        if (percentage < 0 || percentage > 100) {
            throw new Error("Percentage must be between 0 and 100.");
        }

        this.percentage = parseFloat(percentage.toFixed(2));
        
        next();
    } catch (error:any) {
        next(error);
    }
});

export const Marks = mongoose.model<IMarks>("Marks", marksSchema);