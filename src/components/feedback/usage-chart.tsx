'use client'

import { cn } from '@/lib/utils'

interface UsageItem {
  label: string
  value: number
  maxValue?: number
  color?: string
  type?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

interface UsageChartProps {
  items: UsageItem[]
  className?: string
}

export function UsageChart({ items, className }: UsageChartProps) {
  // Function to determine the appropriate color based on semantic meaning
  const getChartColor = (item: UsageItem): string => {
    // If a specific color is provided, use it
    if (item.color) return item.color;
    
    // Otherwise use semantic color based on type
    switch (item.type) {
      case 'success':
        return 'bg-chart-success';
      case 'warning':
        return 'bg-chart-warning';
      case 'error':
        return 'bg-chart-error';
      case 'info':
        return 'bg-chart-info';
      case 'neutral':
        return 'bg-chart-neutral';
      default:
        // Determine if it's a positive/negative value or use primary
        if (item.label.toLowerCase().includes('positive')) {
          return 'bg-chart-success';
        } else if (item.label.toLowerCase().includes('negative')) {
          return 'bg-chart-error';
        } else {
          return 'bg-chart-1';
        }
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => {
        const percentage = item.maxValue 
          ? Math.min(100, Math.round((item.value / item.maxValue) * 100)) 
          : item.value;
          
        // Get appropriate color based on data semantics  
        const chartColor = getChartColor(item);
        
        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{item.label}</span>
              {item.maxValue ? (
                <span className="text-muted-foreground">{item.value} / {item.maxValue}</span>
              ) : (
                <span className="text-muted-foreground">{item.value}</span>
              )}
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  chartColor
                )}
                style={{ 
                  width: `${percentage}%`,
                  backgroundImage: chartColor === 'bg-chart-1' 
                    ? 'linear-gradient(90deg, hsl(var(--chart-1)), hsl(var(--chart-3)))' 
                    : 'none'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
} 