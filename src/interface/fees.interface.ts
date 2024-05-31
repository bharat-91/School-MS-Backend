import mongoose from "mongoose";

export interface IFees {
  endDate: Date;
  daysDelayed: number;
  studentId: mongoose.Schema.Types.ObjectId;
  paymentMode: string;
  status: string;
  amount: number;
  penalty:number
}
