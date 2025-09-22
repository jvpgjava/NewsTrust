"use client"

import React from "react"
import HamburgerMenu from "./HamburgerMenu"
import Footer from "./Footer"

export default function Layout({ children, currentPage, setCurrentPage }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HamburgerMenu 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
