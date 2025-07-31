import { useEffect, useRef, useCallback } from 'react'

export function usePageVisibility() {
  const isVisible = useRef(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible.current
}

export function useRefetchOnVisibility(refetch: () => void | Promise<void>) {
  const isVisible = usePageVisibility()
  const wasVisible = useRef(true)
  const refetchRef = useRef(refetch)

  // Update the refetch function reference
  refetchRef.current = refetch

  useEffect(() => {
    if (isVisible && !wasVisible.current) {
      // Page became visible again, refetch data
      // Add a small delay to ensure the page is fully visible
      const timeoutId = setTimeout(() => {
        refetchRef.current()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
    wasVisible.current = isVisible
  }, [isVisible])
} 