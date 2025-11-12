'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'

interface MenuItem {
  name: string
  href: string
  enabled: boolean
}

const menuItems: MenuItem[] = [
  { name: 'Policy Bot', href: '/how-it-works/policy-bot', enabled: true },
  { name: 'System Compass', href: '/how-it-works/system-compass', enabled: true },
  { name: 'Impact Evaluator', href: '/how-it-works/impact-evaluator', enabled: true },
  { name: 'Dynamic Systems Modeler', href: '/how-it-works/dsm', enabled: true },
]

export default function HowItWorksDropdown() {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-neutral-300 hover:text-neutral-50 transition-colors rounded-lg hover:bg-dark-300/30">
          How It Works
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right rounded-lg bg-dark-500/95 backdrop-blur-xl border border-dark-300/40 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
          <div className="p-2">
            {menuItems.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }: { active: boolean }) => (
                  item.enabled ? (
                    <Link
                      href={item.href}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-md text-sm transition-all duration-200
                        ${active
                          ? 'bg-strategyand-accent/20 text-strategyand-accent'
                          : 'text-neutral-200 hover:text-neutral-50'
                        }
                      `}
                    >
                      <span className="font-medium">{item.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 rounded-md text-sm cursor-not-allowed opacity-50">
                      <span className="font-medium text-neutral-400">{item.name}</span>
                      <span className="text-xs px-2 py-1 bg-dark-400 rounded text-neutral-500">
                        Coming Soon
                      </span>
                    </div>
                  )
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
