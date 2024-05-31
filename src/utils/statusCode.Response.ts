const statusCodes = {
    SUCCESS: {
        code: 200,
        message: "Success"
    },
    CREATED: {
        code: 201,
        message: "Created Successfully"
    },
    BAD_REQUEST: {
        code: 400,
        message: "Bad Request"
    },
    UNAUTHORIZED: {
        code: 401,
        message: "Not Authorized to View this Content "
    },
    FORBIDDEN: {
        code: 403,
        message: "Access Forbidden"
    },
    NOT_FOUND: {
        code: 404,
        message: "Not Found "
    },
    INTERNAL_SERVER_ERROR: {
        code: 500,
        message: "Internal Server Error"
    },
    CONFLICT:{
        code: 409,
        message: "Please ensure to enter correct data"
    }

}


export const responseStatus={
    FAILED:"Failed",
    SUCCESS:"Success"
}


export default statusCodes