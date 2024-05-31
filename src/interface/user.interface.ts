interface IUsers  {
    firstName: string,
    lastName: string,
    userName: string,
    email:string,
    phoneNumber: string,
    dob:Date,
    gender:string,
    address:string,
    profilePic: string
    role:string,
    password:string,
    token?:string
}


export default IUsers