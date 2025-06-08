"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbProps {
  homeHref?: string
  homeLabel?: string
  items?: Array<{
    href?: string
    label: string
  }>
}

export function Breadcrumb({ homeHref = "/dashboard", homeLabel = "Dashboard", items = [] }: BreadcrumbProps) {
  const pathname = usePathname()

  // Evitar duplicação do Dashboard
  const filteredItems = items.filter((item) => item.label !== homeLabel)

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center space-x-2 text-sm text-gray-500">
        <li className="flex items-center">
          <Link href={homeHref} className="flex items-center hover:text-gray-900 transition-colors">
            <Home className="h-4 w-4 mr-1" />
            <span>{homeLabel}</span>
          </Link>
        </li>

        {filteredItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
