import statusCodes from "../utils/statusCode.Response";

export class ErrorHandling{
    getErrorMsg(error:any){
        if(error.name == "ValidationError"){
            return this.handleValidationError(error)
        }if(error.name == "CastError"){
            return "Invalid format of Id"
        }if(error.code == 11000){
            return "Email Address Already Exists"
        }if(error.message === "User with This student id Already Exists" ){
            return "User with This student id Already Exists"
        }
    }
private handleValidationError(error:any){
    let errorMessage = '';
    const errors = Object.values(error.errors);
    errors.forEach((err: any) => {
      errorMessage += err.message + ', ';
    });
    return errorMessage.slice(0, -2);
}
}

    

