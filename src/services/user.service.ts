import { User } from '../models/user.model.js'
import type { User as UserType } from '../schemas/user.schemas.js'
class UserService {
  async createUser(userData: UserType) {
    const existingUser = await User.findOne({ email: userData.email })

    if (existingUser) {
      throw new Error('Email already exists')
    }

    const user = new User(userData)
    return await user.save()
  }

  async getAllUsers() {
    return await User.find().lean().select('-password')
  }

  async getUserByEmail(email: string) {
    return await User.findOne({ email }).select('-password').lean()
  }

  async getUserBySupervisorEmail(supervisorEmail: string) {
    return await User.find({ 'student_data.supervisor.supervisorEmail': supervisorEmail })
      .select('-password')
      .lean()
  }

  async getUserById(id: string) {
    return await User.findById(id).select('-password').lean()
  }

  async updateUser(id: string, updateData: Partial<UserType>) {
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      })

      if (existingUser) {
        throw new Error('Email already in use')
      }
    }

    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
  }

  async deleteUser(id: string) {
    return await User.findByIdAndDelete(id)
  }
}

export const userService = new UserService()
export default userService
