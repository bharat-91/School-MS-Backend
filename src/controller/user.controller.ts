import express, { Express, Request, Response } from "express";
import {
    controller,
    httpGet,
    httpPost,
    httpPut,
    request,
    response,
} from "inversify-express-utils";
import IUsers from "../interface/user.interface";
import upload from "../middleware/profilePic.middleware";
import { userService } from "../service/user.service";
import User from "../model/user.model";
import { ErrorHandling } from "../helper/error.helper";
import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcrypt";
import authMiddleware from "../middleware/auth.middleware";

const errorObj = new ErrorHandling();
const auth = new authMiddleware()
@controller("/users")
export class userController {
    private UserService: userService;

    constructor() {
        this.UserService = new userService();
    }

    @httpGet("/")
    async getAllUser(@request() req: Request, @response() res: Response) {
        try {
            const users = await this.UserService.getUserData();
            res.status(200).json({ message: "Fetched Details:- ", users });
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res
                .status(500)
                .json({ error: "Error while Fetching user Data", details: message });
        }
    }

    @httpPost("/register", upload.single("profilePic"))
    async registerUser(@request() req: Request, @response() res: Response) {
        try {
            let userData: IUsers;
            if (req.body.userData) {
                try {
                    userData = JSON.parse(req.body.userData);
                } catch (error) {
                    return res
                        .status(400)
                        .json({ error: "Invalid JSON format in userData" });
                }
            } else {
                const {
                    firstName,
                    lastName,
                    userName,
                    email,
                    phoneNumber,
                    dob,
                    address,
                    role,
                    gender,
                    password,
                } = req.body;

                const requiredFields = [
                    "firstName",
                    "lastName",
                    "userName",
                    "email",
                    "phoneNumber",
                    "dob",
                    "address",
                    "role",
                    "password",
                    "gender",
                ];
                const missingFields = requiredFields.filter(
                    (field) => !req.body[field]
                );

                if (missingFields.length > 0) {
                    return res
                        .status(400)
                        .json({
                            error: `Please enter the missing fields: ${missingFields.join(
                                ", "
                            )}`,
                        });
                }

                userData = {
                    firstName,
                    lastName,
                    userName,
                    email,
                    phoneNumber,
                    dob,
                    address,
                    role,
                    gender,
                    password,
                } as IUsers;
            }

            userData.profilePic = req.file
                ? req.file.path
                : "https://w0.peakpx.com/wallpaper/979/89/HD-wallpaper-purple-smile-design-eye-smily-profile-pic-face-thumbnail.jpg";

            const createdUser = await this.UserService.registerUser(userData);

            res.status(200).json({ message: "User Created", createdUser });
        } catch (error: any) {
            const message = errorObj.getErrorMsg(error);
            res
                .status(500)
                .json({ error: "Error while registering user", details: message });
        }
    }
    @httpPost("/login/:userId")
    async loginUser(@request() req: Request, @response() res: Response) {
      try {
        const {userId} = req.params
        const { userName, password } = req.body;
  
        if (!userName || !password || !userId) {
          return res.status(400).json("Please provide Username, Password, and User ID to login");
        }
  
        const user: IUsers | null = await User.findOne({ _id: userId, userName });
  
        if (!user) {
          return res.status(401).json({ message: "Invalid Username or User ID" });
        }
  
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          return res.status(400).json("Invalid Credentials");
        }
  
        const alreadyUser: IUsers | null = await User.findOne({
          _id: userId,
          userName,
          $expr: { $gt: [{ $strLenCP: "$token" }, 0] },
        });
  
        if (alreadyUser) {
          return res.status(200).json({ message: "User Already Logged in" });
        }
  
        const token = jwt.sign({ userId }, "Secret_key");
  
        const loggedInUser = await User.findOneAndUpdate(
          { _id: userId, userName },
          { $set: { token } },
          { new: true }
        );
  
        return res.status(200).json({ message: "Login Success!!", loggedInUser });
      } catch (error: any) {
        const message = errorObj.getErrorMsg(error);
        return res.status(500).json({ message: "Error While Logging in", details: message });
      }
    }

    @httpGet("/checkRole", auth.authMiddlewares)
    async getUserRole(@request() req: any, @response() res: Response) {
        try {
            const { userId } = req.user;
            const user = await User.findOne({ _id: userId  });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.status(200).json({ role: user.role });
        } catch (error: any) {
            const message = errorObj.getErrorMsg(error);
            return res
                .status(500)
                .json({ error: "Error fetching user role", details: message });
        }
    }

    @httpPut("/updateData/:id",auth.isStudent)
    async updateData(@request() req: Request, @response() res: Response) {
        try {
            const { id } = req.params;
            const updatedUserData = req.body;
            const updateUser = await User.findByIdAndUpdate(id, updatedUserData, {
                new: true,
                runValidators: true,
            });

            if (!updateUser) {
                res.status(404).json({ message: "User Not Found" });
            }
            res.status(200).json({ message: "User Updates", updateUser });
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            return res
                .status(500)
                .json({ error: "Error fetching user role", details: message });
        }
    }

    @httpPost('/uploadMarks', auth.isTeacher)
    async uploadMarks(@request() req: Request, @response() res: Response){
        try {
            
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            return res
                .status(500)
                .json({ error: "Error fetching user role", details: message });
        }
    }

    @httpPost('/logout/:id')
    async logoutUser(@request() req: Request, @response() res: Response){
        try {
            const {id} = req.params

            const userExists = await User.findById(id)
            if(!userExists){
                res.status(404).json({message:"User not Found"})
            }
            if(userExists?.token === ''){
                res.status(401).json({message:"User Already Logged out"})
            }
            const user = await User.findByIdAndUpdate(id, {
                $set: {token: ''}
            })
            res.status(200).json({message: "User Logged out Successfully", user})
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            return res
                .status(500)
                .json({ error: "Error fetching user role", details: message });
        }
    }

    @httpPost('/forgotPass/:id')
    async forgotPassword(@request() req:Request, @response() res:Response):Promise<void>{
        try {
            
        } catch (error) {
            const message = errorObj.getErrorMsg(error);
            res
                .status(500)
                .json({ error: "Error fetching user role", details: message });
        }
    }
}
