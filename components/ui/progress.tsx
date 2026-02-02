import * as React from 'react'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: 'default' | 'energy' | 'health'
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    
    const variantStyles = {
      default: 'bg-gold-500',
      energy: 'bg-blue-500',
      health: 'bg-green-500',
    }

    return (
      <div
        ref={ref}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-mafia-border ${className}`}
        {...props}
      >
        <div
          className={`h-full transition-all ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
