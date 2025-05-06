import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ElevationSystemPage() {
  return (
    <div className="container py-10 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Elevation System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive elevation system that adds depth and hierarchy to the Opal interface.
        </p>
      </div>

      {/* Surface Elevations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Surface Elevations</h2>
        <p className="text-muted-foreground">
          Five distinct elevation levels provide visual hierarchy through subtle shadows, border treatments, and surface colors.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex flex-col space-y-2">
              <div 
                className={`elevation-${level} p-8 rounded-xl h-40 flex items-center justify-center elevation-transition`}
              >
                <p className="text-2xl font-semibold">Level {level}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">Elevation {level}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Interactive Cards</h2>
        <p className="text-muted-foreground">
          Cards with different elevation levels and interactive behaviors.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card elevation="1">
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
              <CardDescription>Elevation Level 1</CardDescription>
            </CardHeader>
            <CardContent>
              <p>The lowest elevation level, used for subtle differentiation from the background.</p>
            </CardContent>
          </Card>

          <Card elevation="2" interactive>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>Elevation Level 2 with hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Standard card with interactive elevation that responds to hover and active states.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card elevation="3" interactive>
            <CardHeader>
              <CardTitle>Floating Card</CardTitle>
              <CardDescription>Elevation Level 3 with hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Higher elevation card for more prominent UI elements requiring attention.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Primary Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Button Elevations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Button Elevations</h2>
        <p className="text-muted-foreground">
          Buttons use elevation to communicate importance and interaction states.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="default">Primary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      {/* Advanced Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Practical Applications</h2>
        <p className="text-muted-foreground">
          Real-world examples of the elevation system in context.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nested Card Example */}
          <Card elevation="2">
            <CardHeader>
              <CardTitle>Nested Elements</CardTitle>
              <CardDescription>Showing hierarchy through elevation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Elements with higher elevation appear closer to the user:</p>
              <div className="elevation-1 p-4 rounded-lg">
                <p className="mb-3 text-sm">Base content (Level 1)</p>
                <div className="elevation-3 p-4 rounded-lg">
                  <p className="text-sm">Important element (Level 3)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive States Example */}
          <Card elevation="2">
            <CardHeader>
              <CardTitle>Interactive States</CardTitle>
              <CardDescription>Elevation changes on interaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Try interacting with these elements:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="elevation-2 elevation-transition interactive-elevation p-4 rounded-lg text-center cursor-pointer">
                  Hover Me
                </div>
                <div className="bg-primary text-primary-foreground elevation-3 elevation-transition interactive-elevation p-4 rounded-lg text-center cursor-pointer">
                  Primary Element
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
} 