import { Container } from 'inversify'
import 'reflect-metadata'
import { departmentController, feesController, markController, userController } from './controller/index'
import { TYPES } from './types/TYPES'
import { departmentService, feeService, markService, userService } from './service/index'


let container = new Container()


container.bind<userController>(TYPES.userController).to(userController)
container.bind<markController>(TYPES.markController).to(markController)
container.bind<departmentController>(TYPES.departmentController).to(departmentController)
container.bind<feesController>(TYPES.feesController).to(feesController)

container.bind<userService>(TYPES.userService).to(userService)
container.bind<markService>(TYPES.markService).to(markService)
container.bind<departmentService>(TYPES.departmentService).to(departmentService)
container.bind<feeService>(TYPES.feeService).to(feeService)

export default container