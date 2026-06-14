import e from 'express'
import { parseModelResponseContent } from '../../../shared/utils/AIUtils.js'
import { classifyCourseByElegibility } from '../context.fetcher.js'
import { describe, it, expect } from 'vitest'

describe('parseModelResponseContent', () => {
  it('should return the string content if it is a string', () => {
    const response = 'This is a simple string response.'
    const result = parseModelResponseContent(response)
    expect(result).toBe(response)
  })
  it('should concatenate text from an array of strings and objects', () => {
    const response = [
      'This is the first part. ',
      { text: 'This is the second part. ' },
      'This is the third part.',
      { text: ' This is the fourth part.' },
    ]
    const expected =
      'This is the first part. This is the second part. This is the third part. This is the fourth part.'
    const result = parseModelResponseContent(response)
    expect(result).toBe(expected)
  })
  it('should return a default message if the array contains no valid text', () => {
    const response = [{ notText: 'This should be ignored.' }, 123, null]
    const result = parseModelResponseContent(response)
    expect(result).toBe('I could not generate a response.')
  })
  it('should return a default message if the array is empty', () => {
    const response: unknown[] = []
    const result = parseModelResponseContent(response)
    expect(result).toBe('I could not generate a response.')
  })
  it('should return a default message for an array of empty strings', () => {
    const result = parseModelResponseContent(['', '   ', ''])
    expect(result).toBe('I could not generate a response.')
  })
  it('should return a default message if the content is neither a string nor an array', () => {
    const response = { text: 'This is an object, not a string or array.' }
    const result = parseModelResponseContent(response)
    expect(result).toBe('I could not generate a response.')
  })
})
describe('classifyCourseByElegibility', () => {
  it('should classify courses based on eligibility criteria', () => {
    const remainingCourses = new Map<string, unknown>([
      ['course1', { preCourse: ['courseA'] }],
      ['course2', { preCourse: ['courseB'] }],
      ['course3', { preCourse: [] }],
      ['courseB', { preCourse: [] }],
    ])

    const { eligibleCourses, ineligibleCourses } =
      classifyCourseByElegibility(remainingCourses)

    expect(eligibleCourses.has('course1')).toBe(true)
    expect(eligibleCourses.has('course3')).toBe(true)
    expect(eligibleCourses.has('courseB')).toBe(true)

    expect(ineligibleCourses.has('course2')).toBe(true)

    expect(eligibleCourses.has('course2')).toBe(false)
    expect(ineligibleCourses.has('course1')).toBe(false)
  })
  it('should return empty maps for empty input', () => {
    const { eligibleCourses, ineligibleCourses } = classifyCourseByElegibility(
      new Map(),
    )

    expect(eligibleCourses.size).toBe(0)
    expect(ineligibleCourses.size).toBe(0)
  })
})
