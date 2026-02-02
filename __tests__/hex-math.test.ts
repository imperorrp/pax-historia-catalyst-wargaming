import { describe, it, expect } from 'vitest'
import { hexToPixel, pixelToHex, getHexCorners, hexDistance, HEX_SIZE, type AxialHex, type PixelPoint } from '../lib/grid-engine/hex-math'

describe('hex-math', () => {
  describe('hexToPixel', () => {
    it('should convert hex coordinates to pixel coordinates', () => {
      const result = hexToPixel({ q: 0, r: 0 })
      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('should handle positive hex coordinates', () => {
      const result = hexToPixel({ q: 1, r: 0 })
      expect(result.x).toBeCloseTo(51.96, 1)
      expect(result.y).toBe(0)
    })

    it('should handle negative hex coordinates', () => {
      const result = hexToPixel({ q: -1, r: 0 })
      expect(result.x).toBeCloseTo(-51.96, 1)
      expect(result.y).toBe(0)
    })

    it('should handle r coordinate', () => {
      const result = hexToPixel({ q: 0, r: 1 })
      expect(result.x).toBeCloseTo(25.98, 1)
      expect(result.y).toBe(45)
    })
  })

  describe('pixelToHex', () => {
    it('should convert pixel coordinates to hex coordinates', () => {
      const result = pixelToHex({ x: 0, y: 0 })
      expect(result).toEqual({ q: 0, r: 0 })
    })

    it('should round to nearest hex', () => {
      const result = pixelToHex({ x: 50, y: 50 })
      expect(result.q).toBeDefined()
      expect(result.r).toBeDefined()
      expect(typeof result.q).toBe('number')
      expect(typeof result.r).toBe('number')
    })

    it('should be inverse of hexToPixel', () => {
      const hex: AxialHex = { q: 2, r: 3 }
      const pixel = hexToPixel(hex)
      const roundTrip = pixelToHex(pixel)
      expect(roundTrip).toEqual(hex)
    })
  })

  describe('hexDistance', () => {
    it('should return 0 for same hex', () => {
      const distance = hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })
      expect(distance).toBe(0)
    })

    it('should calculate distance between adjacent hexes', () => {
      const distance = hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })
      expect(distance).toBe(1)
    })

    it('should calculate distance for diagonal movement', () => {
      const distance = hexDistance({ q: 0, r: 0 }, { q: 2, r: 2 })
      expect(distance).toBe(4)
    })

    it('should handle negative coordinates', () => {
      const distance = hexDistance({ q: -1, r: -1 }, { q: 1, r: 1 })
      expect(distance).toBe(4)
    })
  })

  describe('getHexCorners', () => {
    it('should return 6 corners for a hex', () => {
      const corners = getHexCorners({ x: 0, y: 0 })
      expect(corners).toHaveLength(6)
    })

    it('should return valid corner coordinates', () => {
      const corners = getHexCorners({ x: 0, y: 0 })
      corners.forEach((corner) => {
        expect(corner).toHaveProperty('x')
        expect(corner).toHaveProperty('y')
        expect(typeof corner.x).toBe('number')
        expect(typeof corner.y).toBe('number')
      })
    })

    it('should have all corners at HEX_SIZE radius from center', () => {
      const center: PixelPoint = { x: 100, y: 100 }
      const corners = getHexCorners(center)
      corners.forEach((corner) => {
        const distance = Math.sqrt(
          Math.pow(corner.x - center.x, 2) + Math.pow(corner.y - center.y, 2)
        )
        expect(distance).toBeCloseTo(HEX_SIZE, 1)
      })
    })

    it('should form a proper hexagon with 60° angles', () => {
      const corners = getHexCorners({ x: 0, y: 0 })
      expect(corners).toHaveLength(6)
      // First corner should be at -30° (pointy-top orientation)
      const firstAngle = Math.atan2(corners[0].y, corners[0].x) * (180 / Math.PI)
      expect(firstAngle).toBeCloseTo(-30, 0)
    })
  })
})
