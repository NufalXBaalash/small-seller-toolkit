import { useEffect, useState } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// Custom hook for smooth client-side navigation
export function useSmoothNavigation() {
  const [isNavigating, setIsNavigating] = useState(false)

  const navigate = (href: string) => {
    setIsNavigating(true)
    // Use a small delay to show the navigation state
    setTimeout(() => {
      window.location.href = href
    }, 50)
  }

  return { isNavigating, navigate }
}
