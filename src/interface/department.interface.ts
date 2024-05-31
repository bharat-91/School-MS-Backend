import mongoose from "mongoose"

export interface IStudent {
    studentId: mongoose.Types.ObjectId;
    studentUniqueNo: string;
}

interface IDepartment {
    departmentName: string,
    teacher:mongoose.Schema.Types.ObjectId[],
    students:IStudent[],
    subjects:string[]
}

export default IDepartment