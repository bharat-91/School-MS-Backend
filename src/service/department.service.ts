import { injectable } from "inversify";
import { Department } from "../model/index";
import { IDepartment } from "../interface";


interface IDepartmentService {
    getDepartment(): Promise<IDepartment[]>
}

@injectable()
export class departmentService implements IDepartmentService {
    async getDepartment(): Promise<IDepartment[]> {
        const department = await Department.find()
        return department
    }

    async uploadDepartment(departmentData: IDepartment): Promise<void> {
        const UploadMarks = await Department.create(departmentData)
    }
}