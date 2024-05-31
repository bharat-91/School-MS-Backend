import { feesController } from "../controller/fees.controller";
import { feeService } from "../service/fees.service";

export const TYPES = {

    userController:Symbol.for('userController'),
    markController:Symbol.for("markController"),
    departmentController:Symbol.for("departmentController"),
    feesController:Symbol.for("feesController"),

    markService:Symbol.for('markService'),
    userService:Symbol.for("userService"),
    departmentService:Symbol.for("departmentService"),
    feeService:Symbol.for("feeService")
}