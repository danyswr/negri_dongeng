"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Trophy,
  User,
  Weight,
  Ruler,
  Award,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Loader2,
  ArrowRight,
  Download,
  Home,
  X,
  Sparkles,
  Zap,
  Sun,
  Moon,
  ShirtIcon,
} from "lucide-react"
import Link from "next/link"

interface Competition {
  id: string
  nama: string
  deskripsi: string
  poster: string
  status: string
}

interface FormData {
  idKejuaraan: string
  nama: string
  gender: string
  sabuk: string
  tempatTanggalLahir: string
  dojang: string
  berat: string
  tinggi: string
  kategori: string[]
  kelas: string
  orderJersey: boolean
  jerseySize: string
}

interface RegistrationData extends FormData {
  registrationId: string
  timestamp: string
  competitionName: string
}

interface ToastProps {
  id: string
  message: string
  type: "success" | "error" | "info"
  icon?: React.ReactNode
}

// Daftar dojang/klub untuk dropdown
const dojangOptions = ["Pamulang", "MRBJ Sabtu", "MRBJ Minggu", "CBD", "Lemigas", "UPJ", "Jaren","Dallas"]

// Daftar ukuran jersey
const jerseySizes = ["XS", "S", "M", "L", "XL", "XXL"]

export default function RegisterPage() {
  const params = useParams()
  const competitionId = params.id as string
  const invoiceRef = useRef<HTMLDivElement>(null)

  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [customDojang, setCustomDojang] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: "kyorugi", label: "Kyorugi", checked: false },
    { id: "poomsae", label: "Poomsae", checked: false },
    { id: "UKT", label: "UKT", checked: false },
  ])

  const [formData, setFormData] = useState<FormData>({
    idKejuaraan: competitionId,
    nama: "",
    gender: "",
    sabuk: "",
    tempatTanggalLahir: "",
    dojang: "",
    berat: "",
    tinggi: "",
    kategori: [],
    kelas: "",
    orderJersey: false,
    jerseySize: "",
  })

  const totalSteps = 3

  // Theme toggle
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark")
  }

  useEffect(() => {
    fetchCompetition()
  }, [competitionId])

  useEffect(() => {
    // Calculate progress based on filled fields
    // Count all required fields except jerseySize which is conditional
    const requiredFields = ["nama", "gender", "sabuk", "tempatTanggalLahir", "dojang", "berat", "tinggi", "kelas"]

    // Add kategori as a special case - it's an array but we need at least one selection
    const filledRequiredFields = requiredFields.filter((field) => formData[field as keyof FormData] !== "").length
    const hasCategories = formData.kategori.length > 0

    // Calculate total fields to consider
    const totalRequiredFields = requiredFields.length + 1 // +1 for kategori
    const totalFieldsToConsider = formData.orderJersey ? totalRequiredFields + 1 : totalRequiredFields

    // Calculate filled fields
    const filledFields =
      filledRequiredFields + (hasCategories ? 1 : 0) + (formData.orderJersey && formData.jerseySize ? 1 : 0)

    setProgress((filledFields / totalFieldsToConsider) * 100)
  }, [formData])

  const showToast = (message: string, type: "success" | "error" | "info", icon?: React.ReactNode) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, icon }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const fetchCompetition = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec",
      )
      const data = await response.json()
      const comp = data.find((c: Competition) => c.id === competitionId)
      setCompetition(comp || null)
      if (comp) {
        showToast("Data kompetisi berhasil dimuat! 🎉", "success", <CheckCircle />)
      }
    } catch (error) {
      console.error("Error fetching competition:", error)
      showToast("Gagal memuat data perlombaan", "error", <X />)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    if (field === "dojang" && typeof value === "string" && value === "Lainnya") {
      setCustomDojang(true)
      setFormData((prev) => ({ ...prev, [field]: "" }))
    } else {
      if (field === "dojang" && customDojang && value !== "") {
        setCustomDojang(false)
      }
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setCategoryOptions((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, checked } : cat)))

    setFormData((prev) => {
      const updatedCategories = checked
        ? [...prev.kategori, categoryId.charAt(0).toUpperCase() + categoryId.slice(1)]
        : prev.kategori.filter((cat) => cat.toLowerCase() !== categoryId)

      return { ...prev, kategori: updatedCategories }
    })
  }

  const handleJerseyToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      orderJersey: checked,
      jerseySize: checked ? prev.jerseySize : "",
    }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.nama && formData.gender && formData.tempatTanggalLahir
      case 2:
        return formData.sabuk && formData.dojang && formData.berat && formData.tinggi
      case 3:
        return (
          formData.kategori.length > 0 &&
          formData.kelas &&
          (!formData.orderJersey || (formData.orderJersey && formData.jerseySize))
        )
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      showToast(`Langkah ${currentStep + 1} dari ${totalSteps} 🚀`, "info", <Sparkles />)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const generateRegistrationId = () => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 5).toUpperCase()
    return `REG-${timestamp.slice(-6)}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const registrationId = generateRegistrationId()
      const timestamp = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Prepare form data for the new API structure
      const submitData = new URLSearchParams()
      submitData.append("action", "create")
      submitData.append("idKejuaraan", formData.idKejuaraan)
      submitData.append("nama", formData.nama)
      submitData.append("gender", formData.gender)
      submitData.append("sabuk", formData.sabuk)
      submitData.append("tempatTanggalLahir", formData.tempatTanggalLahir)
      submitData.append("dojang", formData.dojang)
      submitData.append("berat", formData.berat)
      submitData.append("tinggi", formData.tinggi)
      submitData.append("kategori", formData.kategori.join(", "))
      submitData.append("kelas", formData.kelas)
      submitData.append("orderJersey", formData.orderJersey ? "Ya" : "Tidak")
      submitData.append("jerseySize", formData.jerseySize || "-")

      console.log("Submitting data:", Object.fromEntries(submitData))

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxBdFaCAXRAVjZYoEnWlJ7He7yeXjZrTYY11YsCjOLTmB-Ewe58jEKh97iXRdthIGhiMA/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: submitData.toString(),
        },
      )

      // Handle the response
      let result
      try {
        const responseText = await response.text()
        console.log("Raw response:", responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.log("Response parsing failed, assuming success")
        result = { success: true }
      }

      console.log("Parsed result:", result)

      if (result.error) {
        throw new Error(result.error)
      }

      // Create registration data for success page
      const regData: RegistrationData = {
        ...formData,
        registrationId: result.registrationId || registrationId,
        timestamp,
        competitionName: competition?.nama || "",
      }

      setRegistrationData(regData)
      setRegistrationSuccess(true)
      showToast("🎉 Pendaftaran berhasil! Silakan simpan bukti pendaftaran Anda.", "success", <Trophy />)
    } catch (error) {
      console.error("Error submitting form:", error)
      showToast(`Terjadi kesalahan: ${error instanceof Error ? error.message : "Silakan coba lagi."}`, "error", <X />)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadInvoiceAsImage = async () => {
    if (!registrationData || !invoiceRef.current) return

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default

      // Capture the invoice element
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `Bukti_Pendaftaran_${registrationData.registrationId}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          showToast("Bukti pendaftaran berhasil diunduh! 📥", "success", <Download />)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error generating image:", error)
      showToast("Gagal mengunduh bukti pendaftaran", "error", <X />)
    }
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

  if (loading) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center ${theme}`}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-32 h-32 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Trophy className="h-16 w-16 text-black" />
          </motion.div>
          <h2 className="text-4xl font-black text-black dark:text-white mb-6">MEMUAT DATA PERLOMBAAN</h2>
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              className="w-4 h-4 bg-cyan-400 dark:bg-cyan-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="w-4 h-4 bg-pink-400 dark:bg-pink-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
            />
            <motion.div
              className="w-4 h-4 bg-yellow-400 dark:bg-yellow-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
            />
          </div>
          <span className="text-black dark:text-white font-bold text-xl mt-4 block">Mohon tunggu sebentar...</span>
        </motion.div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center ${theme}`}>
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-32 h-32 bg-red-400 dark:bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <X className="h-16 w-16 text-black" />
          </motion.div>
          <h2 className="text-4xl font-black text-black dark:text-white mb-6">PERLOMBAAN TIDAK DITEMUKAN</h2>
          <p className="text-black dark:text-white mb-8 leading-relaxed text-xl font-bold">
            Maaf, perlombaan yang Anda cari tidak tersedia atau mungkin sudah tidak aktif.
          </p>
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-black px-8 py-4 rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-xl">
                <ArrowLeft className="mr-3 h-6 w-6" />
                KEMBALI KE BERANDA
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Success Page
  if (registrationSuccess && registrationData) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white ${theme}`}>
        {renderToasts()}

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            {/* Success Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="w-32 h-32 bg-green-400 dark:bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <CheckCircle className="h-16 w-16 text-black" />
              </motion.div>
              <h1 className="text-5xl font-black text-black dark:text-white mb-6">PENDAFTARAN BERHASIL! 🎉</h1>
              <p className="text-xl text-black dark:text-white font-bold">
                Terima kasih telah mendaftar. Silakan simpan bukti pendaftaran di bawah ini.
              </p>
            </motion.div>

            {/* Compact Invoice Card */}
            <motion.div
              ref={invoiceRef}
              className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] overflow-hidden mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {/* Header with Gradient */}
              <div className="bg-yellow-400 dark:bg-yellow-500 p-6 text-black border-b-4 border-black dark:border-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black mb-2">BUKTI PENDAFTARAN</h2>
                    <p className="text-black text-lg font-bold">COMPETITION HUB</p>
                  </div>
                  <Trophy className="h-12 w-12 text-black" />
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Registration ID & Status */}
                <div className="bg-green-400 dark:bg-green-500 rounded-xl p-4 border-2 border-black dark:border-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-black">ID PENDAFTARAN</span>
                    <span className="text-sm bg-black text-white px-3 py-1 rounded-full font-black">✓ TERDAFTAR</span>
                  </div>
                  <div className="font-mono font-black text-black text-2xl">{registrationData.registrationId}</div>
                  <div className="text-sm text-black font-bold mt-2">{registrationData.timestamp}</div>
                </div>

                {/* Competition Info */}
                <div className="bg-cyan-400 dark:bg-cyan-500 rounded-xl p-4 border-2 border-black dark:border-white">
                  <h3 className="font-black text-black mb-3 text-lg">PERLOMBAAN</h3>
                  <div className="text-lg font-black text-black">{registrationData.competitionName}</div>
                </div>

                {/* Participant Data */}
                <div className="bg-pink-400 dark:bg-pink-500 rounded-xl p-4 border-2 border-black dark:border-white">
                  <h3 className="font-black text-black mb-4 text-lg">DATA PESERTA</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-black block font-bold">NAMA</span>
                      <span className="font-black text-black text-base">{registrationData.nama}</span>
                    </div>
                    <div>
                      <span className="text-black block font-bold">GENDER</span>
                      <span className="font-black text-black text-base">{registrationData.gender}</span>
                    </div>
                    <div>
                      <span className="text-black block font-bold">SABUK</span>
                      <span className="font-black text-black text-base">{registrationData.sabuk}</span>
                    </div>
                    <div>
                      <span className="text-black block font-bold">DOJANG</span>
                      <span className="font-black text-black text-base">{registrationData.dojang}</span>
                    </div>
                    <div>
                      <span className="text-black block font-bold">KATEGORI</span>
                      <span className="font-black text-black text-base">{registrationData.kategori.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-black block font-bold">KELAS</span>
                      <span className="font-black text-black text-base">{registrationData.kelas}</span>
                    </div>
                    {registrationData.orderJersey && (
                      <div>
                        <span className="text-black block font-bold">JERSEY</span>
                        <span className="font-black text-black text-base">{registrationData.jerseySize}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Note */}
                <div className="bg-yellow-400 dark:bg-yellow-500 rounded-xl p-4 border-2 border-black dark:border-white">
                  <div className="text-sm text-black">
                    <div className="font-black mb-2 text-base">📋 CATATAN PENTING:</div>
                    <div className="font-bold">• Tunjukkan bukti ini saat verifikasi</div>
                    <div className="font-bold">• Hubungi panitia jika ada pertanyaan</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={downloadInvoiceAsImage}
                  className="w-full bg-green-400 hover:bg-green-500 text-black font-black py-6 rounded-2xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-base px-4"
                >
                  <Download className="mr-2 h-5 w-5" />
                  UNDUH
                </Button>
              </motion.div>

              <Link href="/">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-black py-6 rounded-2xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-base px-4">
                    <Home className="mr-2 h-5 w-5" />
                    BERANDA
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Footer Info */}
            <motion.div
              className="text-center text-black dark:text-white mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-lg font-bold">
                Terima kasih telah menggunakan Competition Hub - Platform Pendaftaran Terpercaya
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center px-6 py-3 bg-cyan-400 dark:bg-cyan-500 text-black text-lg font-black rounded-full border-2 border-black dark:border-white mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <User className="mr-3 h-6 w-6" />
                LANGKAH 1 DARI 3
              </motion.div>
              <h3 className="text-4xl font-black text-black dark:text-white mb-4">INFORMASI PRIBADI</h3>
              <p className="text-black dark:text-white text-xl font-bold">Masukkan data pribadi Anda dengan lengkap</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="nama" className="text-black dark:text-white flex items-center text-lg font-black">
                  <User className="mr-3 h-6 w-6 text-yellow-400" />
                  NAMA LENGKAP
                </Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  className="border-4 border-black dark:border-white focus:border-yellow-400 dark:focus:border-yellow-500 focus:ring-yellow-400 dark:focus:ring-yellow-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                  placeholder="Masukkan nama lengkap Anda"
                  required
                />
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="gender" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Users className="mr-3 h-6 w-6 text-pink-400" />
                  JENIS KELAMIN
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="border-4 border-black dark:border-white focus:border-pink-400 dark:focus:border-pink-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl">
                    <SelectItem value="Laki-laki" className="text-lg font-bold">
                      Laki-laki
                    </SelectItem>
                    <SelectItem value="Perempuan" className="text-lg font-bold">
                      Perempuan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                className="space-y-3 md:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label
                  htmlFor="tempatTanggalLahir"
                  className="text-black dark:text-white flex items-center text-lg font-black"
                >
                  <Calendar className="mr-3 h-6 w-6 text-cyan-400" />
                  TEMPAT, TANGGAL LAHIR
                </Label>
                <Input
                  id="tempatTanggalLahir"
                  value={formData.tempatTanggalLahir}
                  onChange={(e) => handleInputChange("tempatTanggalLahir", e.target.value)}
                  className="border-4 border-black dark:border-white focus:border-cyan-400 dark:focus:border-cyan-500 focus:ring-cyan-400 dark:focus:ring-cyan-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                  placeholder="Contoh: Jakarta, 01 Januari 2000"
                  required
                />
              </motion.div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center px-6 py-3 bg-pink-400 dark:bg-pink-500 text-black text-lg font-black rounded-full border-2 border-black dark:border-white mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Award className="mr-3 h-6 w-6" />
                LANGKAH 2 DARI 3
              </motion.div>
              <h3 className="text-4xl font-black text-black dark:text-white mb-4">DATA FISIK & DOJANG</h3>
              <p className="text-black dark:text-white text-xl font-bold">Informasi tentang kemampuan dan fisik Anda</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="sabuk" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Award className="mr-3 h-6 w-6 text-yellow-400" />
                  SABUK SAAT INI
                </Label>
                <Select value={formData.sabuk} onValueChange={(value) => handleInputChange("sabuk", value)}>
                  <SelectTrigger className="border-4 border-black dark:border-white focus:border-yellow-400 dark:focus:border-yellow-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                    <SelectValue placeholder="Pilih tingkat sabuk" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl max-h-[300px]">
                    <SelectItem value="putih" className="text-lg font-bold">
                      Putih
                    </SelectItem>
                    <SelectItem value="kuning" className="text-lg font-bold">
                      Kuning
                    </SelectItem>
                    <SelectItem value="kuning-strip" className="text-lg font-bold">
                      Kuning Strip
                    </SelectItem>
                    <SelectItem value="hijau" className="text-lg font-bold">
                      Hijau
                    </SelectItem>
                    <SelectItem value="hijau-strip" className="text-lg font-bold">
                      Hijau Strip
                    </SelectItem>
                    <SelectItem value="biru" className="text-lg font-bold">
                      Biru
                    </SelectItem>
                    <SelectItem value="biru-strip" className="text-lg font-bold">
                      Biru Strip
                    </SelectItem>
                    <SelectItem value="merah" className="text-lg font-bold">
                      Merah
                    </SelectItem>
                    <SelectItem value="merah-strip-1" className="text-lg font-bold">
                      Merah Strip I
                    </SelectItem>
                    <SelectItem value="merah-strip-2" className="text-lg font-bold">
                      Merah Strip II
                    </SelectItem>
                    <SelectItem value="hitam" className="text-lg font-bold">
                      Hitam
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="dojang" className="text-black dark:text-white flex items-center text-lg font-black">
                  <MapPin className="mr-3 h-6 w-6 text-cyan-400" />
                  DOJANG/KLUB
                </Label>
                {!customDojang ? (
                  <Select value={formData.dojang} onValueChange={(value) => handleInputChange("dojang", value)}>
                    <SelectTrigger className="border-4 border-black dark:border-white focus:border-cyan-400 dark:focus:border-cyan-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                      <SelectValue placeholder="Pilih dojang/klub" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl max-h-[300px]">
                      {dojangOptions.map((dojang) => (
                        <SelectItem key={dojang} value={dojang} className="text-lg font-bold">
                          {dojang}
                        </SelectItem>
                      ))}
                      <SelectItem value="Lainnya" className="text-lg font-bold">
                        Lainnya
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-3">
                    <Input
                      id="customDojang"
                      value={formData.dojang}
                      onChange={(e) => handleInputChange("dojang", e.target.value)}
                      className="border-4 border-black dark:border-white focus:border-cyan-400 dark:focus:border-cyan-500 focus:ring-cyan-400 dark:focus:ring-cyan-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                      placeholder="Masukkan nama dojang/klub Anda"
                      required
                    />
                    <Button
                      type="button"
                      className="bg-gray-400 hover:bg-gray-500 text-black font-black px-4 py-2 rounded-lg border-2 border-black"
                      onClick={() => {
                        setCustomDojang(false)
                        setFormData((prev) => ({ ...prev, dojang: "" }))
                      }}
                    >
                      Kembali ke daftar
                    </Button>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="berat" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Weight className="mr-3 h-6 w-6 text-pink-400" />
                  BERAT BADAN (KG)
                </Label>
                <Input
                  id="berat"
                  type="number"
                  value={formData.berat}
                  onChange={(e) => handleInputChange("berat", e.target.value)}
                  className="border-4 border-black dark:border-white focus:border-pink-400 dark:focus:border-pink-500 focus:ring-pink-400 dark:focus:ring-pink-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                  placeholder="60"
                  required
                />
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="tinggi" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Ruler className="mr-3 h-6 w-6 text-green-400" />
                  TINGGI BADAN (CM)
                </Label>
                <Input
                  id="tinggi"
                  type="number"
                  value={formData.tinggi}
                  onChange={(e) => handleInputChange("tinggi", e.target.value)}
                  className="border-4 border-black dark:border-white focus:border-green-400 dark:focus:border-green-500 focus:ring-green-400 dark:focus:ring-green-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                  placeholder="170"
                  required
                />
              </motion.div>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center px-6 py-3 bg-yellow-400 dark:bg-yellow-500 text-black text-lg font-black rounded-full border-2 border-black dark:border-white mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="mr-3 h-6 w-6" />
                LANGKAH 3 DARI 3
              </motion.div>
              <h3 className="text-4xl font-black text-black dark:text-white mb-4">KATEGORI PERLOMBAAN</h3>
              <p className="text-black dark:text-white text-xl font-bold">Pilih kategori dan kelas yang sesuai</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="kategori" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Trophy className="mr-3 h-6 w-6 text-yellow-400" />
                  KATEGORI
                </Label>
                <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                  <p className="text-black dark:text-white font-bold mb-3 text-sm">
                    Anda dapat memilih lebih dari satu kategori
                  </p>
                  <div className="space-y-3">
                    {categoryOptions.map((category) => (
                      <div key={category.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={category.checked}
                          onCheckedChange={(checked) => handleCategoryChange(category.id, checked === true)}
                          className="h-6 w-6 border-2 border-black data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-lg font-bold text-black dark:text-white cursor-pointer"
                        >
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.kategori.length === 0 && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-bold">Pilih minimal satu kategori</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="kelas" className="text-black dark:text-white flex items-center text-lg font-black">
                  <Users className="mr-3 h-6 w-6 text-cyan-400" />
                  KELAS
                </Label>
                <Select value={formData.kelas} onValueChange={(value) => handleInputChange("kelas", value)}>
                  <SelectTrigger className="border-4 border-black dark:border-white focus:border-cyan-400 dark:focus:border-cyan-500 rounded-xl h-16 text-lg font-bold bg-white dark:bg-gray-800 text-black dark:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl">
                    <SelectItem value="Prestasi" className="text-lg font-bold">
                      Prestasi
                    </SelectItem>
                    <SelectItem value="Pemula" className="text-lg font-bold">
                      Pemula
                    </SelectItem>
                    <SelectItem value="UKT" className="text-lg font-bold">
                      UKT
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox
                      id="order-jersey"
                      checked={formData.orderJersey}
                      onCheckedChange={(checked) => handleJerseyToggle(checked === true)}
                      className="h-6 w-6 border-2 border-black data-[state=checked]:bg-green-400 data-[state=checked]:text-black"
                    />
                    <Label
                      htmlFor="order-jersey"
                      className="text-lg font-bold text-black dark:text-white cursor-pointer flex items-center"
                    >
                      <ShirtIcon className="mr-3 h-6 w-6 text-green-400" />
                      Saya ingin memesan jersey
                    </Label>
                  </div>

                  {formData.orderJersey && (
                    <div className="pl-9">
                      <Label
                        htmlFor="jersey-size"
                        className="text-black dark:text-white text-base font-bold mb-2 block"
                      >
                        Pilih Ukuran Jersey
                      </Label>
                      <Select
                        value={formData.jerseySize}
                        onValueChange={(value) => handleInputChange("jerseySize", value)}
                      >
                        <SelectTrigger className="border-2 border-black dark:border-white focus:border-green-400 dark:focus:border-green-500 rounded-lg h-12 text-base font-bold bg-white dark:bg-gray-800 text-black dark:text-white">
                          <SelectValue placeholder="Pilih ukuran" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg">
                          {jerseySizes.map((size) => (
                            <SelectItem key={size} value={size} className="text-base font-bold">
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.orderJersey && !formData.jerseySize && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-bold">Pilih ukuran jersey</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Summary */}
            <motion.div
              className="mt-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-xl border-4 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="text-2xl font-black text-black dark:text-white mb-6 flex items-center">
                <CheckCircle className="mr-3 h-7 w-7 text-green-500" />
                RINGKASAN PENDAFTARAN
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <div>
                  <span className="text-black dark:text-white font-bold">NAMA:</span>{" "}
                  <span className="text-black dark:text-white font-black">{formData.nama}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white font-bold">GENDER:</span>{" "}
                  <span className="text-black dark:text-white font-black">{formData.gender}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white font-bold">SABUK:</span>{" "}
                  <span className="text-black dark:text-white font-black">{formData.sabuk}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white font-bold">DOJANG:</span>{" "}
                  <span className="text-black dark:text-white font-black">{formData.dojang}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white font-bold">KATEGORI:</span>{" "}
                  <span className="text-black dark:text-white font-black">
                    {formData.kategori.length > 0 ? formData.kategori.join(", ") : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-black dark:text-white font-bold">KELAS:</span>{" "}
                  <span className="text-black dark:text-white font-black">{formData.kelas}</span>
                </div>
                {formData.orderJersey && (
                  <div>
                    <span className="text-black dark:text-white font-bold">JERSEY:</span>{" "}
                    <span className="text-black dark:text-white font-black">{formData.jerseySize || "-"}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white ${theme}`}>
      {renderToasts()}

      {/* Header with Step Indicators */}
      <motion.header
        className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-cyan-400 hover:bg-cyan-500 text-black font-black px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all duration-200">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  KEMBALI
                </Button>
              </motion.div>
            </Link>

            {/* Step Indicators in Navbar */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all duration-300 border-2 border-black dark:border-white ${
                      step === currentStep
                        ? "bg-yellow-400 dark:bg-yellow-500 text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                        : step < currentStep
                          ? "bg-green-400 dark:bg-green-500 text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
                  </motion.div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-2 mx-2 rounded-full transition-all duration-300 border border-black dark:border-white ${
                        step < currentStep ? "bg-green-400 dark:bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

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
          </div>
        </div>
      </motion.header>

      {/* Sticky Progress Bar */}
      <motion.div
        className="sticky top-[73px] z-30 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-black dark:text-white">PROGRESS PENDAFTARAN</h3>
              <span className="text-lg font-black text-black dark:text-white">{Math.round(progress)}% SELESAI</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 border-2 border-black dark:border-white">
              <motion.div
                className="bg-yellow-400 dark:bg-yellow-500 h-full rounded-full border-r-2 border-black dark:border-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Competition Info */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="bg-yellow-400 dark:bg-yellow-500 border-4 border-black dark:border-white rounded-2xl mb-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
              <CardHeader className="p-8">
                <CardTitle className="text-4xl font-black text-black flex items-center mb-6">
                  <Trophy className="mr-4 h-10 w-10 text-black" />
                  {competition.nama}
                </CardTitle>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-4 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                  <pre className="text-lg text-black dark:text-white leading-relaxed whitespace-pre-wrap font-sans font-bold">
                    {competition.deskripsi}
                  </pre>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit}>
                  {renderStepContent()}

                  {/* Navigation Buttons */}
                  <motion.div
                    className="flex flex-col sm:flex-row gap-6 pt-8 mt-8 border-t-4 border-black dark:border-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex gap-6 flex-1">
                      {currentStep > 1 && (
                        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            onClick={prevStep}
                            className="w-full bg-gray-400 hover:bg-gray-500 text-black font-black rounded-xl py-4 text-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all duration-200"
                          >
                            <ArrowLeft className="mr-3 h-6 w-6" />
                            SEBELUMNYA
                          </Button>
                        </motion.div>
                      )}

                      {currentStep < totalSteps ? (
                        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            onClick={nextStep}
                            disabled={!validateStep(currentStep)}
                            className="w-full bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-300 disabled:text-gray-500 text-black font-black rounded-xl py-4 text-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:shadow-none transition-all duration-200"
                          >
                            LANJUTKAN
                            <ArrowRight className="ml-3 h-6 w-6" />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="submit"
                            disabled={submitting || !validateStep(currentStep)}
                            className="w-full bg-green-400 hover:bg-green-500 disabled:bg-gray-300 disabled:text-gray-500 text-black font-black rounded-xl py-4 text-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:shadow-none transition-all duration-200"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                MENDAFTAR...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-3 h-6 w-6" />
                                DAFTAR SEKARANG
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
