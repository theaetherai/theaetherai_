import React from 'react'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  title: string
  description: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

const GlobalCard = ({ title, children, description, footer }: Props) => {
  return (
    <Card className="bg-secondary/5 border border-secondary/10 mt-4">
      <CardHeader className="p-4">
        <CardTitle className="text-md text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      {children && <div className="p-4">{children}</div>}
      {footer && <CardFooter className="p-4">{footer}</CardFooter>}
    </Card>
  )
}

export default GlobalCard
