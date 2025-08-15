import { lazy, memo, useEffect, useState } from 'react'

// Memoization utilities
export const memoComponent = <P extends Record<string, unknown>>(
	Component: React.ComponentType<P>,
	propsAreEqual?: (prevProps: P, nextProps: P) => boolean,
) => {
	return memo(Component, propsAreEqual)
}

// Common prop equality functions
export const shallowEqual = <T extends Record<string, unknown>>(
	prevProps: T,
	nextProps: T,
): boolean => {
	const keys1 = Object.keys(prevProps)
	const keys2 = Object.keys(nextProps)

	if (keys1.length !== keys2.length) {
		return false
	}

	for (const key of keys1) {
		if (prevProps[key] !== nextProps[key]) {
			return false
		}
	}

	return true
}

// Image optimization utilities
export const OptimizedImage = memoComponent<{
	readonly src: string
	readonly alt: string
	readonly className?: string
	readonly loading?: 'lazy' | 'eager'
}>(
	({ src, alt, className, loading = 'lazy' }) => {
		return (
			<img
				src={src}
				alt={alt}
				className={className}
				loading={loading}
				decoding="async"
			/>
		)
	},
	(prevProps, nextProps) =>
		prevProps.src === nextProps.src &&
		prevProps.alt === nextProps.alt &&
		prevProps.className === nextProps.className,
)

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

// Virtual scrolling for large lists
export const useVirtualScrolling = (
	items: unknown[],
	itemHeight: number,
	containerHeight: number,
) => {
	const [scrollTop, setScrollTop] = useState(0)

	const startIndex = Math.floor(scrollTop / itemHeight)
	const endIndex = Math.min(
		startIndex + Math.ceil(containerHeight / itemHeight) + 1,
		items.length,
	)

	const visibleItems = items.slice(startIndex, endIndex)

	return {
		visibleItems,
		startIndex,
		endIndex,
		onScroll: (e: React.UIEvent<HTMLElement>) => {
			setScrollTop(e.currentTarget.scrollTop)
		},
		totalHeight: items.length * itemHeight,
		offsetY: startIndex * itemHeight,
	}
}

// Lazy loading component factory
export function createLazyComponent<P extends Record<string, unknown>>(
	importFn: () => Promise<{ default: React.ComponentType<P> }>,
) {
	return lazy(importFn)
}
