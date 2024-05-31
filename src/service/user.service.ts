import { injectable } from 'inversify';
import IUsers from '../interface/user.interface';
import User from '../model/user.model';
@injectable()
export class userService {

    async getUserData():Promise<IUsers[]>{
        const users = await User.find()
        return users
    }

    async registerUser(userData: IUsers): Promise<IUsers[]> {
        const createdUser = await User.create(userData);
        return createdUser.toObject()
    }
}
