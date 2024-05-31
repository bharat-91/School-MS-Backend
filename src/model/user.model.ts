import mongoose from "mongoose";
import { IUsers } from "../interface";
import bcrypt from 'bcrypt'
export const userSchema = new mongoose.Schema<IUsers>({
  firstName: {
    type: String,
    required: [true, "Please enter the first name"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Please enter the last name"],
    trim: true
  },
  userName: {
    type: String,
    required: [true, "Please enter the username"],
    trim: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, "Please enter the email address"],
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    lowercase: true,
    unique: true
  },

  phoneNumber: {
    type: String,
    required: [true, "Please enter the phone number"],
    minlength: 10,
    maxlength: 15,
    match: /^[0-9]{10,15}$/,
    trim: true
  },
  dob: {
    type: Date,
    required: [true, "Please enter the date of birth"],
    validate: {
      validator: function (value: Date) {
        return value <= new Date();
      },
      message: "Please enter a valid date"
    },
    trim: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: [true, "Please enter the gender"]
  },
  address: {
    type: String,
    required: [true, "Please enter the address"],
    trim: true,
    maxlength: 100
  },
  profilePic: {
    type: String,
    required:[true, "Please Provide Profile Picture"]
  },
  role: {
    type: String,
    enum: ["Student", "Teacher", "Principal"],
    required: [true, "Please enter the role"]
  },
  password:{
    type:String,
    minlength:5,
    maxlength:15,
    required:[true,"Please Enter Password"]
  },
  token:{
    type:String,
    default: ''
  }
});


userSchema.pre('save', async function(next){
  if(!this.isModified){
    return next()
  }
  try{
    const encPassword = await bcrypt.hash(this.password, 10)
    this.password = encPassword
    next()
  }catch(error:any){
    next(error )
  }
})

const User = mongoose.model<IUsers>("User", userSchema);

export default User;
