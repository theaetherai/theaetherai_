'use client'
import { getWorkSpaces } from '@/actions/workspace'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { NotificationProps, WorkspaceProps } from '@/types/index.type'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import Modal from '../modal'
import { Menu, PlusCircle } from 'lucide-react'
import Search from '../search'
import { MENU_ITEMS } from '@/constants'
import SidebarItem from './sidebar-item'
import { getNotifications } from '@/actions/user'
import { useQueryData } from '@/hooks/useQueryData'
import WorkspacePlaceholder from './workspace-placeholder'
import GlobalCard from '../global-card'
import { Button } from '@/components/ui/button'
import Loader from '../loader'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useDispatch } from 'react-redux'
import { WORKSPACES } from '@/redux/slices/workspaces'
import PaymentButton from '../payment-button'
type Props = {
  activeWorkspaceId: string
}

const Sidebar = ({ activeWorkspaceId }: Props) => {

  const router = useRouter()
  const pathName = usePathname()
  const dispatch = useDispatch()

  const { data, isFetched } = useQueryData(['user-workspaces'], getWorkSpaces)
  const menuItems = MENU_ITEMS(activeWorkspaceId)

  const { data: notifications } = useQueryData(
    ['user-notifications'],
    getNotifications
  )

  const workspace = (data as WorkspaceProps | undefined)?.data
  const count = (notifications as NotificationProps | undefined)?.data

  const onChangeActiveWorkspace = (value: string) => {
    router.push(`/dashboard/${value}`)
  }
  
  const currentWorkspace = workspace?.workspace?.find(
    (s) => s.id === activeWorkspaceId
  )

  if (isFetched && workspace) {
    dispatch(WORKSPACES({ workspaces: workspace.workspace || [] }))
  }

  const SidebarSection = (
    <div className="bg-background/95 backdrop-blur-sm flex-none relative p-4 h-full w-[250px] flex flex-col gap-4 items-center overflow-hidden border-r border-border">
      <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-4 flex gap-2 justify-center items-center mb-4 absolute top-0 left-0 right-0 border-b border-border">
        <div className="relative w-8 h-8">
          <Image
            src="/aether-logo.svg"
            alt="AetherLMS"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-2xl font-semibold text-foreground">Aether.ai</p>
      </div>
      <Select
        defaultValue={activeWorkspaceId}
        onValueChange={onChangeActiveWorkspace}
      >
        <SelectTrigger className="mt-16 text-foreground bg-transparent">
          <SelectValue placeholder="Select a workspace"></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Workspaces</SelectLabel>
            <Separator />
            {workspace?.workspace?.map((workspace) => (
              <SelectItem
                value={workspace.id}
                key={workspace.id}
              >
                {workspace.name}
              </SelectItem>
            ))}
            {workspace?.members && workspace.members.length > 0 &&
              workspace.members.map(
                (workspace) =>
                  workspace.WorkSpace && (
                    <SelectItem
                      value={workspace.WorkSpace.id}
                      key={workspace.WorkSpace.id}
                    >
                      {workspace.WorkSpace.name}
                    </SelectItem>
                  )
              )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {currentWorkspace?.type === 'PUBLIC' &&
        workspace?.subscription?.plan === 'PRO' && (
          <Modal
            trigger={
              <span className="text-sm cursor-pointer flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 w-full rounded-md p-2 gap-2 transition-colors">
                <PlusCircle
                  size={15}
                  className="text-secondary"
                />
                <span className="text-foreground font-medium text-xs">
                  Invite To Workspace
                </span>
              </span>
            }
            title="Invite To Workspace"
            description="Invite other users to your workspace"
          >
            <Search workspaceId={activeWorkspaceId} />
          </Modal>
        )}
      <p className="w-full text-muted-foreground font-bold mt-4">Menu</p>
      <nav className="w-full">
        <ul>
          {menuItems.map((item) => (
            <SidebarItem
              href={item.href}
              icon={item.icon}
              selected={pathName === item.href}
              title={item.title}
              key={item.title}
              notifications={
                (item.title === 'Notifications' &&
                  count?._count?.notification) ||
                0
              }
            />
          ))}
        </ul>
      </nav>
      <Separator className="w-4/5" />
      <p className="w-full text-muted-foreground font-bold mt-4 ">Workspaces</p>

      {workspace?.workspace && workspace.workspace.length === 1 && workspace.members && workspace.members.length === 0 && (
        <div className="w-full mt-[-10px]">
          <p className="text-muted-foreground font-medium text-sm">
            {workspace.subscription?.plan === 'FREE'
              ? 'Upgrade to create workspaces'
              : 'No Workspaces'}
          </p>
        </div>
      )}

      <nav className="w-full">
        <ul className="h-[150px] overflow-auto overflow-x-hidden fade-layer">
          {workspace?.workspace && workspace.workspace.length > 0 &&
            workspace.workspace.map(
              (item) =>
                item.type !== 'PERSONAL' && (
                  <SidebarItem
                    href={`/dashboard/${item.id}`}
                    selected={pathName === `/dashboard/${item.id}`}
                    title={item.name}
                    notifications={0}
                    key={item.name}
                    icon={
                      <WorkspacePlaceholder>
                        {item.name.charAt(0)}
                      </WorkspacePlaceholder>
                    }
                  />
                )
            )}
          {workspace?.members && workspace.members.length > 0 &&
            workspace.members.map((item) => (
              <SidebarItem
                href={`/dashboard/${item.WorkSpace.id}`}
                selected={pathName === `/dashboard/${item.WorkSpace.id}`}
                title={item.WorkSpace.name}
                notifications={0}
                key={item.WorkSpace.name}
                icon={
                  <WorkspacePlaceholder>
                    {item.WorkSpace.name.charAt(0)}
                  </WorkspacePlaceholder>
                }
              />
            ))}
        </ul>
      </nav>
      <Separator className="w-4/5" />
      {workspace?.subscription?.plan === 'FREE' && (
        <GlobalCard
          title="Upgrade to Pro"
          description=" Unlock AI features like transcription, AI summary, and more."
          footer={<PaymentButton />}
        />
      )}
    </div>
  )
  return (
    <div className="full">
      <div className="md:hidden fixed my-4">
        <Sheet>
          <SheetTrigger
            asChild
            className="ml-2"
          >
            <Button
              variant={'ghost'}
              className="mt-[2px]"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side={'left'}
            className="p-0 w-fit h-full"
          >
            {SidebarSection}
          </SheetContent>
        </Sheet>
      </div>
      <div className="md:block hidden h-full">{SidebarSection}</div>
    </div>
  )
}

export default Sidebar
