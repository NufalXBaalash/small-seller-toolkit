// Simple in-memory storage for OTP (replace with Redis in production)
interface OTPData {
  otp: string
  expiresAt: number
  attempts: number
}

class OTPStorage {
  private storage: Map<string, OTPData> = new Map()

  set(phoneNumber: string, otp: string, expirationMinutes = 5): void {
    this.storage.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + expirationMinutes * 60 * 1000,
      attempts: 0,
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
    return true
  }

  delete(phoneNumber: string): void {
    this.storage.delete(phoneNumber)
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
