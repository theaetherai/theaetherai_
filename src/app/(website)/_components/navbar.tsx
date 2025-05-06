import { Button } from '@/components/ui/button'
import { Menu, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

import React from 'react'

type Props = {}

const LandingPageNavBar = (props: Props) => {
  return (
    <div className="flex w-full justify-between items-center">
      <div className="text-3xl font-semibold flex items-center gap-x-3">
        <Menu className="w-8 h-8" />
        <Image
          alt="AetherLMS"
          src="/aether-logo.svg"
          width={40}
          height={40}
        />
        Opal
      </div>
      <div className="hidden gap-x-10 items-center lg:flex">
        <Link
          href="/"
          className="bg-[#7320DD] py-2 px-5 font-semibold text-lg rounded-full hover:bg-[#7320DD]/80"
        >
          Home
        </Link>
        <Link href="/">Pricing</Link>
        <Link href="/">Contact</Link>
      </div>
      <div className="flex items-center">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )
}

export default LandingPageNavBar
