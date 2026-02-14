import { useCallback, useRef, useEffect } from 'react'

// Generic debounce hook
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

// Generic throttle hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastRunRef.current > delay) {
        callback(...args)
        lastRunRef.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args)
          lastRunRef.current = Date.now()
        }, delay - (now - lastRunRef.current))
      }
    },
    [callback, delay]
  )
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0)
  
  useEffect(() => {
    renderCountRef.current += 1
    console.log(`🔄 ${componentName} rendered ${renderCountRef.current} times`)
    
    // Log render time in development
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now()
      
      return () => {
        const end = performance.now()
        console.log(`⏱️ ${componentName} render took ${(end - start).toFixed(2)}ms`)
      }
    }
  })
  
  return {
    renderCount: renderCountRef.current,
  }
}

// Optimized event handler hook
export function useOptimizedEventHandler<T extends Event>(
  handler: (event: T) => void,
  options?: {
    throttle?: number
    debounce?: number
    preventDefault?: boolean
    stopPropagation?: boolean
  }
) {
  const { throttle, debounce, preventDefault, stopPropagation } = options || {}
  
  let optimizedHandler = handler
  
  if (throttle) {
    optimizedHandler = useThrottle(handler, throttle)
  } else if (debounce) {
    optimizedHandler = useDebounce(handler, debounce)
  }
  
  return useCallback((event: T) => {
    if (preventDefault) {
      event.preventDefault()
    }
    if (stopPropagation) {
      event.stopPropagation()
    }
    optimizedHandler(event)
  }, [optimizedHandler, preventDefault, stopPropagation])
}
