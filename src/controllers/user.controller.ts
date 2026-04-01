import { userService } from '../services/user.service.js'
import type { Request, Response } from 'express'

class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers()
      res.status(200).json(users)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error })
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.id
      const user = await userService.getUserById(userId as string)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json(user)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error })
    }
  }
  async getUserByEmail(req: Request, res: Response) {
    try {
      const email = req.query.email as string
      const user = await userService.getUserByEmail(email)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json(user)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error })
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const userData = req.body
      const newUser = await userService.createUser(userData)
      res.status(201).json(newUser)
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error })
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id
      const userData = req.body
      const updatedUser = await userService.updateUser(
        userId as string,
        userData,
      )
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json(updatedUser)
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error })
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id
      const deletedUser = await userService.deleteUser(userId as string)
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json({ message: 'User deleted successfully' })
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error })
    }
  }
}
export const userController = new UserController()
export default userController
