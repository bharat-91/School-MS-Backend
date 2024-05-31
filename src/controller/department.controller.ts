import { inject, injectable } from "inversify";
import { TYPES } from '../types/TYPES';
import { departmentService } from "../service";
import { ErrorHandling } from "../helper/error.helper";
import { controller, httpGet, httpPost, request, response } from 'inversify-express-utils';
import { Request, Response } from "express";
import { IDepartment } from "../interface";
import { Department, User } from "../model";
import authMiddleware from "../middleware/auth.middleware";
import mongoose, { PipelineStage } from "mongoose";
import { isValidSubject, isValidTeacher } from "../validations/validation.identity";
import { departmentRevenue, filterPipeline, getAllDepartmentsPipeline, searchDepartmentData } from "../utils/pipelines";
import statusCodes from '../utils/statusCode.Response';
import { generateRevenuePdf } from "../helper/revenue";
import { ObjectId } from "mongodb";
import { markService } from '../service/marks.service';

const errorObj = new ErrorHandling()
const auth = new authMiddleware()


interface StudentData {
    studentId: string;
    studentUniqueNo: string;
}

interface SubjectData {
    name: string;
    teacherId: mongoose.Schema.Types.ObjectId;
}


@controller('/department')
export class departmentController {
    constructor(@inject<departmentService>(TYPES.departmentService) private DepartmentService: departmentService) { }

