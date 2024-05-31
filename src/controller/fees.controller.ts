import { inject } from "inversify";
import { feeService } from "../service";
import { TYPES } from "../types/TYPES";
import { controller, httpGet, httpPost, request, response } from "inversify-express-utils";
import { Request, Response } from "express";
import { ErrorHandling } from "../helper/error.helper";
import statusCodes, { responseStatus } from "../utils/statusCode.Response";
import { Fees, User } from "../model"; 
import { generatePdf } from "../helper/pdf.helper";


const errorObj = new ErrorHandling()
@controller('/fees')
export class feesController {
    constructor(@inject<feeService>(TYPES.feeService) private FeeService: feeService) { }

    @httpGet('/getDetails')
    async getFeesDetails(@request() req: Request, @response() res: Response): Promise<void> {
        try {
            const feesDetails = await this.FeeService.getFeesDetails()
            res.status(200).json({ message: "Data fetched Successfully", feesDetails, responseStatus: responseStatus.SUCCESS })
            return
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ error: statusCodes.INTERNAL_SERVER_ERROR.message, details: message, responseStatus: responseStatus.FAILED });
        }
    }

    @httpPost('/createFees')
    async feesDetailsCreation(@request() req: Request, @response() res: Response): Promise<any> {
        try {
            const { endDate, studentId, paymentMode, status, amount } = req.body;

            const requiredFields = ["endDate", "studentId", "paymentMode", "status", "amount"];
            const missingFields = requiredFields.filter(field => !req.body[field]);

            if (missingFields.length > 0) {
                return res.status(statusCodes.BAD_REQUEST.code).json({
                    error: `Please enter the missing fields: ${missingFields.join(", ")}`,
                });
            }

            const student = await User.findOne({ _id: studentId, role: "Student" });
            if (!student) {
                return res.status(statusCodes.NOT_FOUND.code).json({ message: "Student " + statusCodes.NOT_FOUND.message });
            }

            const existingUser = await Fees.findOne({studentId: studentId}) 
            if(existingUser){
                throw new Error("User with This student id Already Exists")
            }
            const feesDetails = {
                endDate,
                studentId: student._id,
                paymentMode,
                status,
                amount,
            };

            await this.FeeService.createFeesDetails(feesDetails);
            res.status(statusCodes.CREATED.code).json({ message: statusCodes.CREATED.message ,responseStatus: responseStatus.SUCCESS});
        } catch (error:any) {
            if(error.message == "User with This student id Already Exists"){
                return res.status(statusCodes.CONFLICT.code).json({ error: error.message });
            }
            res.status(statusCodes.INTERNAL_SERVER_ERROR.code).json({ error: statusCodes.INTERNAL_SERVER_ERROR.message, details: error });
        }
    }
    @httpGet('/getPdf/:userId')
     async downloadPDF  (req: Request, res: Response){
        try {
            const { userId } = req.params;
            const student = await this.FeeService.checkStudent(userId);

            if (!student) {
                throw new Error('Student not found');
            }

            const filename = `fees-details-${student.userName}.pdf`;

            const feesDetails = await this.FeeService.getPdfDetails(userId);

            if (!feesDetails) {
                throw new Error('Fees details not found');
            }

            const pdfBytes = await generatePdf(student, feesDetails);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            res.send(Buffer.from(pdfBytes));

            res.on('finish', () => {
                console.log('PDF generated and sent successfully');
            });
        } catch (error:any) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
      };

}