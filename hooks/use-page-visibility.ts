import { useEffect, useRef, useCallback } from 'react'

export function useRefetchOnVisibility(refetchFunction: () => void | Promise<void>) {
  const isVisible = useRef(true)
  const isRefetching = useRef(false)

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && !isVisible.current) {
      isVisible.current = true
      // Only refetch if we're not already refetching
      if (!isRefetching.current) {
        isRefetching.current = true
        Promise.resolve(refetchFunction()).finally(() => {
          isRefetching.current = false
        })
      }
    } else if (document.visibilityState === 'hidden') {
      isVisible.current = false
    }
  }, [refetchFunction])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])
} 