    @httpGet('/search')
    async searchDepartments(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const pipeline = searchDepartmentData(req);
            const searchData = await Department.aggregate(pipeline).exec();

            res.status(statusCodes.SUCCESS.code).json({ message: statusCodes.SUCCESS.message, searchData });
            // res.send(pipeline)
        } catch (error: any) {
            console.log(error);

            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ message: statusCodes.INTERNAL_SERVER_ERROR.message, details: message });
        }
    }

    @httpGet('/getAllDepartment')
    async getAllDepartment(@request() req: Request, @response() res: Response): Promise<void> {
        try {

            const { page, limit, sort } = req.query;
            const pageNumber = parseInt(page as string) || 1;
            const pageLimit = parseInt(limit as string) || 10;
            const pageSort = (parseInt(sort as string) as 1 | -1) || 1;


            const pipeline = getAllDepartmentsPipeline({
                pageNumber,
                pageLimit,
                pageSort
            });
            const result = await Department.aggregate(pipeline).exec();

            if (!result || result.length === 0) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: statusCodes.NOT_FOUND.message });
            }

            const departments = result[0].data;
            const totalDocuments = result[0].metadata.totalDocuments;

            res.status(200).json({
                page: pageNumber,
                totalPages: Math.ceil(totalDocuments / pageLimit),
                totalDepartments: totalDocuments,
                departments,
            });
        } catch (error: any) {
            console.error(error);
            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ message: statusCodes.INTERNAL_SERVER_ERROR.message, details: message });
        }
    }

    @httpGet('/filterDepartment')
    async tryingFilter(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { departmentName, teacherName, subjectName, studentName } = req.query;

            const { page = 1, limit = 10, sort = 1 } = req.query; // Get query params

            const pageNumber = parseInt(page as string) || 1;
            const pageLimit = parseInt(limit as string) || 10;
            const pageSort = (parseInt(sort as string) as 1 | -1) || 1;



            const pipeline = await filterPipeline({
                departmentName: departmentName as string,
                teacherName: teacherName as string,
                subjectName: subjectName as string,
                studentName: studentName as string,
                pageNumber,
                pageLimit,
                pageSort
            });

            const filteredDepartment = await Department.aggregate(pipeline)
            res.status(statusCodes.SUCCESS.code).json({ message: statusCodes.SUCCESS.message, data: filteredDepartment })
        } catch (error) {
            console.log(error);

            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ message: statusCodes.INTERNAL_SERVER_ERROR.message, details: message });
        }
    }

    @httpGet('/getDepartmentRevenue')
    async getDepartmentRevenue(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { page, limit, sort, generatePdf, searchKeyword } = req.query;
    
            const pageNumber = parseInt(page as string) || 1;
            const pageLimit = parseInt(limit as string) || 10;
            const pageSort = (parseInt(sort as string) as 1 | -1) || 1;
    
            let getDepartmentRevenuePipeline = await departmentRevenue({
                pageNumber,
                pageLimit,
                pageSort
            });
    
            const addSearchStage = (pipeline: any[], searchKeyword: string): any[] => {
                const searchRegex = new RegExp(searchKeyword, 'i');
                const searchStage = {
                    $match: {
                        $or: [
                            { departmentName: { $regex: searchRegex } }
                        ]
                    }
                };
                pipeline.push(searchStage);
                return pipeline;
            };
            if (searchKeyword) {
                getDepartmentRevenuePipeline = addSearchStage(getDepartmentRevenuePipeline, searchKeyword as string);
            }
    
            const getDepartmentRevenue = await User.aggregate(getDepartmentRevenuePipeline);
            
            if (generatePdf && generatePdf.toString().toLowerCase() === 'y') {
                const pdfBytes = await generateRevenuePdf({ details: getDepartmentRevenue });
                res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(Buffer.from(pdfBytes));
                 
            } else {
                res.status(200).json({ message: "Department Revenue is ", details: getDepartmentRevenue });
            }
        } catch (error) {
            console.log(error);
            
            const message = errorObj.getErrorMsg(error);
            res.status(500).json({ message: "Internal Server Error", details: message });
        }
    }
    

    @httpPost('/addStudentToDepartment')
    async addStudentToDepartment(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { departmentId, studentId, studentUniqueNo }: {
                departmentId: string;
                studentId: string;
                studentUniqueNo: string;
            } = req.body;
    
            if (!departmentId || !studentId || !studentUniqueNo) {
                res.status(statusCodes.BAD_REQUEST.code).json({
                    error: 'Please provide departmentId, studentId, and studentUniqueNo'
                });
                return;
            }
    
            const departmentExists = await Department.findById(departmentId);
            if (!departmentExists) {
                res.status(statusCodes.NOT_FOUND.code).json({
                    error: 'Department not found'
                });
                return;
            }
    
            const studentExists = await Department.findOne({
                'students.studentId': studentId
            });
            if (studentExists) {
                res.status(statusCodes.BAD_REQUEST.code).json({
                    error: 'Student is already assigned to another department'
                });
                return;
            }
    
            const studentData:any = {
                // studentId: mongoose.Types.ObjectId(studentId),
                studentId:studentId,
                studentUniqueNo: studentUniqueNo
            };
    
            departmentExists.students.push(studentData);
            await departmentExists.save();
    
            res.status(statusCodes.SUCCESS.code).json({
                message: 'Student added to department successfully',
                department: departmentExists
            });
        } catch (error:any) {
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({
                error: statusCodes.INTERNAL_SERVER_ERROR.message,
                details: error.message
            });
        }
    }


    @httpGet('/:id')
    async getDepartmentData(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const department = await Department.findById(id)
                .populate('teacher', 'firstName lastName email')
                .populate('students.studentId', 'firstName lastName email')
                .populate('subjects.teacherId', 'firstName lastName email');

            if (!department) {
                res.status(statusCodes.NOT_FOUND.code).json({ message: statusCodes.NOT_FOUND.message });
            }

            res.status(statusCodes.SUCCESS.code).json({ message: statusCodes.SUCCESS.message, details: department });
        }
        catch (error: any) {

            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ message: statusCodes.INTERNAL_SERVER_ERROR.message, details: message });
        }
    }

    @httpPost('/createDepartment', auth.isPrincipal)
    async postDepartment(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const { departmentName, teacher, students, subjects }: {
                departmentName: string;
                teacher: string[];
                students: StudentData[];
                subjects: SubjectData[];
            } = req.body;

            const requiredFields = ["departmentName", "teacher", "students", "subjects"];
            const missingFields = requiredFields.filter(field => !req.body[field]);

            if (missingFields.length > 0) {
                res.status(statusCodes.NOT_FOUND.code).json({
                    error: `Please enter the missing fields: ${missingFields.join(", ")}`,
                });
            }

            if (!subjects.every((subject) => isValidSubject(subject.name))) {
                res.status(statusCodes.BAD_REQUEST.code).json({ error: "One or more subjects are invalid" });
            }

            const validityChecksTeacher = await Promise.all(teacher.map(isValidTeacher));

            if (!validityChecksTeacher.every(isValid => isValid)) {
                res.status(statusCodes.BAD_REQUEST.code).json({ message: "Teacher is Not Valid or id may be wrong" });
            }

            const existingStudents = await Promise.all(students.map(async (student) => {
                const existingStudent = await Department.findOne({
                    'students.studentId': student.studentId
                });
                return existingStudent;
            }));

            if (existingStudents.some(student => student !== null)) {
                res.status(statusCodes.BAD_REQUEST.code).json({ error: "One or more students are already assigned to another department" });
                return;
            }

            const departmentData = new Department({
                departmentName,
                teacher: teacher,
                students: students.map((student: StudentData) => ({
                    studentId: student.studentId,
                    studentUniqueNo: student.studentUniqueNo
                })),
                subjects: subjects.map((subject: SubjectData) => ({
                    name: subject.name,
                    teacherId: subject.teacherId
                }))
            });

            const department = await Department.create(departmentData);
            res.status(statusCodes.CREATED.code).json({ message: "Department created successfully", department: department });
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ error: statusCodes.INTERNAL_SERVER_ERROR.message, details: message });
        }
    }

    @httpGet('/getUser/:id')
    async getUser(@request() req: Request, @response() res: Response): Promise<void> {
        const { id } = req.params
        const user = await User.findById(id)
        res.send(user)
    }

}


