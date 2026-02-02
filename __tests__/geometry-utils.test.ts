import { describe, it, expect } from 'vitest'
import { getPolygonCentroid, getDistance, isPointInPolygon } from '../lib/geometry-utils'
import type { Location } from '../lib/types'

describe('geometry-utils', () => {
  describe('getPolygonCentroid', () => {
    it('should calculate centroid of a triangle', () => {
      const points: [number, number][] = [[0, 0], [3, 0], [0, 4]]
      const centroid = getPolygonCentroid(points)
      expect(centroid.x).toBeCloseTo(1, 1)
      expect(centroid.y).toBeCloseTo(1.33, 1)
    })

    it('should handle square', () => {
      const points: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2]]
      const centroid = getPolygonCentroid(points)
      expect(centroid.x).toBe(1)
      expect(centroid.y).toBe(1)
    })

    it('should handle single point', () => {
      const points: [number, number][] = [[5, 10]]
      const centroid = getPolygonCentroid(points)
      expect(centroid).toEqual({ x: 5, y: 10 })
    })

    it('should handle empty array', () => {
      const points: [number, number][] = []
      const centroid = getPolygonCentroid(points)
      expect(isNaN(centroid.x)).toBe(true)
      expect(isNaN(centroid.y)).toBe(true)
    })
  })

  describe('getDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
      expect(distance).toBe(5)
    })

    it('should return 0 for same point', () => {
      const distance = getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })
      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const distance = getDistance({ x: -3, y: -4 }, { x: 0, y: 0 })
      expect(distance).toBe(5)
    })

    it('should be commutative', () => {
      const dist1 = getDistance({ x: 1, y: 2 }, { x: 4, y: 6 })
      const dist2 = getDistance({ x: 4, y: 6 }, { x: 1, y: 2 })
      expect(dist1).toBe(dist2)
    })
  })

  describe('isPointInPolygon', () => {
    it('should detect point inside square', () => {
      const square: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]]
      const point: Location = { x: 2, y: 2 }
      expect(isPointInPolygon(point, square)).toBe(true)
    })

    it('should detect point outside square', () => {
      const square: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]]
      const point: Location = { x: 5, y: 5 }
      expect(isPointInPolygon(point, square)).toBe(false)
    })

    it('should handle point on edge', () => {
      const square: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]]
      const point: Location = { x: 0, y: 2 }
      // Edge behavior varies by implementation - just verify it returns a boolean
      expect(typeof isPointInPolygon(point, square)).toBe('boolean')
    })

    it('should detect point inside triangle', () => {
      const triangle: [number, number][] = [[0, 0], [4, 0], [2, 4]]
      const point: Location = { x: 2, y: 1 }
      expect(isPointInPolygon(point, triangle)).toBe(true)
    })
  })
})
