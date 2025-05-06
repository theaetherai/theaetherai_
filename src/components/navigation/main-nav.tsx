'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Bell, ChevronDown, Menu, Search, ShoppingCart } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getWorkSpaces } from '@/actions/workspace'

// Define interfaces for the workspace data structure
interface Workspace {
  id: string;
  name: string;
  type: string;
}

interface WorkspaceMember {
  WorkSpace: Workspace;
}

interface WorkspacesResponse {
  status: number;
  data?: {
    workspace?: Workspace[];
    members?: WorkspaceMember[];
  }
}

export function MainNav() {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Redirect to the user's workspace when clicking "My Workspace"
  const handleWorkspaceClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isProcessing) {
      return // Prevent multiple clicks
    }
    
    setIsProcessing(true)
    
    try {
      // Call getWorkSpaces directly to get the latest workspace data
      const workspacesResponse = await getWorkSpaces()
      console.log('Direct workspace response:', workspacesResponse)
      
      if (workspacesResponse && workspacesResponse.status === 200 && workspacesResponse.data) {
        // Check for direct workspaces
        if (workspacesResponse.data.workspace && workspacesResponse.data.workspace.length > 0) {
          const workspaceId = workspacesResponse.data.workspace[0].id
          console.log('Found workspace, ID:', workspaceId)
          router.push(`/dashboard/${workspaceId}`)
          return
        }
        
        // Check for member workspaces
        if (workspacesResponse.data.members && workspacesResponse.data.members.length > 0) {
          for (const member of workspacesResponse.data.members) {
            if (member.WorkSpace && member.WorkSpace.id) {
              console.log('Found member workspace, ID:', member.WorkSpace.id)
              router.push(`/dashboard/${member.WorkSpace.id}`)
              return
            }
          }
        }
      }
      
      // If we got to this point, no workspaces were found
      console.log('No workspace found, falling back to courses')
      router.push('/courses')
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      router.push('/courses')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background shadow-sm">
      <div className="flex h-[72px] items-center px-6 md:px-10">
        {/* Mobile menu button - only shows on small screens */}
        <button className="mr-4 block md:hidden">
          <Menu className="h-6 w-6 text-foreground" />
        </button>
        
        {/* Logo */}
        <Link href="/" className="flex items-center mr-6">
          <div className="relative w-9 h-9 mr-2">
            <Image
              src="/aether-logo.svg"
              alt="AetherLMS"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <span className="text-xl font-bold text-foreground hidden sm:block">AetherLMS</span>
        </Link>
        
        {/* Categories dropdown - hidden on mobile */}
        <div className="hidden md:block mr-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-foreground hover:text-foreground"
              >
                Categories <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=development" className="w-full">Development</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=business" className="w-full">Business</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=it-and-software" className="w-full">IT & Software</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=personal-development" className="w-full">Personal Development</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=design" className="w-full">Design</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/courses?category=marketing" className="w-full">Marketing</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 relative max-w-[600px]">
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="Search for anything"
              className="pl-12 py-3 border border-border rounded-full bg-muted/50 text-foreground w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
            <Button 
              type="submit" 
              className="absolute right-0 rounded-full px-5 py-2 h-full bg-primary text-black"
            >
              Search
            </Button>
          </div>
        </form>
        
        {/* Navigation links - hidden on mobile */}
        <nav className="hidden ml-6 md:flex items-center space-x-6">
          <Link
            href="/courses"
            className={`text-foreground hover:text-primary ${
              pathname === '/courses' ? 'font-semibold' : ''
            }`}
          >
            Courses
          </Link>
          
          {isSignedIn && (
            <Link
              href="#"
              onClick={handleWorkspaceClick}
              className={`text-foreground hover:text-primary ${
                pathname.startsWith('/dashboard') ? 'font-semibold' : ''
              }`}
            >
              My Workspace
            </Link>
          )}
          
          <Link
            href="/ai-tutor"
            className={`text-foreground hover:text-primary ${
              pathname === '/ai-tutor' ? 'font-semibold' : ''
            }`}
          >
            AI Tutor
          </Link>
        </nav>
        
        {/* Right-side icons */}
        <div className="flex items-center ml-auto space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/cart" className="text-foreground hover:text-primary">
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <Link href="/notifications" className="text-foreground hover:text-primary">
                <Bell className="h-6 w-6" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button 
                  variant="outline"
                  className="font-bold"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="font-bold bg-primary text-black">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 