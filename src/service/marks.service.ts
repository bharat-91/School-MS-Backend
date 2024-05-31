import { injectable } from "inversify";
import { IMarks } from "../interface";
import { Marks } from "../model/marks.model";

@injectable()
export class markService{
    async getUserData():Promise<IMarks[]>{
        const users = await Marks.find()
        return users
    }

    async uploadMarks(uploadMarks:any):Promise<void>{
        const UploadMarks = await Marks.create(uploadMarks)
    }
}