"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Trophy,
  Search,
  Filter,
  ArrowRight,
  Menu,
  X,
  Eye,
  MessageCircle,
  Send,
  Bot,
  Sparkles,
  Zap,
  Users,
  Award,
  Star,
  Calendar,
  ChevronDown,
  CheckCircle,
  Globe,
  Sun,
  Moon,
  ArrowUp,
  Paperclip,
  Mic,
} from "lucide-react"
import Link from "next/link"

interface Competition {
  id: string
  nama: string
  deskripsi: string
  poster: string
  status: string | number
}

interface ChatMessage {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

interface ToastProps {
  id: string
  message: string
  type: "success" | "error" | "info"
  icon?: React.ReactNode
}

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Halo! 👋 Saya asisten virtual Competition Hub. Ada yang bisa saya bantu?",
      isBot: true,
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Quick actions for chatbot
  const quickActions = [
    { id: "registration", text: "Cara mendaftar", icon: "📝" },
    { id: "requirements", text: "Syarat peserta", icon: "✅" },
    { id: "cost", text: "Biaya pendaftaran", icon: "💰" },
    { id: "categories", text: "Kategori lomba", icon: "🏆" },
    { id: "contact", text: "Hubungi admin", icon: "📞" },
  ]

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  useEffect(() => {
    fetchCompetitions()

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Function to check if competition is open
  const isCompetitionOpen = (status: string | number) => {
    if (typeof status === "number") {
      return status === 1
    }
    return status === "Aktif" || status === "Masih terbuka" || status === "1"
  }

  // Function to get status display text
  const getStatusText = (status: string | number) => {
    if (typeof status === "number") {
      return status === 1 ? "OPEN" : "CLOSED"
    }
    return status
  }

  // Function to get short description
  const getShortDescription = (description: string) => {
    if (!description) return ""
    return description.length > 120 ? description.substring(0, 120) + "..." : description
  }

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec",
      )
      const data = await response.json()
      setCompetitions(data)
      showToast("Data loaded successfully! 🎉", "success", <CheckCircle />)
    } catch (error) {
      console.error("Error fetching competitions:", error)
      showToast("Failed to load data", "error", <X />)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: "success" | "error" | "info", icon?: React.ReactNode) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, icon }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (filterStatus === "open") {
      matchesFilter = isCompetitionOpen(comp.status)
    } else if (filterStatus === "closed") {
      matchesFilter = !isCompetitionOpen(comp.status)
    }

    return matchesSearch && matchesFilter
  })

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleViewDetail = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCompetition(null)
  }

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find((a) => a.id === actionId)
    if (action) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: action.text,
        isBot: false,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMessage])

      setIsTyping(true)
      setTimeout(
        () => {
          const botResponse = generateBotResponse(action.text)
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: botResponse,
            isBot: true,
            timestamp: new Date(),
          }
          setChatMessages((prev) => [...prev, botMessage])
          setIsTyping(false)
        },
        800 + Math.random() * 500,
      )
    }
  }

  // Chatbot functions
  const sendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isBot: false,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateBotResponse(chatInput)
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 800)
  }

  const generateBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("daftar") || lowerInput.includes("registrasi")) {
      return 'Untuk mendaftar perlombaan, Anda bisa melihat daftar perlombaan yang tersedia di bawah dan klik tombol "DAFTAR SEKARANG" pada perlombaan yang diinginkan. 🏆'
    }

    if (lowerInput.includes("syarat") || lowerInput.includes("persyaratan")) {
      return "Syarat umum pendaftaran biasanya meliputi: identitas lengkap, tingkat sabuk, asal dojang/klub, dan data fisik (tinggi/berat badan). Detail syarat spesifik bisa dilihat di setiap perlombaan. 📋"
    }

    if (lowerInput.includes("biaya") || lowerInput.includes("harga") || lowerInput.includes("bayar")) {
      return "Informasi biaya pendaftaran akan ditampilkan pada detail setiap perlombaan. Biaya bervariasi tergantung jenis dan kategori perlombaan. 💰"
    }

    if (lowerInput.includes("kategori") || lowerInput.includes("kelas")) {
      return "Kami menyediakan berbagai kategori seperti Poomsae, Kyorugi, dan Breaking untuk kelas Anak, Remaja, Dewasa, dan Senior. Pilih sesuai usia dan kemampuan Anda! 🥋"
    }

    if (lowerInput.includes("halo") || lowerInput.includes("hai") || lowerInput.includes("hello")) {
      return "Halo! Selamat datang di Competition Hub! Ada yang bisa saya bantu mengenai pendaftaran perlombaan? 😊"
    }

    if (lowerInput.includes("terima kasih") || lowerInput.includes("thanks")) {
      return "Sama-sama! Jangan ragu untuk bertanya jika ada hal lain yang ingin Anda ketahui. Semoga sukses di perlombaan! 🌟"
    }

    return "Hmm, pertanyaan yang menarik! 🤔 Saya belum bisa menjawab pertanyaan spesifik itu, tapi jangan khawatir! Tim admin kami siap membantu langsung di WhatsApp. Mereka pasti bisa kasih jawaban yang lebih detail! 💪✨"
  }

  // Render components
  const renderToasts = () => (
    <div className="fixed top-6 right-6 z-50 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border-2 border-black dark:border-white ${
            toast.type === "success"
              ? "bg-green-400 text-black"
              : toast.type === "error"
                ? "bg-red-400 text-black"
                : "bg-blue-400 text-black"
          }`}
        >
          <div className="text-black">{toast.icon}</div>
          <p className="font-bold">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )

  const renderChatbot = () => (
    <div className="fixed bottom-6 right-6 z-50">
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="group relative w-16 h-16 bg-yellow-400 hover:bg-yellow-500 rounded-full shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black transition-all duration-200 flex items-center justify-center"
        >
          <MessageCircle className="h-7 w-7 text-black" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </button>
      ) : (
        <div className="w-[350px] h-[600px] bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-yellow-400 dark:bg-yellow-500 border-b-2 border-black dark:border-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center">
                    <Bot className="h-5 w-5 text-black" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                </div>
                <div>
                  <h3 className="font-black text-lg text-black">CHAT BOT</h3>
                  <div className="flex items-center space-x-2 text-xs text-black">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>ONLINE</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-black hover:bg-black/10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-lg border-2 ${
                    message.isBot
                      ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-black dark:border-white"
                      : "bg-yellow-400 dark:bg-yellow-500 text-black border-black"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div
                    className={`text-xs mt-2 ${message.isBot ? "text-gray-500 dark:text-gray-400" : "text-black/70"}`}
                  >
                    {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-2 border-black dark:border-white">
                  <div className="flex space-x-2 items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">BANTUAN CEPAT:</p>
            <div className="overflow-x-auto">
              <div className="flex space-x-2 pb-2" style={{ width: "max-content" }}>
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="flex items-center p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-xs whitespace-nowrap min-w-fit"
                  >
                    <span className="mr-2">{action.icon}</span>
                    <span className="text-black dark:text-white font-medium">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t-2 border-black dark:border-white bg-white dark:bg-gray-900">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ketik pesan Anda..."
                  className="bg-gray-100 dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-black pr-16 text-black dark:text-white"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all duration-200"
              >
                <Send className="h-5 w-5 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderScrollToTop = () =>
    showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 w-12 h-12 bg-cyan-400 hover:bg-cyan-500 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all duration-200 z-40 flex items-center justify-center"
      >
        <ArrowUp className="h-6 w-6 text-black" />
      </button>
    )

  const renderCompetitionModal = () =>
    showModal &&
    selectedCompetition && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
        <div className="relative bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_rgba(255,255,255,1)] max-w-3xl max-h-[90vh] overflow-y-auto w-full">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-400 hover:bg-red-500 rounded-full border-2 border-black flex items-center justify-center transition-all duration-200"
          >
            <X className="h-5 w-5 text-black" />
          </button>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-black text-black dark:text-white mb-6 leading-tight">
                {selectedCompetition.nama}
              </h2>
              <Badge
                className={`${
                  isCompetitionOpen(selectedCompetition.status)
                    ? "bg-green-400 hover:bg-green-500"
                    : "bg-red-400 hover:bg-red-500"
                } text-black font-black px-6 py-2 text-lg mb-6 rounded-lg border-2 border-black`}
              >
                {getStatusText(selectedCompetition.status)}
              </Badge>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-black dark:text-white mb-6 flex items-center">
                  <Trophy className="mr-4 h-7 w-7 text-yellow-400" />
                  DETAIL KOMPETISI
                </h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 border-2 border-black dark:border-white">
                  <pre className="text-base text-black dark:text-white leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedCompetition.deskripsi}
                  </pre>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-black dark:border-white">
                <Link
                  href={isCompetitionOpen(selectedCompetition.status) ? `/register/${selectedCompetition.id}` : "#"}
                >
                  <button
                    className={`w-full font-black py-6 rounded-xl transition-all duration-300 text-xl border-4 ${
                      isCompetitionOpen(selectedCompetition.status)
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-500"
                    }`}
                    disabled={!isCompetitionOpen(selectedCompetition.status)}
                  >
                    {isCompetitionOpen(selectedCompetition.status) ? (
                      <>
                        <Trophy className="mr-4 h-7 w-7 inline-block" />
                        DAFTAR SEKARANG
                        <ArrowRight className="ml-4 h-7 w-7 inline-block" />
                      </>
                    ) : (
                      <>
                        <X className="mr-4 h-7 w-7 inline-block" />
                        PENDAFTARAN DITUTUP
                      </>
                    )}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white ${theme}`}>
      {renderToasts()}
      {renderChatbot()}
      {renderScrollToTop()}
      {renderCompetitionModal()}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <Trophy className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black text-black dark:text-white">COMPETITION HUB</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">NEXT-GEN PLATFORM</p>
              </div>
            </div>

            <nav className="hidden lg:flex space-x-1">
              {[
                { name: "HOME", id: "home" },
                { name: "COMPETITIONS", id: "competitions" },
                { name: "ABOUT", id: "about" },
                { name: "CONTACT", id: "contact" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="relative px-4 py-2 text-sm font-black text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-all duration-200 rounded-lg border-2 border-transparent hover:border-black dark:hover:border-white"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border-2 border-black dark:border-white">
                <Sun className="h-4 w-4 text-yellow-500" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-cyan-400"
                />
                <Moon className="h-4 w-4 text-cyan-500" />
              </div>

              <button
                className="lg:hidden p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg border-2 border-black dark:border-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-black dark:border-white">
              <nav className="flex flex-col space-y-2">
                {[
                  { name: "HOME", id: "home" },
                  { name: "COMPETITIONS", id: "competitions" },
                  { name: "ABOUT", id: "about" },
                  { name: "CONTACT", id: "contact" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left px-4 py-3 text-sm font-black text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-yellow-500 rounded-lg transition-all duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden bg-white dark:bg-gray-900"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-400/30 dark:bg-yellow-500/20 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/30 dark:bg-cyan-500/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/20 dark:bg-pink-500/10 rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <div className="space-y-8 lg:space-y-12">
            <div className="inline-flex items-center px-6 py-3 bg-cyan-400 text-black text-sm font-black rounded-full border-2 border-black cursor-pointer group">
              <Sparkles className="mr-3 h-5 w-5" />
              PLATFORM KOMPETISI TAEKWONDO MASA DEPAN
              <Star className="ml-3 h-5 w-5 text-yellow-600" />
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight">
                <span className="block text-black dark:text-white">Daftar</span>
                <div className="relative inline-block">
                  <span className="block text-yellow-400 dark:text-yellow-500">Pertandingan</span>
                  <div className="absolute -bottom-4 left-0 right-0 h-6 bg-pink-400 dark:bg-pink-500 -z-10"></div>
                </div>
                <span className="block text-2xl md:text-4xl lg:text-5xl font-black text-black dark:text-white mt-6">
                  TANPA LIMITS
                </span>
              </h1>

              <p className="text-xl md:text-2xl lg:text-3xl text-black dark:text-white leading-relaxed max-w-4xl mx-auto">
                Bergabunglah dengan{" "}
                <span className="font-black bg-cyan-400 dark:bg-cyan-500 px-2">revolusi digital</span> dalam dunia
                kompetisi taekwondo dan raih{" "}
                <span className="font-black bg-pink-400 dark:bg-pink-500 px-2">prestasi terbaik</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="group bg-yellow-400 hover:bg-yellow-500 text-black font-black px-12 py-6 rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-xl"
                onClick={() => scrollToSection("competitions")}
              >
                <Zap className="mr-4 h-6 w-6" />
                MULAI KOMPETISI
                <ArrowRight className="ml-4 h-6 w-6" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-4 border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-12 py-6 rounded-xl transition-all duration-200 text-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] group bg-transparent"
              >
                <Trophy className="mr-4 h-6 w-6 text-yellow-500" />
                LIHAT DEMO
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              {[
                {
                  icon: Trophy,
                  label: "ACTIVE COMPETITIONS",
                  value: competitions.filter((c) => isCompetitionOpen(c.status)).length.toString(),
                  color: "bg-yellow-400 dark:bg-yellow-500",
                  borderColor: "border-black",
                },
                {
                  icon: Users,
                  label: "REGISTERED ATHLETES",
                  value: "5,000+",
                  color: "bg-cyan-400 dark:bg-cyan-500",
                  borderColor: "border-black",
                },
                {
                  icon: Award,
                  label: "AVAILABLE CATEGORIES",
                  value: "50+",
                  color: "bg-pink-400 dark:bg-pink-500",
                  borderColor: "border-black",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`group p-8 ${stat.color} rounded-xl border-4 ${stat.borderColor} shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] transition-all duration-300 cursor-pointer hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)]`}
                >
                  <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <stat.icon className="h-10 w-10 text-black" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-black mb-3">{stat.value}</div>
                  <div className="text-black font-bold text-lg">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section id="competitions" className="py-32 px-4 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-pink-400 dark:bg-pink-500 text-black text-sm font-black rounded-full border-2 border-black cursor-pointer group mb-8">
              <Trophy className="mr-3 h-5 w-5" />
              KOMPETISI PREMIUM TERSEDIA
              <Sparkles className="ml-3 h-5 w-5" />
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight text-black dark:text-white">
              <span className="block">DISCOVER</span>
              <div className="relative inline-block">
                <span className="block text-cyan-400 dark:text-cyan-500">EXCELLENCE</span>
                <div className="absolute -bottom-4 left-0 right-0 h-6 bg-yellow-400 dark:bg-yellow-500 -z-10"></div>
              </div>
            </h2>

            <p className="text-black dark:text-white text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed mb-16 font-bold">
              Temukan kompetisi yang sesuai dengan passion dan skill level Anda dari koleksi premium kami
            </p>

            {/* Search and Filter */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-black dark:text-white" />
                    <Input
                      placeholder="Cari kompetisi impian Anda..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 bg-gray-100 dark:bg-gray-800 border-2 border-black dark:border-white focus:border-yellow-400 dark:focus:border-yellow-500 focus:ring-yellow-400 dark:focus:ring-yellow-500 rounded-lg h-14 text-lg shadow-none text-black dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black dark:text-white" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-12 pr-8 bg-white dark:bg-gray-800 border-2 border-black dark:border-white focus:border-yellow-400 dark:focus:border-yellow-500 rounded-lg h-14 text-black dark:text-white appearance-none cursor-pointer transition-all duration-300 text-lg min-w-[200px]"
                      >
                        <option value="all">Semua Status</option>
                        <option value="open">Masih Terbuka</option>
                        <option value="closed">Tutup</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black dark:text-white pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] overflow-hidden h-[520px]"
                >
                  <div className="p-6 flex-1">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-pulse"></div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-32 h-32 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-12 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
                <Trophy className="h-16 w-16 text-black" />
              </div>
              <h3 className="text-3xl font-black text-black dark:text-white mb-6">
                {searchTerm || filterStatus !== "all" ? "TIDAK ADA HASIL DITEMUKAN" : "BELUM ADA KOMPETISI"}
              </h3>
              <p className="text-black dark:text-white text-xl max-w-md mx-auto leading-relaxed font-bold">
                {searchTerm || filterStatus !== "all"
                  ? "Coba ubah kata kunci atau filter untuk hasil yang lebih baik"
                  : "Kompetisi premium akan segera hadir. Pantau terus untuk update terbaru!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCompetitions.map((competition, index) => {
                const isOpen = isCompetitionOpen(competition.status)

                return (
                  <Card
                    key={competition.id}
                    className="group bg-white dark:bg-gray-900 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] overflow-hidden transition-all duration-300 flex flex-col h-[520px] cursor-pointer"
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-black text-black dark:text-white group-hover:text-yellow-400 dark:group-hover:text-yellow-500 transition-colors duration-300 line-clamp-2 leading-tight flex-1 pr-4">
                          {competition.nama}
                        </h3>
                        <Badge
                          className={`${
                            isOpen ? "bg-green-400 hover:bg-green-500" : "bg-red-400 hover:bg-red-500"
                          } text-black font-black px-3 py-1 rounded-lg border-2 border-black`}
                        >
                          {getStatusText(competition.status)}
                        </Badge>
                      </div>

                      <div className="text-black dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors duration-300 mb-6 flex-1">
                        <div className="text-sm leading-relaxed bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-black dark:border-white h-full">
                          <pre className="whitespace-pre-wrap font-sans text-black dark:text-white overflow-hidden">
                            {getShortDescription(competition.deskripsi)}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <Button
                          size="sm"
                          className="bg-cyan-400 hover:bg-white text-black hover:text-black border-2 border-black font-black px-4 py-2 rounded-lg transition-all duration-200"
                          onClick={() => handleViewDetail(competition)}
                        >
                          <Eye className="mr-2 h-5 w-5" />
                          LIHAT DETAIL
                        </Button>
                        <div className="flex items-center space-x-2 text-xs text-black dark:text-white font-bold">
                          <Calendar className="h-4 w-4" />
                          <span>Terbatas</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      {isOpen ? (
                        <Link href={`/register/${competition.id}`}>
                          <Button
                            className="w-full font-black py-5 rounded-xl transition-all duration-200 bg-yellow-400 hover:bg-yellow-500 text-black text-lg border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                            onClick={() => {
                              showToast(`Mengarahkan ke pendaftaran ${competition.nama}`, "info", <Trophy />)
                            }}
                          >
                            <Trophy className="mr-3 h-6 w-6" />
                            DAFTAR SEKARANG
                            <ArrowRight className="ml-3 h-6 w-6" />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full font-black py-5 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-lg border-4 border-gray-500"
                          disabled
                        >
                          <X className="mr-3 h-6 w-6" />
                          PENDAFTARAN DITUTUP
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-4 bg-black text-white relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center px-6 py-3 bg-cyan-400 text-black text-sm font-black rounded-full border-2 border-white cursor-pointer group mb-12">
              <div className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse"></div>
              DIPERCAYA OLEH 15,000+ ATLET PROFESIONAL
              <Sparkles className="ml-3 h-5 w-5" />
            </div>

            <div className="mb-20">
              <h3 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
                <span className="block text-white">NEXT-GEN</span>
                <div className="relative inline-block">
                  <span className="block text-yellow-400">SPORTS PLATFORM</span>
                  <div className="absolute -bottom-4 left-0 right-0 h-6 bg-pink-400 -z-10"></div>
                </div>
              </h3>
              <p className="text-xl md:text-2xl text-white leading-relaxed max-w-4xl mx-auto font-bold">
                Teknologi AI terdepan bertemu dengan passion olahraga untuk menciptakan{" "}
                <span className="bg-cyan-400 text-black px-2">pengalaman kompetisi</span> yang revolusioner
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {[
                {
                  emoji: "🚀",
                  title: "AI-POWERED",
                  description: "Algoritma cerdas untuk matching kompetisi yang sempurna",
                  color: "bg-yellow-400",
                  delay: 0,
                },
                {
                  emoji: "🛡️",
                  title: "ULTRA SECURE",
                  description: "Keamanan tingkat enterprise dengan enkripsi end-to-end",
                  color: "bg-cyan-400",
                  delay: 0.1,
                },
                {
                  emoji: "📊",
                  title: "REAL-TIME ANALYTICS",
                  description: "Dashboard interaktif dengan insights mendalam",
                  color: "bg-pink-400",
                  delay: 0.2,
                },
                {
                  emoji: "🌐",
                  title: "GLOBAL NETWORK",
                  description: "Terhubung dengan komunitas atlet di seluruh dunia",
                  color: "bg-green-400",
                  delay: 0.3,
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group relative ${feature.color} rounded-xl p-8 border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] transition-all duration-300 cursor-pointer h-full`}
                >
                  <div className="text-4xl mb-6">{feature.emoji}</div>
                  <h4 className="text-xl font-black text-black mb-4">{feature.title}</h4>
                  <p className="text-black leading-relaxed text-sm font-bold">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16">
              <Button
                size="lg"
                className="group bg-yellow-400 hover:bg-yellow-500 text-black font-black px-12 py-6 rounded-xl border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] transition-all duration-200 text-xl"
                onClick={() => scrollToSection("competitions")}
              >
                <Zap className="mr-4 h-6 w-6" />
                MULAI PERJALANAN ANDA
                <ArrowRight className="ml-4 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-white dark:bg-gray-900 text-black dark:text-white py-24 px-4 relative overflow-hidden border-t-4 border-black dark:border-white"
      >
        <div className="container mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-xl flex items-center justify-center border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
                  <Trophy className="h-8 w-8 text-black" />
                </div>
                <div>
                  <span className="text-3xl font-black text-black dark:text-white">Competition Hub</span>
                  <p className="text-black dark:text-white text-base font-bold">NEXT-GEN SPORTS PLATFORM</p>
                </div>
              </div>
              <p className="text-black dark:text-white mb-10 leading-relaxed max-w-md text-xl font-bold">
                Menghubungkan atlet berbakat dengan kompetisi berkualitas tinggi untuk menciptakan generasi juara masa
                depan dengan teknologi terdepan.
              </p>
              <div className="flex space-x-4">
                {["Facebook", "Instagram", "Twitter", "LinkedIn"].map((social, index) => (
                  <div
                    key={social}
                    className="w-14 h-14 bg-cyan-400 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-600 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 group border-2 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
                  >
                    <Globe className="h-6 w-6 text-black" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-black dark:text-white font-black mb-8 text-xl">QUICK LINKS</h4>
              <ul className="space-y-4">
                {["HOME", "COMPETITIONS", "ABOUT", "CONTACT"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-yellow-500 transition-colors duration-300 text-xl inline-block font-bold"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-black dark:text-white font-black mb-8 text-xl">SUPPORT</h4>
              <ul className="space-y-4">
                {["FAQ", "HELP CENTER", "CONTACT SUPPORT", "PRIVACY POLICY"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-black dark:text-white hover:text-cyan-400 dark:hover:text-cyan-500 transition-colors duration-300 text-xl inline-block font-bold"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t-4 border-black dark:border-white pt-12 text-center">
            <p className="text-black dark:text-white text-xl font-bold">
              © 2024 COMPETITION HUB. ALL RIGHTS RESERVED. BUILT WITH ❤️ FOR THE FUTURE OF SPORTS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
