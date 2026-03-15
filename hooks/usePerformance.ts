import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react'

interface PerformanceMetrics {
  fps: number
  renderTime: number
  memoryUsage: number
  elementCount: number
}

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

// Advanced performance monitoring with FPS tracking
export function useAdvancedPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    elementCount: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number>()

  const measureFPS = useCallback(() => {
    const now = performance.now()
    frameCountRef.current++
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      frameCountRef.current = 0
      lastTimeRef.current = now
      
      setMetrics(prev => ({ ...prev, fps }))
    }
    
    animationFrameRef.current = requestAnimationFrame(measureFPS)
  }, [])

  useEffect(() => {
    measureFPS()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [measureFPS])

  // Update memory usage periodically
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
        setMetrics(prev => ({ ...prev, memoryUsage: usedMB }))
      }
    }

    const interval = setInterval(updateMemoryUsage, 2000)
    return () => clearInterval(interval)
  }, [])

  return metrics
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  return {
    visibleItems,
    totalHeight,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    setScrollTop
  }
}

// Image lazy loading hook
export function useLazyLoading() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  const loadImage = useCallback((src: string) => {
    if (loadedImages.has(src) || loadingImages.has(src)) {
      return
    }

    setLoadingImages(prev => new Set(prev).add(src))

    const img = new Image()
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(src))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(src)
        return newSet
      })
    }
    img.onerror = () => {
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(src)
        return newSet
      })
    }
    img.src = src
  }, [loadedImages, loadingImages])

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src)
  }, [loadedImages])

  const isImageLoading = useCallback((src: string) => {
    return loadingImages.has(src)
  }, [loadingImages])

  return {
    loadImage,
    isImageLoaded,
    isImageLoading,
    loadedImages,
    loadingImages
  }
}

// Canvas optimization hook
export function useCanvasOptimization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const renderQueueRef = useRef<Array<() => void>>([])
  const isRenderingRef = useRef(false)

  const initializeOffscreenCanvas = useCallback(() => {
    if (!canvasRef.current) return

    try {
      offscreenCanvasRef.current = new OffscreenCanvas(
        canvasRef.current.width,
        canvasRef.current.height
      )
    } catch (error) {
      console.warn('OffscreenCanvas not supported:', error)
    }
  }, [])

  const queueRender = useCallback((renderFunction: () => void) => {
    renderQueueRef.current.push(renderFunction)
    
    if (!isRenderingRef.current) {
      processRenderQueue()
    }
  }, [])

  const processRenderQueue = useCallback(() => {
    if (renderQueueRef.current.length === 0) {
      isRenderingRef.current = false
      return
    }

    isRenderingRef.current = true
    const renderFunction = renderQueueRef.current.shift()!
    
    requestAnimationFrame(() => {
      renderFunction()
      processRenderQueue()
    })
  }, [])

  const optimizedRender = useCallback((
    ctx: CanvasRenderingContext2D,
    elements: any[],
    viewport: { x: number; y: number; width: number; height: number }
  ) => {
    const startTime = performance.now()

    // Only render visible elements
    const visibleElements = elements.filter(element => {
      return (
        element.x < viewport.x + viewport.width &&
        element.x + element.width > viewport.x &&
        element.y < viewport.y + viewport.height &&
        element.y + element.height > viewport.y
      )
    })

    // Batch similar operations
    visibleElements.forEach(element => {
      ctx.save()
      
      // Apply transforms
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2)
      ctx.rotate((element.rotation || 0) * Math.PI / 180)
      ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2))
      
      // Apply opacity
      ctx.globalAlpha = element.opacity || 1
      
      // Render element based on type
      switch (element.type) {
        case 'rectangle':
          ctx.fillStyle = element.fill || '#000'
          ctx.fillRect(element.x, element.y, element.width, element.height)
          break
        case 'circle':
          ctx.fillStyle = element.fill || '#000'
          ctx.beginPath()
          ctx.arc(
            element.x + element.width / 2,
            element.y + element.height / 2,
            Math.min(element.width, element.height) / 2,
            0,
            Math.PI * 2
          )
          ctx.fill()
          break
        case 'text':
          ctx.fillStyle = element.color || '#000'
          ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`
          ctx.fillText(element.content || '', element.x, element.y)
          break
      }
      
      ctx.restore()
    })

    return performance.now() - startTime
  }, [])

  useEffect(() => {
    initializeOffscreenCanvas()
  }, [initializeOffscreenCanvas])

  return {
    canvasRef,
    queueRender,
    optimizedRender,
    offscreenCanvas: offscreenCanvasRef.current
  }
}

// Memoized component wrapper
export function memoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual)
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
