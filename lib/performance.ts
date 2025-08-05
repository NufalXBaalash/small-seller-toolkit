// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track component render time
  trackRenderTime(componentName: string, renderTime: number) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, [])
    }
    this.metrics.get(componentName)!.push(renderTime)
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    const key = `api_${endpoint}_${success ? 'success' : 'error'}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(duration)
  }

  // Get average render time for a component
  getAverageRenderTime(componentName: string): number {
    const times = this.metrics.get(componentName)
    if (!times || times.length === 0) return 0
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  // Get average API call time
  getAverageApiCallTime(endpoint: string, success: boolean = true): number {
    const key = `api_${endpoint}_${success ? 'success' : 'error'}`
    const times = this.metrics.get(key)
    if (!times || times.length === 0) return 0
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear()
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics)
  }
}

// React performance hook
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now()

  return () => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    PerformanceMonitor.getInstance().trackRenderTime(componentName, renderTime)
  }
}

// API performance tracking
export async function trackApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const duration = performance.now() - startTime
    PerformanceMonitor.getInstance().trackApiCall(endpoint, duration, true)
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    PerformanceMonitor.getInstance().trackApiCall(endpoint, duration, false)
    throw error
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memory usage tracking
export function trackMemoryUsage(label: string) {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    console.log(`${label} Memory Usage:`, {
      used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100 + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100 + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100 + ' MB',
    })
  }
}

// Component render optimization
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    const trackRender = usePerformanceTracking(componentName)
    
    React.useEffect(() => {
      trackRender()
    })
    
    return <Component {...props} />
  })
} 