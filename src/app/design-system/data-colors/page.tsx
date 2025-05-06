import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageChart } from '@/components/feedback/usage-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DataVisualizationPage() {
  // Sample data for categorical colors
  const categoricalData = [
    { label: 'Category 1', value: 65, maxValue: 100, type: 'default' as const },
    { label: 'Category 2', value: 80, maxValue: 100, type: 'default' as const },
    { label: 'Category 3', value: 45, maxValue: 100, type: 'default' as const },
    { label: 'Category 4', value: 90, maxValue: 100, type: 'default' as const },
    { label: 'Category 5', value: 55, maxValue: 100, type: 'default' as const },
    { label: 'Category 6', value: 70, maxValue: 100, type: 'default' as const },
    { label: 'Category 7', value: 40, maxValue: 100, type: 'default' as const },
  ];

  // Sample data for semantic colors
  const semanticData = [
    { label: 'Success Metric', value: 85, maxValue: 100, type: 'success' as const },
    { label: 'Warning Threshold', value: 65, maxValue: 100, type: 'warning' as const },
    { label: 'Error Rate', value: 25, maxValue: 100, type: 'error' as const },
    { label: 'Information Points', value: 55, maxValue: 100, type: 'info' as const },
    { label: 'Neutral Reference', value: 50, maxValue: 100, type: 'neutral' as const },
  ];

  // Sample data for sequential colors
  const sequentialData = [
    { label: 'Level 1 (Lowest)', value: 20, maxValue: 100, color: 'bg-chart-sequential-1' },
    { label: 'Level 2', value: 35, maxValue: 100, color: 'bg-chart-sequential-2' },
    { label: 'Level 3', value: 50, maxValue: 100, color: 'bg-chart-sequential-3' },
    { label: 'Level 4', value: 75, maxValue: 100, color: 'bg-chart-sequential-4' },
    { label: 'Level 5 (Highest)', value: 90, maxValue: 100, color: 'bg-chart-sequential-5' },
  ];

  // Sample data for diverging colors
  const divergingData = [
    { label: 'Strong Negative', value: -75, maxValue: 100, color: 'bg-chart-diverging-negative-2' },
    { label: 'Moderate Negative', value: -35, maxValue: 100, color: 'bg-chart-diverging-negative-1' },
    { label: 'Neutral', value: 5, maxValue: 100, color: 'bg-chart-diverging-neutral' },
    { label: 'Moderate Positive', value: 45, maxValue: 100, color: 'bg-chart-diverging-positive-1' },
    { label: 'Strong Positive', value: 85, maxValue: 100, color: 'bg-chart-diverging-positive-2' },
  ];

  return (
    <div className="container py-10 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Data Visualization Color System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive color system for data visualizations in Opal that improves readability, hierarchy, and information processing.
        </p>
      </div>

      <Tabs defaultValue="categorical">
        <TabsList className="w-full bg-card border-b border-border rounded-none justify-start mb-6">
          <TabsTrigger value="categorical">Categorical</TabsTrigger>
          <TabsTrigger value="semantic">Semantic</TabsTrigger>
          <TabsTrigger value="sequential">Sequential</TabsTrigger>
          <TabsTrigger value="diverging">Diverging</TabsTrigger>
          <TabsTrigger value="guidelines">Usage Guidelines</TabsTrigger>
        </TabsList>

        {/* Categorical Colors */}
        <TabsContent value="categorical">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Categorical Colors</h2>
              <p className="text-muted-foreground mb-4">
                These colors are designed for distinguishing different categories of data. They have similar lightness and saturation for visual equality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Categorical Palette</CardTitle>
                  <CardDescription>
                    For basic category distinction in charts and graphs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`h-4 w-12 rounded bg-chart-${i+1} mr-4`} />
                        <span>Chart {i+1}: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-{i+1}))</code></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categorical Usage Example</CardTitle>
                  <CardDescription>
                    Applied to multiple categories of data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={categoricalData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Semantic Colors */}
        <TabsContent value="semantic">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Semantic Colors</h2>
              <p className="text-muted-foreground mb-4">
                These colors convey inherent meaning through association. For example, red indicates errors or warnings, while green indicates success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Semantic Color Palette</CardTitle>
                  <CardDescription>
                    Colors with specific meaning for data visualization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-success mr-4" />
                      <span>Success: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-success))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-warning mr-4" />
                      <span>Warning: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-warning))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-error mr-4" />
                      <span>Error: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-error))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-info mr-4" />
                      <span>Info: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-info))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-neutral mr-4" />
                      <span>Neutral: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-neutral))</code></span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Semantic Usage Example</CardTitle>
                  <CardDescription>
                    Colors indicating meaning in data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={semanticData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sequential Colors */}
        <TabsContent value="sequential">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Sequential Colors</h2>
              <p className="text-muted-foreground mb-4">
                These colors show progression or intensity through a gradual change in lightness and/or saturation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sequential Color Scale</CardTitle>
                  <CardDescription>
                    For showing intensity or magnitude
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`h-4 w-12 rounded bg-chart-sequential-${i+1} mr-4`} />
                        <span>Level {i+1}: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-sequential-{i+1}))</code></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sequential Usage Example</CardTitle>
                  <CardDescription>
                    Data progression from low to high
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={sequentialData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Diverging Colors */}
        <TabsContent value="diverging">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Diverging Colors</h2>
              <p className="text-muted-foreground mb-4">
                These colors emphasize the deviation from a critical middle value through opposing hues.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Diverging Color Scale</CardTitle>
                  <CardDescription>
                    For showing deviation from a midpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-diverging-negative-2 mr-4" />
                      <span>Strong Negative: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-diverging-negative-2))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-diverging-negative-1 mr-4" />
                      <span>Moderate Negative: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-diverging-negative-1))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-diverging-neutral mr-4" />
                      <span>Neutral: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-diverging-neutral))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-diverging-positive-1 mr-4" />
                      <span>Moderate Positive: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-diverging-positive-1))</code></span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-12 rounded bg-chart-diverging-positive-2 mr-4" />
                      <span>Strong Positive: <code className="text-xs bg-muted px-1 py-0.5 rounded">hsl(var(--chart-diverging-positive-2))</code></span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Diverging Usage Example</CardTitle>
                  <CardDescription>
                    Showing positive and negative deviations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={divergingData.map(item => ({
                    ...item,
                    value: Math.abs(item.value)  // Convert to absolute for display
                  }))} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Usage Guidelines */}
        <TabsContent value="guidelines">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Usage Guidelines</h2>
              <p className="text-muted-foreground mb-4">
                Best practices for applying the data visualization color system effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>When to Use Each Palette</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Categorical</h3>
                    <p className="text-sm text-muted-foreground">Use for distinguishing different categories where no inherent order or value judgment exists. Examples: product categories, user types, feature areas.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Semantic</h3>
                    <p className="text-sm text-muted-foreground">Use when data represents success/failure states or has established color associations. Examples: system health, KPI achievements, pass/fail metrics.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Sequential</h3>
                    <p className="text-sm text-muted-foreground">Use for data with a clear progression from low to high values. Examples: usage metrics, adoption rates, performance scores.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Diverging</h3>
                    <p className="text-sm text-muted-foreground">Use for data that diverges from a meaningful midpoint or baseline. Examples: profit/loss, sentiment analysis, above/below average.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Considerations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Color is Not the Only Indicator</h3>
                    <p className="text-sm text-muted-foreground">Always supplement color with text labels, patterns, or icons to ensure information is accessible to users with color vision deficiencies.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Maintain Sufficient Contrast</h3>
                    <p className="text-sm text-muted-foreground">All colors in charts should maintain sufficient contrast with their background, especially in dark mode. The palette has been optimized for this.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Limit Number of Colors</h3>
                    <p className="text-sm text-muted-foreground">Avoid using more than 7 colors in a single visualization. When more categories are needed, consider using patterns or grouping less important categories.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">Consistent Application</h3>
                    <p className="text-sm text-muted-foreground">Use colors consistently across the application. For example, if green represents success in one chart, it should represent success in all charts.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 