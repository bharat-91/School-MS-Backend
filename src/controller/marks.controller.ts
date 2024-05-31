import { controller, httpGet, httpPost, request, response } from "inversify-express-utils";
import authMiddleware from "../middleware/auth.middleware";
import { markService } from "../service";
import { Request, Response } from "express";
import { ErrorHandling } from "../helper/error.helper";
import { IDepartment, IMarks } from "../interface";
import User from "../model/user.model";
import { isValidStudent } from "../validations/validation.identity";
import { Department, Marks } from "../model";
import statusCodes, { responseStatus } from "../utils/statusCode.Response";
import { generateMarksPDF } from "../helper/marksPdf.helper";
import { ObjectId } from 'mongodb';
import mongoose from "mongoose";
import { departmentToppersPipeline, universityToppersPipeline } from "../utils/pipelines";

const auth = new authMiddleware()
const errorObj = new ErrorHandling()

@controller('/marks')

export class markController {
    private MarkService: markService;
    constructor() {
        this.MarkService = new markService();
    }

    @httpGet('/', auth.isTeacher)
    async getAllUser(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const users = await this.MarkService.getUserData();
            res.status(200).json({ message: "Fetched Details:- ", users });
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res
                .status(500)
                .json({ error: "Error while Fetching user Data", details: message });
        }
    }

    @httpPost('/uploadMarks', auth.isTeacher)
    async uploadMarks(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { status, rank, grade, studentId, percentage, obtainMarks, totalMarks, departmentName } = req.body;

            const requiredFields = ["status", "rank", "grade", "studentId", "departmentName", "obtainMarks", "totalMarks"];
            const missingFields = requiredFields.filter(field => !req.body[field]);

            if (missingFields.length > 0) {
                res.status(400).json({
                    error: `Please provide all required fields: ${missingFields.join(", ")}`,
                });
                return;
            }

            const departmentExists = await Department.findOne({ departmentName });

            if (!departmentExists) {
                res.status(404).json({ message: `Department with name '${departmentName}' does not exist.` });
                return;
            }

            const student = await User.findById(studentId);
            if (!student || student.role !== "Student") {
                res.status(404).json({ message: "Student Not Found" });
                return;
            }

            const existingMarks = await Marks.findOne({ studentId });
            if (existingMarks) {
                res.status(400).json({ message: "Marks already exist for this student. " });
                return;
            }

            const marksData = {
                status, rank, grade, studentId, studentName: student.userName, obtainMarks, totalMarks, departmentName
            };

            const uploadMarks = await this.MarkService.uploadMarks(marksData);
            res.status(200).json({ message: "Marks Uploaded Successfully", uploadMarks });
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            console.log(error);

            res.status(500).json({ error: "Error while uploading user marks", details: message });
        }
    }


    @httpGet('/generateMarkSheet/:studentId')
    async generateMarkSheet(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { studentId, generatePDF } = req.params;

            const student = await User.findById(studentId);
            if (!student) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: statusCodes.NOT_FOUND.message });
                return
            }

            const studentMarks = await Marks.findOne({ studentId });
            if (!studentMarks) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: "Marks not found for the student" });
                return
            }

            const department: IDepartment | null = await Department.findOne({ 'students.studentId': studentId });
            if (!department) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: "Department not found for the student" });
                return
            }

            const studentData = department.students.find((s: any) => s.studentId.toString() === studentId.toString());
            if (!studentData) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: "Student data not found in department" });
                return
            }


            const studentInfo = {
                firstName: student.firstName,
                lastName: student.lastName,
                dob: student.dob,
                studentUniqueNo: studentData.studentUniqueNo,
            };

            const departmentInfo = {
                department: department.departmentName,
            }

            const marksDetails: IMarks = {
                grade: studentMarks.grade || "N/A",
                rank: studentMarks.rank || "N/A",
                status: studentMarks.status || "N/A",
                departmentName: studentMarks.departmentName || "N/A",
                studentId: studentMarks.studentId,
                totalMarks: studentMarks.totalMarks || 0,
                obtainMarks: studentMarks.obtainMarks || 0,
                percentage: studentMarks.percentage || 0,
            };


            const pdfBytes = await generateMarksPDF(marksDetails, studentInfo, departmentInfo);
            res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.pdf');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(pdfBytes));

        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ message });
        }
    }

    @httpGet('/getToppers')
    async getToppers(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { departmentName, top, page, limit, sort, topperType } = req.query;
    
            const departmentNameStr = departmentName as string || '';
            const pageNumber = parseInt(page as string) || 1;
            const pageLimit = parseInt(limit as string) || 10;
            const pageSort = parseInt(sort as string) || 1;
            const topStudent = parseInt(top as string) || 1;
            const type = topperType as string || 'department'; // Default to department topper
    
            let pipeline;
    
            if (type === 'department') {
                pipeline = departmentToppersPipeline(departmentNameStr, topStudent, pageNumber, pageLimit, pageSort);
            } else if (type === 'university') {
                pipeline = universityToppersPipeline(topStudent, pageNumber, pageLimit, pageSort);
            } else {
                throw new Error('Invalid topperType. Allowed values are "department" or "university".');
            }
    
            // Aggregate using the pipeline
            const [toppers] = await Marks.aggregate(pipeline);
    
            res.json(toppers);
    
        } catch (error:any) {
            const message = error.message || 'Internal Server Error';
            res.status(500).json({ message });
        }
    }
    

}