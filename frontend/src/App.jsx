"use client"

import { useState } from "react"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import NewsAnalysis from "./pages/NewsAnalysis"
import NetworkVisualization from "./pages/NetworkVisualization"
import About from "./pages/About"
import Contact from "./pages/Contact"

function App() {
  const [currentPage, setCurrentPage] = useState("news-analysis")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "news-analysis":
        return <NewsAnalysis />
      case "network":
        return <NetworkVisualization />
      case "about":
        return <About />
      case "contact":
        return <Contact />
      default:
        return <NewsAnalysis />
    }
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
