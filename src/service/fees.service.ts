import { injectable } from "inversify";
import { Fees, User } from "../model";
import { IFees, IUsers } from "../interface";
import mongoose from "mongoose";
import { ErrorHandling } from "../helper/error.helper";
import { response , request } from "inversify-express-utils";
import { Request, Response } from "express";
import { generatePdf } from "../helper/pdf.helper";

const errorObj = new ErrorHandling()

 interface feesDetails  {
    endDate: Date;
    studentId?: mongoose.Types.ObjectId;
    paymentMode: String;
    status: String;
    amount: String;
}

@injectable()
export class feeService{
    async getFeesDetails():Promise<IFees[]>{
        try {
            const feesDetails = await Fees.find()
            return feesDetails
        } catch (error:any) {
            return error
        }
    }

    async createFeesDetails(feesDetails: feesDetails): Promise<void> {
        try {
            await Fees.create(feesDetails);
        } catch (error) {
            throw errorObj.getErrorMsg(error);
        }
    }

    async checkStudent(userId: string): Promise<IUsers | null> {
        try {
            const student = await User.findById(userId);
            return student;
        } catch (error) {
            throw errorObj.getErrorMsg(error);
        }
    }

    async getPdfDetails(userId: string): Promise<IFees | null> {
        try {
            const fees = await Fees.findOne({ studentId: userId });
            // console.log(fees);
            
            return fees;
        } catch (error) {
            throw errorObj.getErrorMsg(error);
        }
    }
} 