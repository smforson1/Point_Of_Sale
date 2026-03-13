
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MoreHorizontal,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  Mail,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { UserModal } from './UserModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Profile } from '@/types'

export function UserTable() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id)

      if (error) throw error
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Note: Active users in Auth cannot be deleted from here.')
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-500 hover:bg-purple-600 border-0">Admin</Badge>
      case 'MANAGER':
        return <Badge className="bg-blue-500 hover:bg-blue-600 border-0">Manager</Badge>
      default:
        return <Badge variant="secondary">Cashier</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff members..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setSelectedUser(null)
          setIsModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-8 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No users found"
                    description="Invite your team members to manage the store."
                    icon={UserIcon}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-medium">{user.full_name || 'System User'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-3 w-3" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setIsModalOpen(true)
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Revoke Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserModal
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchUsers}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Revoke User Access"
        description={`Are you sure you want to remove ${selectedUser?.full_name || selectedUser?.email}? This will prevent them from logging in.`}
        confirmText="Revoke Access"
        variant="destructive"
      />
    </div>
  )
}
