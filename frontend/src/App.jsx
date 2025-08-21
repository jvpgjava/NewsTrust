"use client"

import { useState } from "react"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import NewsAnalysis from "./pages/NewsAnalysis"
import NetworkVisualization from "./pages/NetworkVisualization"

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "news-analysis":
        return <NewsAnalysis />
      case "network":
        return <NetworkVisualization />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
