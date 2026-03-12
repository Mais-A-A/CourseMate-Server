import { z } from 'zod'

export const DepartmentSchema = z.object({
  department_name: z.string(),
  dean_name: z.string(),
})
export type Department = z.infer<typeof DepartmentSchema>