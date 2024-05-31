import mongoose, { Model } from "mongoose";
import { IFees } from "../interface";
import { paymentMode, paymentStatus } from "../enum/paymentMethods";

const feesSchema = new mongoose.Schema<IFees>({
    endDate: {
        type: Date,
        trim: true,
        required: true,
    },
    daysDelayed: {
        type: Number,
        required: true,
        default: 0,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentMode: {
        type: String,
        enum: Object.values(paymentMode),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(paymentStatus),
        default: "Pending",
    },
    amount: {
        type: Number,
        min: 0,
        required: true,
    },
    penalty: {
        type: Number,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
});

feesSchema.pre('save', function (next) {
    const currentDate = new Date();
    const endDate = new Date(this.endDate);
    let daysDelayed = 0;
    let penalty = 0;

    if (currentDate > endDate) {
        const diffTime = Math.abs(currentDate.getTime() - endDate.getTime());
        daysDelayed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysDelayed >= 3) {
            penalty = 1500;
        } else if (daysDelayed === 2) {
            penalty = 1000;
        } else if (daysDelayed === 1) {
            penalty = 500;
        }
    }

    this.daysDelayed = daysDelayed;
    this.penalty = penalty;
    this.amount += penalty;

    next();
});


export const Fees: Model<IFees> = mongoose.model<IFees>("Fees", feesSchema);
