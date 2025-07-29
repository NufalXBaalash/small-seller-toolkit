// Simple in-memory storage for OTP (replace with Redis in production)
interface OTPData {
  otp: string
  expiresAt: number
  attempts: number
  createdAt: number
}

class OTPStorage {
  private storage: Map<string, OTPData> = new Map()

  set(phoneNumber: string, otp: string, expirationMinutes = 5): void {
    const now = Date.now()
    this.storage.set(phoneNumber, {
      otp,
      expiresAt: now + expirationMinutes * 60 * 1000,
      attempts: 0,
      createdAt: now,
    })
  }

  get(phoneNumber: string): OTPData | null {
    const data = this.storage.get(phoneNumber)
    if (!data) return null

    // Check if expired
    if (Date.now() > data.expiresAt) {
      this.storage.delete(phoneNumber)
      return null
    }

    return data
  }

  incrementAttempts(phoneNumber: string): boolean {
    const data = this.storage.get(phoneNumber)
    if (!data) return false

    data.attempts += 1
    
    // Auto-delete if too many attempts
    if (data.attempts >= 3) {
      this.storage.delete(phoneNumber)
    }
    
    return true
  }

  delete(phoneNumber: string): void {
    this.storage.delete(phoneNumber)
  }

  // Get remaining time for an OTP
  getRemainingTime(phoneNumber: string): number {
    const data = this.get(phoneNumber)
    if (!data) return 0
    
    const remaining = data.expiresAt - Date.now()
    return Math.max(0, Math.ceil(remaining / 1000))
  }

  // Get remaining attempts for an OTP
  getRemainingAttempts(phoneNumber: string): number {
    const data = this.get(phoneNumber)
    if (!data) return 0
    
    return Math.max(0, 3 - data.attempts)
  }

  // Check if OTP is valid (not expired and not exceeded attempts)
  isValid(phoneNumber: string): boolean {
    const data = this.get(phoneNumber)
    if (!data) return false
    
    return data.attempts < 3
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [phoneNumber, data] of this.storage.entries()) {
      if (now > data.expiresAt) {
        this.storage.delete(phoneNumber)
      }
    }
  }

  // Get storage statistics (for debugging)
  getStats(): { total: number; expired: number; valid: number } {
    const now = Date.now()
    let total = 0
    let expired = 0
    let valid = 0

    for (const [_, data] of this.storage.entries()) {
      total++
      if (now > data.expiresAt) {
        expired++
      } else {
        valid++
      }
    }

    return { total, expired, valid }
  }
}

// Create a singleton instance
const otpStorage = new OTPStorage()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      otpStorage.cleanup()
    },
    5 * 60 * 1000,
  )
}

export default otpStorage
