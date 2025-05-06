import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { LucideIcon } from 'lucide-react'

type Props = {
  icon: React.ReactNode
  title: string
  href: string
  selected: boolean
  notifications?: number
}

const SidebarItem = ({ href, icon, selected, title, notifications }: Props) => {
  return (
    <li className="cursor-pointer my-[5px]">
      <Link
        href={href}
        className={cn(
          'flex items-center justify-between group rounded-md hover:bg-primary/5 transition-all duration-300',
          selected ? 'bg-primary/10' : ''
        )}
      >
        <div className="flex items-center gap-2 transition-all p-2 cursor-pointer w-full">
          <div className={cn(
            'text-muted-foreground transition-all duration-300',
            selected ? 'text-primary' : 'group-hover:text-primary/70'
          )}>
            {icon}
          </div>
          <span
            className={cn(
              'font-medium transition-all duration-300 truncate w-32',
              selected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'
            )}
          >
            {title}
          </span>
          {selected && (
            <div className="h-5 w-1 bg-primary rounded-l-full absolute right-0 transform transition-all duration-300"></div>
          )}
        </div>
        {notifications ? (
          <span className="bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center mr-2 shadow-sm">
            {notifications > 9 ? '9+' : notifications}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

export default SidebarItem
