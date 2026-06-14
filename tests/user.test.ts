import { userService } from '../src/features/user/user.service.js'
import { describe, it, expect, beforeAll } from 'vitest'
import type { User, StudentData } from '../src/features/user/user.schemas.js'
import env from '../env.js'
import request from 'supertest'
import app from '../app.js'
if (env.USE_REAL !== 'true') {
  describe('User Model', () => {
    it('should create a new admin', async () => {
      const user: User = {
        name: 'Hasan Al-Saafin',
        email: 'hasan@gmail.com',
        password: '1234',
        role: 'admin',
      }
      const savedUser = await userService.createUser(user)
      expect(savedUser.name).toBe(user.name)
    })
    it('should not create an admin with student data', async () => {
      const user: User = {
        name: 'Hasan Al-Saafin',
        email: 'hasan2@gmail.com',
        password: '1234',
        role: 'admin',
      }
      const studentData: StudentData = {
        completed_courses: [
          {
            courseNo: 123,
            courseArabicName: 'Course 123',
            grade: 'A',
            weight: '',
            caption: '',
          },
        ],
        gpa: 90.0,
        academic_plan: '69b819c1376ba34dbc403585',
      }
      user.student_data = studentData
      await expect(userService.createUser(user)).rejects.toThrow()
    })
    it('should not create a supervisor with student data', async () => {
      const user: User = {
        name: 'Hasan Al-Saafin',
        email: 'hasan2@gmail.com',
        password: '1234',
        role: 'supervisor',
      }
      const studentData: StudentData = {
        completed_courses: [
          {
            courseNo: 123,
            courseArabicName: 'Course 123',
            grade: 'A',
            weight: '',
            caption: '',
          },
        ],
        gpa: 90.0,
        academic_plan: '69b819c1376ba34dbc403585',
      }
      user.student_data = studentData

      await expect(userService.createUser(user)).rejects.toThrow()
    })
    it('should not create a student without student_data', async () => {
      const user = {
        name: 'Hasan',
        email: `${Date.now()}@gmail.com`,
        password: '1234',
        role: 'student',
      }

      await expect(userService.createUser(user as any)).rejects.toThrow()
    })
    it('should not create a new user with an existing email', async () => {
      const user: User = {
        name: 'Hasan Al-Saafin',
        email: 'hasan@gmail.com',
        password: '1234',
        role: 'admin',
      }
      await expect(userService.createUser(user)).rejects.toThrow()
    })
    it('should get all users', async () => {
      const users = await userService.getAllUsers()
      expect(users.length).toBeGreaterThan(0)
    })
    it('should get a user by email', async () => {
      const user = await userService.getUserByEmail('hasan@gmail.com')
      expect(user).not.toBeNull()
      expect(user?.name).toBe('Hasan Al-Saafin')
    })

    it('should update a user', async () => {
      const user = await userService.getUserByEmail('hasan@gmail.com')
      const updatedUser = await userService.updateUser(user!._id.toString(), {
        name: 'Hasan Updated',
      })
      expect(updatedUser).not.toBeNull()
      expect(updatedUser?.name).toBe('Hasan Updated')
    })
    it('should not update a user by setting an existing email', async () => {
      const user1 = await userService.createUser({
        name: 'Hasan Al-Saafin',
        email: `hasan${Date.now()}@gmail.com`,
        password: '1234',
        role: 'admin',
      })
      const email = user1.email?.toString()
      const user2: any = await userService.createUser({
        name: 'Hasan Al-Saafin',
        email: `hasan${Date.now()}@gmail.com`,
        password: '1234',
        role: 'admin',
      })

      await expect(
        userService.updateUser(user2._id.toString(), {
          email: email!,
        }),
      ).rejects.toThrow()
    })
    it('should delete a user', async () => {
      const user1 = await userService.getUserByEmail('hasan@gmail.com')
      const deletedUser = await userService.deleteUser(user1!._id.toString())
      expect(deletedUser).not.toBeNull()
      const user = await userService.getUserById(user1!._id.toString())
      expect(user).toBeNull()
    })
  })
} else {
  describe('User Model Integration tests', () => {
    it('should get all users', async () => {
      const res = await request(app).get('/user')
      expect(res.status).toBe(200)
    })
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/user')
        .send({
          name: 'Hasan Al-Saafin',
          email: `hasan${Date.now()}@gmail.com`,
          password: '1234',
          role: 'admin',
        })
      expect(res.status).toBe(201)
    })
  })
}
