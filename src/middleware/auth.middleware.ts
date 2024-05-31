import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../model/user.model';
import { userRoles } from '../enum/userRoles';

export default class authMiddleware {
    
    async authMiddlewares(req: any, res: Response, next: NextFunction) {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        try {
            const decoded = jwt.verify(token, 'Secret_key') as any; 
            console.log(decoded);
            
            req.user = decoded;
            next();
        } catch (error) {
            console.log('Invalid token:', error);
            return res.status(401).json({ error: "Invalid token" });
        }
    }

    async isStudent(req: any, res: Response, next: NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: "Access denied. No token provided." });
            }
            const decoded = jwt.verify(token, 'Secret_key'); 
            
            req.user = decoded;
            const user = await User.findById(req.user.userId)
            if(!user){
                res.status(404).json("User not Found")
            }

            if (user?.role === userRoles.STUDENT) {
                next();
            } else {
                return res.status(403).json({ error: "Access denied. User is not a student." });
            }
        } catch (error) {
            return res.status(403).json({ error: "Access denied. User is not a student." });
        }
    }

    async isTeacher(req: any, res: Response, next: NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: "Access denied. No token provided." });
            }
            const decoded = jwt.verify(token, 'Secret_key'); 
            
            req.user = decoded;
            const user = await User.findById(req.user.userId)
            if(!user){
                res.status(404).json("User not Found")
            }

            if (user?.role === userRoles.TEACHER) {
                next();
            } else {
                return res.status(403).json({ error: "Access denied. User is not a Teacher." });
            }
        } catch (error) {
            return res.status(403).json({ error: "Access denied. User is not a Teacher." });
        }
    }

    async isPrincipal(req: any, res: Response, next: NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: "Access denied. No token provided." });
            }
            const decoded = jwt.verify(token, 'Secret_key'); 
            
            req.user = decoded;
            const user = await User.findById(req.user.userId)
            if(!user){
                res.status(404).json("User not Found")
            }

            if (user?.role === userRoles.PRINCIPAL) {
                next();
            } else {
                return res.status(403).json({ error: "Access denied. User is not a Principal." });
            }
        } catch (error) {
            return res.status(403).json({ error: "Access denied. User is not a Principal." });
        }
    }
}
