"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"

// UI Components
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

// Icons
import {
  ArrowRight,
  ArrowUp,
  Award,
  Bot,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Flame,
  Globe,
  Layers,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  Paperclip,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react"

// Type definitions
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

// Helper functions
const formatBotResponse = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>")
}

const isCompetitionOpen = (status: string | number) => {
  if (typeof status === "number") {
    return status === 1
  }
  return status === "Aktif" || status === "Masih terbuka" || status === "1"
}

const getStatusText = (status: string | number) => {
  if (typeof status === "number") {
    return status === 1 ? "OPEN" : "CLOSED"
  }
  return status
}

const getShortDescription = (description: string) => {
  if (!description) return ""
  return description.length > 100 ? description.substring(0, 100) + "..." : description
}

// Main component
export default function HomePage() {
  // State management
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [scrollY, setScrollY] = useState(0)
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

  // Quick actions for common questions
  const quickActions = [
    { id: "registration", text: "Cara mendaftar kompetisi", icon: "📝" },
    { id: "requirements", text: "Syarat peserta", icon: "✅" },
    { id: "cost", text: "Biaya pendaftaran", icon: "💰" },
    { id: "categories", text: "Kategori lomba", icon: "🏆" },
    { id: "contact", text: "Hubungi admin", icon: "📞" },
  ]

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find((a) => a.id === actionId)
    if (action) {
      // Show user message first
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: action.text,
        isBot: false,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMessage])

      // Then show bot response with typing indicator
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

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const competitionsRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Scroll animations
  const { scrollYProgress } = useScroll()
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const competitionY = useTransform(scrollYProgress, [0.2, 0.3], [100, 0])

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  // Effects
  useEffect(() => {
    fetchCompetitions()

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setShowScrollTop(currentScrollY > 500)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Data fetching
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

  // Toast functions
  const showToast = (message: string, type: "success" | "error" | "info", icon?: React.ReactNode) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, icon }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Filter competitions
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (activeFilter === "open") {
      matchesFilter = isCompetitionOpen(comp.status)
    } else if (activeFilter === "closed") {
      matchesFilter = !isCompetitionOpen(comp.status)
    }

    return matchesSearch && matchesFilter
  })

  // Navigation functions
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Competition functions
  const handleViewDetail = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCompetition(null)
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
    const normalizedInput = lowerInput.replace(/[.,!?;]/g, "").trim()

    // Enhanced response templates with more comprehensive patterns
    const responses = {
      registration: {
        patterns: [
          /cara.*daftar/,
          /gimana.*daftar/,
          /bagaimana.*mendaftar/,
          /bagaimana.*cara.*mendaftar/,
          /prosedur.*pendaftaran/,
          /langkah.*daftar/,
          /proses.*registrasi/,
          /daftar.*gimana/,
          /daftar.*bagaimana/,
          /mau.*daftar/,
          /ingin.*daftar/,
          /pendaftaran.*gimana/,
        ],
        response: () =>
          `Kamu bisa langsung daftar lewat website kami di halaman "Pendaftaran". Isi data lengkap peserta, pilih kategori kejuaraan, dan ikuti langkah-langkah yang tersedia. Jangan lupa konfirmasi pembayaran yaa biar data kamu masuk ke sistem! 💻✅`,
      },

      requirements: {
        patterns: [
          /syarat.*peserta/,
          /siapa.*bisa.*ikut/,
          /persyaratan/,
          /kriteria.*peserta/,
          /boleh.*ikut/,
          /bisa.*ikut/,
          /syarat.*untuk.*mendaftar/,
          /apa.*saja.*syarat/,
          /umur.*\d+/,
          /anak.*umur/,
          /berumur.*\d+/,
          /usia.*\d+/,
          /tahun.*bisa/,
          /bisa.*bertanding/,
          /boleh.*bertanding/,
          /ikut.*lomba/,
          /minimal.*umur/,
          /maksimal.*umur/,
          /batasan.*usia/,
          /syarat.*usia/,
          /ketentuan.*peserta/,
        ],
        response: () =>
          `Kejuaraan ini terbuka untuk seluruh atlet taekwondo dari berbagai usia dan tingkatan sabuk, baik dari klub, sekolah, maupun mandiri. Untuk anak umur 10 tahun pasti bisa ikut! Kategori dibagi berdasarkan usia, jadi anak kamu akan bertanding dengan peserta seusianya. Pastikan sudah mendapatkan izin dari pelatih atau dojang ya! 🥋🔥`,
      },

      categories: {
        patterns: [
          /kategori.*lomba/,
          /jenis.*lomba/,
          /kategori.*tersedia/,
          /divisi.*apa/,
          /kelas.*lomba/,
          /kyorugi.*poomsae/,
          /kategori.*apa.*saja/,
          /pembagian.*kategori/,
          /kelompok.*umur/,
          /kelas.*usia/,
          /macam.*kategori/,
          /ada.*kategori.*apa/,
          /jenis.*pertandingan/,
        ],
        response: () =>
          `Terdapat beberapa kategori seperti Kyorugi (tarung), Poomsae (jurus), dan Festival Taekwondo. Masing-masing kategori dibagi berdasarkan usia, berat badan, dan tingkat sabuk. Untuk anak-anak ada kategori khusus sesuai kelompok umur. Pilih sesuai kemampuan ya! 💥`,
      },

      equipment: {
        patterns: [
          /perlengkapan.*lomba/,
          /peralatan.*bawa/,
          /body.*protector/,
          /head.*gear/,
          /mouthguard/,
          /equipment/,
          /peserta.*harus.*membawa/,
          /alat.*pelindung/,
          /gear.*apa/,
          /atlet.*wajib.*membawa/,
          /wajib.*bawa.*peralatan/,
          /peralatan.*sendiri/,
          /perlengkapan.*sendiri/,
          /bawa.*perlengkapan/,
          /perlu.*bawa.*apa/,
          /harus.*bawa.*apa/,
          /pelindung.*badan/,
          /safety.*gear/,
          /protective.*gear/,
        ],
        response: () =>
          `Peserta tidak diwajibkan membawa perlengkapan sendiri, karena perlengkapan standar akan disediakan oleh klub atau dojang masing-masing. Namun, jika peserta memiliki perlengkapan pribadi yang sesuai standar, diperbolehkan untuk membawanya dan menggunakannya dalam pertandingan. 🥋✅`,
      },

      cost: {
        patterns: [
          /biaya.*pendaftaran/,
          /harga.*daftar/,
          /berapa.*bayar/,
          /tarif.*lomba/,
          /ongkos.*ikut/,
          /fee/,
          /ada.*biaya/,
          /berapa.*biaya/,
          /mahal.*gak/,
          /murah.*gak/,
          /harga.*berapa/,
          /bayar.*berapa/,
          /cost/,
          /price/,
          /gratis.*gak/,
          /berbayar.*gak/,
        ],
        response: () =>
          `Biaya pendaftaran berbeda tergantung kejuaraan nya, kategori dan jumlah yang diikuti. Info lengkap bisa kamu lihat di halaman "Biaya & Pembayaran" di website kami. Biasanya ada diskon untuk pendaftaran early bird lho! 💸📝`,
      },

      confirmation: {
        patterns: [
          /konfirmasi.*pendaftaran/,
          /tahu.*berhasil/,
          /jadwal.*lengkap/,
          /email.*konfirmasi/,
          /whatsapp.*konfirmasi/,
          /pendaftaran.*berhasil/,
          /kapan.*jadwal/,
          /jadwal.*kapan/,
          /tanggal.*berapa/,
          /hari.*apa/,
          /waktu.*pelaksanaan/,
          /jam.*berapa/,
          /lokasi.*dimana/,
          /tempat.*lomba/,
          /venue/,
        ],
        response: () =>
          `Setelah kamu mengisi formulir dan melakukan pembayaran, kamu akan menerima email atau WhatsApp konfirmasi dari panitia. Jadwal lengkap akan diumumkan H-3 sebelum acara via email dan juga diposting di website resmi. Info lokasi dan rundown acara juga akan disertakan! 📧📅`,
      },

      certificates: {
        patterns: [
          /sertifikat/,
          /medali/,
          /piagam/,
          /penghargaan/,
          /juara/,
          /hadiah/,
          /peserta.*mendapatkan/,
          /dapat.*apa/,
          /reward/,
          /prize/,
          /trophy/,
          /trofi/,
          /dapat.*sertifikat/,
          /dapat.*medali/,
          /semua.*peserta.*dapat/,
        ],
        response: () =>
          `Semua peserta akan mendapatkan e-sertifikat partisipasi. Untuk yang juara 1, 2, dan 3 akan mendapatkan medali dan piagam penghargaan. Ada juga hadiah menarik untuk kategori tertentu! Jadi, semangat terus yaa buat jadi yang terbaik! 🏅📜`,
      },

      spectators: {
        patterns: [
          /penonton/,
          /suporter/,
          /bawa.*teman/,
          /keluarga.*nonton/,
          /tiket.*penonton/,
          /boleh.*bawa/,
          /orang.*tua.*nonton/,
          /pendamping/,
          /supporter/,
          /audience/,
          /bisa.*ditonton/,
          /boleh.*nonton/,
        ],
        response: () =>
          `Boleh banget! Keluarga dan teman-teman bisa datang untuk memberikan support. Pastikan mengikuti aturan venue dan menjaga ketertiban ya. Biasanya ada tiket atau ID khusus untuk penonton yang dibagikan sebelum hari-H. 🎫🙌`,
      },

      refund: {
        patterns: [
          /refund/,
          /pembatalan/,
          /batal.*ikut/,
          /kembalikan.*uang/,
          /cancel/,
          /sudah.*daftar.*batal/,
          /uang.*kembali/,
          /bisa.*dibatalkan/,
          /gak.*jadi.*ikut/,
          /tidak.*jadi.*ikut/,
        ],
        response: () =>
          `Sayangnya, biaya pendaftaran yang sudah dibayarkan tidak bisa dikembalikan. Tapi tenang, nama kamu tetap akan terdaftar dan dapat e-sertifikat partisipasi jika diminta. Kalau ada force majeure, akan ada kebijakan khusus dari panitia. 🙏`,
      },

      greeting: {
        patterns: [
          /^(halo|hai|hello|hi|hey)$/,
          /selamat (pagi|siang|sore|malam)/,
          /assalamualaikum/,
          /permisi/,
          /ada.*yang.*bisa.*bantu/,
          /hub/,
          /halo.*bot/,
          /hai.*bot/,
          /test/,
          /testing/,
        ],
        response: () => {
          const greetings = [
            "Halo! 👋 Selamat datang di Competition Hub! Ada yang bisa saya bantu tentang kejuaraan taekwondo?",
            "Hi! 🌟 Senang bertemu dengan Anda! Mau tanya tentang perlombaan apa hari ini?",
            "Selamat datang! 🎉 Silakan tanyakan apa saja tentang kejuaraan taekwondo!",
            "Halo! 🥋 Saya siap membantu Anda dengan informasi lengkap tentang kompetisi taekwondo!",
          ]
          return greetings[Math.floor(Math.random() * greetings.length)]
        },
      },

      thanks: {
        patterns: [/terima kasih/, /makasih/, /thanks/, /thank you/, /thx/, /tengkyu/],
        response: () =>
          "Sama-sama! 🙏 Senang bisa membantu. Jangan ragu bertanya lagi ya! Semoga sukses di perlombaan! 🏆",
      },

      contact: {
        patterns: [
          /hubungi.*admin/,
          /kontak.*admin/,
          /cara.*menghubungi/,
          /bagaimana.*cara.*menghubungi/,
          /nomor.*admin/,
          /whatsapp.*admin/,
          /telepon.*admin/,
          /contact/,
          /cs/,
          /customer.*service/,
          /bantuan.*langsung/,
        ],
        response: () =>
          `Kamu bisa langsung hubungi admin kami di nomor WhatsApp (08xxxxxxxxxx) atau Sabem Danis (0882-9372-6256). Tim kami siap membantu kamu 24/7! Jangan ragu untuk bertanya ya! 📞💬`,
      },

      training: {
        patterns: [
          /latihan/,
          /training/,
          /persiapan.*lomba/,
          /gimana.*persiapan/,
          /tips.*latihan/,
          /cara.*latihan/,
          /persiapan.*fisik/,
          /mental.*preparation/,
        ],
        response: () =>
          `Untuk persiapan lomba, pastikan latihan rutin minimal 3x seminggu. Fokus pada teknik dasar, stamina, dan mental. Konsultasi dengan pelatih untuk program latihan yang tepat. Jangan lupa istirahat cukup dan nutrisi seimbang! 💪🥋`,
      },

      rules: {
        patterns: [
          /peraturan/,
          /rules/,
          /aturan.*lomba/,
          /ketentuan.*lomba/,
          /regulasi/,
          /tata.*tertib/,
          /aturan.*pertandingan/,
          /sistem.*penilaian/,
        ],
        response: () =>
          `Peraturan lomba mengikuti standar nasional dan internasional taekwondo. Akan ada briefing teknis sebelum pertandingan dimulai. Semua aturan detail akan diberikan saat konfirmasi pendaftaran. Pastikan baca dengan teliti ya! 📋⚖️`,
      },

      location: {
        patterns: [
          /lokasi/,
          /tempat/,
          /dimana.*lomba/,
          /venue/,
          /alamat/,
          /gedung.*apa/,
          /hall.*apa/,
          /tempat.*pertandingan/,
        ],
        response: () =>
          `Lokasi lomba akan diinformasikan setelah pendaftaran dikonfirmasi. Biasanya di gedung olahraga atau hall yang memadai. Info lengkap termasuk alamat, peta, dan akses transportasi akan dikirim via email/WA! 📍🏢`,
      },
    }

    // Enhanced intent detection function
    function detectIntent(input: string) {
      // First, try exact pattern matching
      for (const [intentName, intentData] of Object.entries(responses)) {
        for (const pattern of intentData.patterns) {
          if (pattern.test(input)) {
            return {
              intent: intentName,
              response: intentData.response,
            }
          }
        }
      }

      // If no exact match, try fuzzy matching for common keywords
      const keywords = {
        daftar: "registration",
        syarat: "requirements",
        kategori: "categories",
        peralatan: "equipment",
        perlengkapan: "equipment",
        biaya: "cost",
        harga: "cost",
        jadwal: "confirmation",
        sertifikat: "certificates",
        medali: "certificates",
        penonton: "spectators",
        lokasi: "location",
        tempat: "location",
        latihan: "training",
        peraturan: "rules",
        kontak: "contact",
        hubungi: "contact",
      }

      for (const [keyword, intent] of Object.entries(keywords)) {
        if (input.includes(keyword)) {
          const intentData = responses[intent as keyof typeof responses]
          if (intentData) {
            return {
              intent,
              response: intentData.response,
            }
          }
        }
      }

      return null
    }

    // Detect the intent
    const detectedIntent = detectIntent(normalizedInput)

    if (detectedIntent) {
      return detectedIntent.response()
    }

    // Enhanced fallback response
    return `Hmm, pertanyaan yang menarik! 🤔 Saya belum bisa menjawab pertanyaan spesifik itu, tapi jangan khawatir! Tim admin kami siap membantu langsung di WhatsApp (0851-5695-6953) atau Sabem Danis (0882-9372-6256). Mereka pasti bisa kasih jawaban yang lebih detail! 💪✨`
  }

  // Render components
  const renderToasts = () => (
    <div className="fixed top-6 right-6 z-50 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  const renderChatbot = () => (
    <div className="fixed bottom-6 right-6 z-50">
      {!chatOpen ? (
        <motion.button
          onClick={() => setChatOpen(true)}
          className="group relative w-16 h-16 bg-yellow-400 hover:bg-yellow-500 rounded-full shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black transition-all duration-200 flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="h-7 w-7 text-black" />
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </motion.div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
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
                <motion.button
                  onClick={() => setChatOpen(false)}
                  className="text-black hover:bg-black/10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
              <AnimatePresence>
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg border-2 ${
                        message.isBot
                          ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-black dark:border-white"
                          : "bg-yellow-400 dark:bg-yellow-500 text-black border-black"
                      }`}
                    >
                      {message.isBot ? (
                        <div
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatBotResponse(message.text) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      )}
                      <div
                        className={`text-xs mt-2 ${
                          message.isBot ? "text-gray-500 dark:text-gray-400" : "text-black/70"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-2 border-black dark:border-white">
                    <div className="flex space-x-2 items-center">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-black dark:bg-white rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-black dark:bg-white rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.1 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-black dark:bg-white rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Typing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions - Above Input */}
            <div className="border-t-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">BANTUAN CEPAT:</p>
              <div className="overflow-x-auto">
                <div className="flex space-x-2 pb-2" style={{ width: "max-content" }}>
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="flex items-center p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-xs whitespace-nowrap min-w-fit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mr-2">{action.icon}</span>
                      <span className="text-black dark:text-white font-medium">{action.text}</span>
                    </motion.button>
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
                    <motion.button
                      className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Paperclip className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                <motion.button
                  onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }}
                >
                  <Send className="h-5 w-5 text-black" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderScrollToTop = () =>
    showScrollTop && (
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 w-12 h-12 bg-cyan-400 hover:bg-cyan-500 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all duration-200 z-40 flex items-center justify-center"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }}
      >
        <ArrowUp className="h-6 w-6 text-black" />
      </motion.button>
    )

  const renderCompetitionModal = () =>
    showModal &&
    selectedCompetition && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/60"
          onClick={closeModal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_rgba(255,255,255,1)] max-w-3xl max-h-[90vh] overflow-y-auto w-full"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-400 hover:bg-red-500 rounded-full border-2 border-black flex items-center justify-center transition-all duration-200"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5 text-black" />
          </motion.button>

          <div className="p-8">
            <div className="mb-8">
              <motion.h2
                className="text-4xl font-black text-black dark:text-white mb-6 leading-tight"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {selectedCompetition.nama}
              </motion.h2>
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Badge
                  className={`${
                    isCompetitionOpen(selectedCompetition.status)
                      ? "bg-green-400 hover:bg-green-500"
                      : "bg-red-400 hover:bg-red-500"
                  } text-black font-black px-6 py-2 text-lg mb-6 rounded-lg border-2 border-black`}
                >
                  {getStatusText(selectedCompetition.status)}
                </Badge>
              </motion.div>
            </div>

            <div className="space-y-8">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <h3 className="text-2xl font-black text-black dark:text-white mb-6 flex items-center">
                  <Trophy className="mr-4 h-7 w-7 text-yellow-400" />
                  DETAIL KOMPETISI
                </h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-8 border-2 border-black dark:border-white">
                  <pre className="text-base text-black dark:text-white leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedCompetition.deskripsi}
                  </pre>
                </div>
              </motion.div>

              <motion.div
                className="pt-8 border-t-2 border-black dark:border-white"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href={isCompetitionOpen(selectedCompetition.status) ? `/register/${selectedCompetition.id}` : "#"}
                >
                  <motion.button
                    className={`w-full font-black py-6 rounded-xl transition-all duration-300 text-xl border-4 ${
                      isCompetitionOpen(selectedCompetition.status)
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-500"
                    }`}
                    disabled={!isCompetitionOpen(selectedCompetition.status)}
                    whileHover={isCompetitionOpen(selectedCompetition.status) ? { scale: 1.02 } : {}}
                    whileTap={
                      isCompetitionOpen(selectedCompetition.status)
                        ? { scale: 0.98, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }
                        : {}
                    }
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
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    )

  const renderHeader = () => (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center space-x-3 group cursor-pointer" whileHover={{ scale: 1.05 }}>
            <motion.div
              className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              whileHover={{ rotate: 10, shadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Trophy className="h-6 w-6 text-black" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black text-black dark:text-white">COMPETITION HUB</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">NEXT-GEN PLATFORM</p>
            </div>
          </motion.div>

          <nav className="hidden lg:flex space-x-1">
            {[
              { name: "HOME", id: "home" },
              { name: "COMPETITIONS", id: "competitions" },
              { name: "ABOUT", id: "about" },
              { name: "CONTACT", id: "contact" },
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="relative px-4 py-2 text-sm font-black text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-all duration-200 rounded-lg border-2 border-transparent hover:border-black dark:hover:border-white"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
              </motion.button>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <motion.div
              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border-2 border-black dark:border-white"
              whileHover={{ scale: 1.05 }}
            >
              <Sun className="h-4 w-4 text-yellow-500" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-cyan-400"
              />
              <Moon className="h-4 w-4 text-cyan-500" />
            </motion.div>

            <motion.button
              className="lg:hidden p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg border-2 border-black dark:border-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="lg:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-black dark:border-white"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="flex flex-col space-y-2">
                {[
                  { name: "HOME", id: "home" },
                  { name: "COMPETITIONS", id: "competitions" },
                  { name: "ABOUT", id: "about" },
                  { name: "CONTACT", id: "contact" },
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left px-4 py-3 text-sm font-black text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-yellow-500 rounded-lg transition-all duration-200"
                    whileHover={{ x: 10 }}
                  >
                    {item.name}
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )

  const renderHeroSection = () => (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden bg-white dark:bg-gray-900"
      ref={heroRef}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-400/30 dark:bg-yellow-500/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/30 dark:bg-cyan-500/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/20 dark:bg-pink-500/10 rounded-full"></div>
      </div>

      <motion.div
        className="container mx-auto max-w-6xl relative z-10 text-center"
        style={{ scale: heroScale, opacity: heroOpacity }}
      >
        <div className="space-y-8 lg:space-y-12">
          <motion.div
            className="inline-flex items-center px-6 py-3 bg-cyan-400 text-black text-sm font-black rounded-full border-2 border-black cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Sparkles className="mr-3 h-5 w-5" />
            PLATFORM KOMPETISI TAEKWONDO MASA DEPAN
            <Star className="ml-3 h-5 w-5 text-yellow-600" />
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                className="block text-black dark:text-white"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Daftar
              </motion.span>
              <motion.div
                className="relative inline-block"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="block text-yellow-400 dark:text-yellow-500">Pertandingan</span>
                <motion.div
                  className="absolute -bottom-4 left-0 right-0 h-6 bg-pink-400 dark:bg-pink-500 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                ></motion.div>
              </motion.div>
              <motion.span
                className="block text-2xl md:text-4xl lg:text-5xl font-black text-black dark:text-white mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                LIMITS
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl lg:text-3xl text-black dark:text-white leading-relaxed max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Bergabunglah dengan <span className="font-black bg-cyan-400 dark:bg-cyan-500 px-2">revolusi digital</span>{" "}
              dalam dunia kompetisi taekwondo dan raih{" "}
              <span className="font-black bg-pink-400 dark:bg-pink-500 px-2">prestasi terbaik</span>
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="group bg-yellow-400 hover:bg-yellow-500 text-black font-black px-12 py-6 rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-xl"
                onClick={() => scrollToSection("competitions")}
              >
                <Zap className="mr-4 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                MULAI KOMPETISI
                <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                className="border-4 border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-12 py-6 rounded-xl transition-all duration-200 text-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] group"
              >
                <Flame className="mr-4 h-6 w-6 text-red-500 group-hover:scale-110 transition-all duration-300" />
                LIHAT DEMO
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
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
              <motion.div
                key={index}
                className={`group p-8 ${stat.color} rounded-xl border-4 ${stat.borderColor} shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] transition-all duration-300 cursor-pointer`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ y: -10, shadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
              >
                <motion.div
                  className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                  whileHover={{ rotate: 12, shadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className="h-10 w-10 text-black" />
                </motion.div>
                <div className="text-4xl lg:text-5xl font-black text-black mb-3">{stat.value}</div>
                <div className="text-black font-bold text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  )

  const renderCompetitionsSection = () => (
    <section
      id="competitions"
      className="py-32 px-4 bg-gray-100 dark:bg-gray-800 relative overflow-hidden"
      ref={competitionsRef}
    >
      <motion.div style={{ y: competitionY }} className="container mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            className="inline-flex items-center px-6 py-3 bg-pink-400 dark:bg-pink-500 text-black text-sm font-black rounded-full border-2 border-black cursor-pointer group mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Trophy className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            KOMPETISI PREMIUM TERSEDIA
            <Sparkles className="ml-3 h-5 w-5 group-hover:scale-125 transition-transform duration-300" />
          </motion.div>

          <motion.h2
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight text-black dark:text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span className="block" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              DISCOVER
            </motion.span>
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="block text-cyan-400 dark:text-cyan-500">EXCELLENCE</span>
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-6 bg-yellow-400 dark:bg-yellow-500 -z-10"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.6 }}
              ></motion.div>
            </motion.div>
          </motion.h2>

          <motion.p
            className="text-black dark:text-white text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed mb-16 font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Temukan kompetisi yang sesuai dengan passion dan skill level Anda dari koleksi premium kami
          </motion.p>

          {/* Search and Filter */}
          <motion.div
            className="max-w-4xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
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
                  <motion.button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-6 py-3 rounded-lg font-black transition-all duration-200 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    FILTER
                    {showFilters ? <ChevronDown className="h-5 w-5 ml-2" /> : <ChevronRight className="h-5 w-5 ml-2" />}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {[
                      { id: "all", label: "SEMUA", icon: Layers },
                      { id: "open", label: "TERBUKA", icon: CheckCircle },
                      { id: "closed", label: "TUTUP", icon: Clock },
                    ].map((filter) => (
                      <motion.button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex items-center justify-center px-4 py-3 rounded-lg font-black transition-all duration-200 border-2 ${
                          activeFilter === filter.id
                            ? "bg-cyan-400 dark:bg-cyan-500 text-black border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                            : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-black dark:border-white hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }}
                      >
                        <filter.icon className="h-5 w-5 mr-2" />
                        {filter.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] overflow-hidden h-[520px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="p-6 flex-1">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-pulse"></div>
                </div>
                <div className="p-6 pt-0">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <motion.div className="text-center py-24" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div
              className="w-32 h-32 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-12 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
              whileHover={{ scale: 1.1, rotate: 10, shadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Trophy className="h-16 w-16 text-black" />
            </motion.div>
            <h3 className="text-3xl font-black text-black dark:text-white mb-6">
              {searchTerm || activeFilter !== "all" ? "TIDAK ADA HASIL DITEMUKAN" : "BELUM ADA KOMPETISI"}
            </h3>
            <p className="text-black dark:text-white text-xl max-w-md mx-auto leading-relaxed font-bold">
              {searchTerm || activeFilter !== "all"
                ? "Coba ubah kata kunci atau filter untuk hasil yang lebih baik"
                : "Kompetisi premium akan segera hadir. Pantau terus untuk update terbaru!"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompetitions.map((competition, index) => {
              const isOpen = isCompetitionOpen(competition.status)

              return (
                <motion.div
                  key={competition.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="group bg-white dark:bg-gray-900 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] overflow-hidden transition-all duration-300 flex flex-col h-[520px] cursor-pointer">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-black text-black dark:text-white group-hover:text-yellow-400 dark:group-hover:text-yellow-500 transition-colors duration-300 line-clamp-2 leading-tight flex-1 pr-4">
                          {competition.nama}
                        </h3>
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Badge
                            className={`${
                              isOpen ? "bg-green-400 hover:bg-green-500" : "bg-red-400 hover:bg-red-500"
                            } text-black font-black px-3 py-1 rounded-lg border-2 border-black`}
                          >
                            {getStatusText(competition.status)}
                          </Badge>
                        </motion.div>
                      </div>

                      <div className="text-black dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors duration-300 mb-6 flex-1">
                        <div className="text-sm leading-relaxed bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-black dark:border-white h-full">
                          <pre className="whitespace-pre-wrap font-sans text-black dark:text-white overflow-hidden">
                            {getShortDescription(competition.deskripsi)}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Button
                            size="sm"
                            className="bg-cyan-400 hover:bg-white text-black hover:text-black border-2 border-black font-black px-4 py-2 rounded-lg transition-all duration-200"
                            onClick={() => handleViewDetail(competition)}
                          >
                            <Eye className="mr-2 h-5 w-5" />
                            LIHAT DETAIL
                          </Button>
                        </motion.div>
                        <div className="flex items-center space-x-2 text-xs text-black dark:text-white font-bold">
                          <Calendar className="h-4 w-4" />
                          <span>Terbatas</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      {isOpen ? (
                        <Link href={`/register/${competition.id}`}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98, shadow: "0px 0px 0 0 rgba(0,0,0,1)" }}
                          >
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
                          </motion.div>
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
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </section>
  )

  const renderAboutSection = () => (
    <section id="about" className="py-32 px-4 bg-black text-white relative overflow-hidden" ref={aboutRef}>
      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="inline-flex items-center px-6 py-3 bg-cyan-400 text-black text-sm font-black rounded-full border-2 border-white cursor-pointer group mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <motion.div
              className="w-3 h-3 bg-white rounded-full mr-3"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            />
            DIPERCAYA OLEH 15,000+ ATLET PROFESIONAL
            <Sparkles className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
          </motion.div>

          <div className="mb-20">
            <motion.h3
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                className="block text-white"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                NEXT-GEN
              </motion.span>
              <motion.div
                className="relative inline-block"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="block text-yellow-400">SPORTS PLATFORM</span>
                <motion.div
                  className="absolute -bottom-4 left-0 right-0 h-6 bg-pink-400 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                ></motion.div>
              </motion.div>
            </motion.h3>
            <motion.p
              className="text-xl md:text-2xl text-white leading-relaxed max-w-4xl mx-auto font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Teknologi AI terdepan bertemu dengan passion olahraga untuk menciptakan{" "}
              <span className="bg-cyan-400 text-black px-2">pengalaman kompetisi</span> yang revolusioner
            </motion.p>
          </div>

          {/* Feature Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
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
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + feature.delay }}
                whileHover={{ y: -10, scale: 1.05 }}
              >
                <div
                  className={`relative ${feature.color} rounded-xl p-8 border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] transition-all duration-300 cursor-pointer h-full`}
                >
                  <motion.div
                    className="text-4xl mb-6"
                    whileHover={{ scale: 1.2, rotate: 12 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {feature.emoji}
                  </motion.div>
                  <h4 className="text-xl font-black text-black mb-4">{feature.title}</h4>
                  <p className="text-black leading-relaxed text-sm font-bold">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, shadow: "0px 0px 0 0 rgba(255,255,255,1)" }}
            >
              <Button
                size="lg"
                className="group bg-yellow-400 hover:bg-yellow-500 text-black font-black px-12 py-6 rounded-xl border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)] transition-all duration-200 text-xl"
                onClick={() => scrollToSection("competitions")}
              >
                <Zap className="mr-4 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                MULAI PERJALANAN ANDA
                <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )

  const renderFooter = () => (
    <footer
      id="contact"
      className="bg-white dark:bg-gray-900 text-black dark:text-white py-24 px-4 relative overflow-hidden border-t-4 border-black dark:border-white"
      ref={contactRef}
    >
      <div className="container mx-auto relative">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="md:col-span-2">
            <motion.div className="flex items-center space-x-4 mb-10" whileHover={{ scale: 1.05 }}>
              <motion.div
                className="w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-xl flex items-center justify-center border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
                whileHover={{ scale: 1.1, rotate: 10, shadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Trophy className="h-8 w-8 text-black" />
              </motion.div>
              <div>
                <span className="text-3xl font-black text-black dark:text-white">Ozone Champions</span>
                <p className="text-black dark:text-white text-base font-bold">NEXT-GEN SPORTS PLATFORM</p>
              </div>
            </motion.div>
            <p className="text-black dark:text-white mb-10 leading-relaxed max-w-md text-xl font-bold">
              Menghubungkan atlet berbakat dengan kompetisi berkualitas tinggi untuk menciptakan generasi juara masa
              depan dengan teknologi terdepan.
            </p>
            <div className="flex space-x-4">
              {["Facebook", "Instagram", "Twitter", "LinkedIn"].map((social, index) => (
                <motion.div
                  key={social}
                  className="w-14 h-14 bg-cyan-400 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-600 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 group border-2 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
                  whileHover={{ scale: 1.1, y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Globe className="h-6 w-6 text-black group-hover:rotate-12 transition-transform duration-300" />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h4 className="text-black dark:text-white font-black mb-8 text-xl">QUICK LINKS</h4>
            <ul className="space-y-4">
              {["HOME", "COMPETITIONS", "ABOUT", "CONTACT"].map((link, index) => (
                <motion.li
                  key={link}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <motion.a
                    href="#"
                    className="text-black dark:text-white hover:text-yellow-400 dark:hover:text-yellow-500 transition-colors duration-300 text-xl inline-block font-bold"
                    whileHover={{ x: 10 }}
                  >
                    {link}
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h4 className="text-black dark:text-white font-black mb-8 text-xl">SUPPORT</h4>
            <ul className="space-y-4">
              {["FAQ", "HELP CENTER", "CONTACT SUPPORT", "PRIVACY POLICY"].map((link, index) => (
                <motion.li
                  key={link}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <motion.a
                    href="#"
                    className="text-black dark:text-white hover:text-cyan-400 dark:hover:text-cyan-500 transition-colors duration-300 text-xl inline-block font-bold"
                    whileHover={{ x: 10 }}
                  >
                    {link}
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t-4 border-black dark:border-white pt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-black dark:text-white text-xl font-bold">
            © 2024 COMPETITION HUB. ALL RIGHTS RESERVED. BUILT WITH ❤️ FOR THE FUTURE OF SPORTS.
          </p>
        </motion.div>
      </div>
    </footer>
  )

  // Main render
  return (
    <div
      className={`min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white overflow-x-hidden relative ${theme}`}
    >
      <AnimatePresence>{renderToasts()}</AnimatePresence>
      {renderChatbot()}
      <AnimatePresence>{renderScrollToTop()}</AnimatePresence>
      <AnimatePresence>{renderCompetitionModal()}</AnimatePresence>
      {renderHeader()}
      {renderHeroSection()}
      {renderCompetitionsSection()}
      {renderAboutSection()}
      {renderFooter()}
    </div>
  )
}
