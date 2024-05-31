import mongoose from "mongoose";

export interface IMarks{
    totalMarks: number,
    obtainMarks: number,
    studentId: mongoose.Schema.Types.ObjectId,
    studentName?: string,
    percentage: number,
    grade:string,
    rank?:string,
    status:string,
    departmentName: string
}