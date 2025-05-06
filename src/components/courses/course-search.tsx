'use client'

import { Input } from '@/components/ui/input'
import { Search, Filter, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition, useCallback } from 'react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function CourseSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [showEnrolled, setShowEnrolled] = useState(searchParams.get('enrolled') === 'true')
  const [showCreated, setShowCreated] = useState(searchParams.get('created') === 'true')
  
  // Create query string
  const createQueryString = useCallback((params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })
    
    return newSearchParams.toString()
  }, [searchParams])
  
  // Update URL with filters
  const updateFilters = () => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({
        q: searchQuery || null,
        sortBy,
        enrolled: showEnrolled ? 'true' : null,
        created: showCreated ? 'true' : null,
      })}`)
    })
  }
  
  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters()
  }
  
  // Update URL when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [sortBy, showEnrolled, showCreated])
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            variant="outlined"
            placeholder="Search for courses..."
            className="pl-10 bg-white border-2 text-foreground focus-visible:border-primary/50 shadow-md rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" 
              className="bg-white border-2 border-border/70 hover:border-primary/50 shadow-md rounded-lg">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 bg-card border-2 border-border/70 text-foreground shadow-elevation-3 rounded-lg"
            align="end"
          >
            <DropdownMenuGroup>
              <div className="p-3">
                <h4 className="mb-2 text-sm font-medium text-foreground">Sort By</h4>
                <RadioGroup 
                  value={sortBy} 
                  onValueChange={setSortBy}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="newest" id="newest" className="text-primary border-primary/60" />
                    <Label htmlFor="newest" className="text-foreground">Newest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oldest" id="oldest" className="text-primary border-primary/60" />
                    <Label htmlFor="oldest" className="text-foreground">Oldest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alphabetical" id="alphabetical" className="text-primary border-primary/60" />
                    <Label htmlFor="alphabetical" className="text-foreground">Alphabetical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="popular" id="popular" className="text-primary border-primary/60" />
                    <Label htmlFor="popular" className="text-foreground">Most Popular</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <DropdownMenuSeparator className="bg-border/40" />
              
              <div className="p-3">
                <h4 className="mb-2 text-sm font-medium text-foreground">Show</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="enrolled" 
                      checked={showEnrolled}
                      onCheckedChange={(checked) => setShowEnrolled(!!checked)}
                      className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor="enrolled" className="text-foreground">Enrolled Courses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="created" 
                      checked={showCreated}
                      onCheckedChange={(checked) => setShowCreated(!!checked)}
                      className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor="created" className="text-foreground">My Courses</Label>
                  </div>
                </div>
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          type="submit" 
          disabled={isPending}
          variant="default"
          className="text-white shadow-md rounded-lg">
          Search
        </Button>
      </form>
    </div>
  )
} 