"use client"

import { useState } from "react"
import { BarChart3, Search, Network, Menu, X } from "lucide-react"

export default function Layout({ children, currentPage, setCurrentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", key: "dashboard", icon: BarChart3 },
    { name: "Análise de Notícias", key: "news-analysis", icon: Search },
    { name: "Rede de Confiança", key: "network", icon: Network },
  ]

  const handleNavigation = (key) => {
    setCurrentPage(key)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <img src="/iconeNewsTrust.png" alt="NewsTrust" className="h-8 w-8 flex-shrink-0" />
              <span className="ml-3 text-xl font-bold text-gray-900 leading-none mt-1">NewsTrust</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = currentPage === item.key
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.key)}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-left ${isActive ? "bg-blue-100 text-blue-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <img src="/iconeNewsTrust.png" alt="NewsTrust" className="h-8 w-8 flex-shrink-0" />
            <span className="ml-3 text-xl font-bold text-gray-900 leading-none mt-1">NewsTrust</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = currentPage === item.key
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.key)}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-left ${isActive ? "bg-blue-100 text-blue-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>


        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-gray-400" />
            </button>


          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
