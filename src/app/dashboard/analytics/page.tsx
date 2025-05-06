import React from 'react'
import { client } from '@/lib/prisma'
import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { UsageChart } from '@/components/feedback/usage-chart'

export default async function AnalyticsDashboard() {
  // Authentication check
  const auth = await onAuthenticateUser()
  if (auth.status !== 200 && auth.status !== 201) {
    return redirect('/auth/sign-in')
  }

  // Get current user
  const user = await currentUser()
  if (!user) {
    return redirect('/auth/sign-in')
  }

  // Get user record from database
  const dbUser = await client.user.findUnique({
    where: { clerkid: user.id },
    select: { 
      id: true,
      // Add any fields needed to check admin status
    }
  })

  if (!dbUser) {
    return redirect('/auth/sign-in')
  }

  // Get analytics data - last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get feedback summary
  // Note: This will need to be uncommented once the Prisma schema is properly updated
  // const feedbackSummary = await client.feedback.groupBy({
  //   by: ['type', 'rating'],
  //   _count: {
  //     id: true
  //   },
  //   where: {
  //     createdAt: {
  //       gte: thirtyDaysAgo
  //     }
  //   }
  // })

  // Temporary placeholder data until Prisma schema is updated
  const feedbackSummary = [
    { type: 'summary', rating: 'positive', _count: { id: 15 } },
    { type: 'summary', rating: 'negative', _count: { id: 5 } },
    { type: 'tutor', rating: 'positive', _count: { id: 25 } },
    { type: 'tutor', rating: 'negative', _count: { id: 3 } },
    { type: 'lesson', rating: 'positive', _count: { id: 18 } },
    { type: 'lesson', rating: 'negative', _count: { id: 7 } }
  ]

  // Process feedback data for charts
  const feedbackData = [
    { label: 'Video Summaries', positive: 0, negative: 0 },
    { label: 'AI Tutor', positive: 0, negative: 0 },
    { label: 'Course Lessons', positive: 0, negative: 0 }
  ]

  // Calculate totals
  let totalPositive = 0
  let totalNegative = 0

  feedbackSummary.forEach(item => {
    let index = -1;
    if (item.type === 'summary') index = 0;
    else if (item.type === 'tutor') index = 1;
    else if (item.type === 'lesson') index = 2;
    
    if (index !== -1) {
      if (item.rating === 'positive') {
        feedbackData[index].positive = item._count.id
        totalPositive += item._count.id
      } else if (item.rating === 'negative') {
        feedbackData[index].negative = item._count.id
        totalNegative += item._count.id
      }
    }
  })

  // Get video view analytics
  const videoViews = await client.video.findMany({
    select: {
      id: true,
      title: true,
      views: true,
    },
    orderBy: {
      views: 'desc'
    },
    take: 5
  })

  // Usage chart data
  const feedbackChartItems = feedbackData.map(item => ({
    label: item.label,
    value: item.positive,
    maxValue: item.positive + item.negative,
    type: 'success' as const  // Properly typed as literal
  }))

  const sentimentChartItems = [
    {
      label: 'Positive Feedback',
      value: totalPositive,
      maxValue: totalPositive + totalNegative,
      type: 'success' as const  // Properly typed as literal
    },
    {
      label: 'Negative Feedback',
      value: totalNegative,
      maxValue: totalPositive + totalNegative,
      type: 'error' as const  // Properly typed as literal
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track user feedback and feature usage across the platform
        </p>
      </div>

      <Tabs defaultValue="feedback">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="usage">Feature Usage</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <div className="flex justify-end mb-4">
            <DateRangePicker />
          </div>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Feedback by Feature</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Positive vs negative feedback for each feature
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={feedbackChartItems} />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Overall Sentiment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Distribution of positive and negative feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart items={sentimentChartItems} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">AI Tutor Usage</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Sessions and interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40">
                    <p className="text-4xl font-bold text-foreground">--</p>
                    <p className="text-muted-foreground mt-2">Sessions this month</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Video Summaries</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    AI-generated summaries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40">
                    <p className="text-4xl font-bold text-foreground">--</p>
                    <p className="text-muted-foreground mt-2">Summaries generated</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Course Lessons</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Lesson completion rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40">
                    <p className="text-4xl font-bold text-foreground">--</p>
                    <p className="text-muted-foreground mt-2">Average completion</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Top Performing Videos</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Videos with the most views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videoViews.map((video) => (
                    <div key={video.id} className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-foreground truncate max-w-xs">{video.title}</span>
                      <span className="text-muted-foreground">{video.views} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 