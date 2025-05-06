import React from 'react'

type Props = { children: React.ReactNode }

const WorkspacePlaceholder = ({ children }: Props) => {
  return (
    <span className="bg-primary/20 text-primary flex items-center font-bold justify-center w-8 px-2 h-7 rounded-md">
      {children}
    </span>
  )
}

export default WorkspacePlaceholder
