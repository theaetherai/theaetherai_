'use client'

import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { client } from '@/lib/prisma'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ShieldCheck, User, UserCheck, UserCog } from "lucide-react"

interface Props {
  params: {
    workspaceId: string
  }
}

export default function UsersPage({ params }: Props) {
  const { workspaceId } = params
  const router = useRouter()
  const [users, setUsers] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Fetch users data
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch('/api/users')
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        if (data.status === 200) {
          setUsers(data.data)
        } else {
          // If not authorized, redirect to dashboard
          router.push(`/dashboard/${workspaceId}`)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error("Error", {
            description: "Failed to load users. Please try again later."
          })
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [workspaceId, router])

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdating(true)
      
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user role')
      }
      
      const data = await response.json()
      
      // Update the users array with the new role
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      toast.success("Role Updated", {
        description: `User role successfully changed to ${newRole}`
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error("Error", {
        description: "Failed to update user role. Please try again."
      })
    } finally {
      setUpdating(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.firstname && user.firstname.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.lastname && user.lastname.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4 mr-2" />
      case 'instructor':
        return <UserCog className="h-4 w-4 mr-2" />
      case 'student':
      default:
        return <UserCheck className="h-4 w-4 mr-2" />
    }
  }

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>
      case 'instructor':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Instructor</Badge>
      case 'student':
      default:
        return <Badge className="bg-green-500 hover:bg-green-600">Student</Badge>
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="bg-[#111111] border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <UserCog className="h-6 w-6 mr-2" />
            User Management
          </CardTitle>
          <CardDescription className="text-[#9D9D9D]">
            Manage user roles and permissions for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-1/3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#9D9D9D]" />
              <Input
                placeholder="Search users..."
                className="pl-8 bg-[#1A1A1A] border-[#3A3A3A] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-[#9D9D9D]">Loading users...</p>
            </div>
          ) : (
            <div className="rounded-md border border-[#2A2A2A]">
              <Table>
                <TableHeader className="bg-[#1A1A1A]">
                  <TableRow className="hover:bg-[#1A1A1A] border-b border-[#2A2A2A]">
                    <TableHead className="text-[#9D9D9D]">User</TableHead>
                    <TableHead className="text-[#9D9D9D]">Email</TableHead>
                    <TableHead className="text-[#9D9D9D]">Current Role</TableHead>
                    <TableHead className="text-[#9D9D9D]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow className="hover:bg-[#1A1A1A]">
                      <TableCell colSpan={4} className="text-center text-[#9D9D9D] py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-[#1A1A1A] border-b border-[#2A2A2A]">
                        <TableCell className="text-white">
                          <div className="flex items-center">
                            {user.image ? (
                              <img 
                                src={user.image} 
                                alt={user.firstname || 'User'} 
                                className="h-8 w-8 rounded-full mr-2"
                              />
                            ) : (
                              <User className="h-8 w-8 text-[#3A3A3A] mr-2" />
                            )}
                            <div>
                              <div>
                                {user.firstname || user.lastname 
                                  ? `${user.firstname || ''} ${user.lastname || ''}`.trim() 
                                  : 'Anonymous User'
                                }
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#BDBDBD]">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getRoleBadge(user.role || 'student')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={user.role || 'student'}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={updating}
                          >
                            <SelectTrigger className="w-[180px] bg-[#1A1A1A] border-[#3A3A3A] text-white">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-[#3A3A3A] text-white">
                              <SelectItem value="student" className="hover:bg-[#2A2A2A]">
                                <div className="flex items-center">
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Student
                                </div>
                              </SelectItem>
                              <SelectItem value="instructor" className="hover:bg-[#2A2A2A]">
                                <div className="flex items-center">
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Instructor
                                </div>
                              </SelectItem>
                              <SelectItem value="admin" className="hover:bg-[#2A2A2A]">
                                <div className="flex items-center">
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 