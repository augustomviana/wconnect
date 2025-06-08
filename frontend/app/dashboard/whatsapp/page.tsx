"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Smartphone, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function WhatsAppPage() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [lastConnection, setLastConnection] = useState<string | null>(null)
  const [phoneInfo, setPhoneInfo] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("disconnected")
      // Gerar QR Code real com conteúdo
      generateQRCode()
      setLastConnection("2023-06-05T16:20:00")
      setPhoneInfo(null)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const generateQRCode = () => {
    // Simular geração de QR Code com dados reais
    const qrData = `1@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${Date.now()}`
    const qrCodeSvg = `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="white"/>
        <g transform="translate(20,20)">
          ${generateQRPattern()}
        </g>
        <text x="150" y="290" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#666">
          Escaneie com WhatsApp
        </text>
      </svg>
    `)}`
    setQrCodeUrl(qrCodeSvg)
  }

  const generateQRPattern = () => {
    // Gerar padrão simples de QR Code
    let pattern = ""
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const shouldFill = Math.random() > 0.5
        if (shouldFill) {
          pattern += `<rect x="${j * 10}" y="${i * 10}" width="10" height="10" fill="black"/>`
        }
      }
    }
    return pattern
  }

  const handleConnect = () => {
    setStatus("connecting")
    generateQRCode()

    toast({
      title: "Conectando WhatsApp",
      description: "Escaneie o QR Code com seu WhatsApp para conectar",
    })

    // Simular conexão após 5 segundos
    setTimeout(() => {
      setStatus("connected")
      setQrCodeUrl(null)
      setLastConnection(new Date().toISOString())
      setPhoneInfo({
        name: "WhatsApp Business",
        phone: "+5511999999999",
        battery: 85,
        version: "2.23.10.76",
      })

      toast({
        title: "WhatsApp conectado",
        description: "Seu WhatsApp foi conectado com sucesso!",
      })
    }, 5000)
  }

  const handleDisconnect = () => {
    setStatus("disconnected")
    generateQRCode()
    setPhoneInfo(null)

    toast({
      title: "WhatsApp desconectado",
      description: "Sua conexão WhatsApp foi encerrada",
    })
  }

  const handleRefreshQR = () => {
    generateQRCode()
    toast({
      title: "QR Code atualizado",
      description: "Um novo QR Code foi gerado",
    })
  }

  const formatLastConnection = (timestamp: string | null) => {
    if (!timestamp) return "Nunca conectado"

    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm flex items-center ${
              status === "connected"
                ? "bg-green-100 text-green-800"
                : status === "connecting"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {status === "connected" ? (
              <CheckCircle className="h-4 w-4 mr-1" />
            ) : status === "connecting" ? (
              <AlertTriangle className="h-4 w-4 mr-1" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            {status === "connected" ? "Conectado" : status === "connecting" ? "Conectando..." : "Desconectado"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Status da Conexão</h2>

            {status === "connected" ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">WhatsApp conectado</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Dispositivo:</span>
                    <span className="font-medium">{phoneInfo?.name || "Desconhecido"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Número:</span>
                    <span className="font-medium">{phoneInfo?.phone || "Desconhecido"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Bateria:</span>
                    <span className="font-medium">{phoneInfo?.battery ? `${phoneInfo.battery}%` : "Desconhecido"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Versão:</span>
                    <span className="font-medium">{phoneInfo?.version || "Desconhecido"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Conectado em:</span>
                    <span className="font-medium">{formatLastConnection(lastConnection)}</span>
                  </div>
                </div>

                <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">WhatsApp desconectado</span>
                </div>

                {lastConnection && (
                  <div className="text-sm text-gray-500">Última conexão: {formatLastConnection(lastConnection)}</div>
                )}

                <div className="space-y-2">
                  <Button onClick={handleConnect} className="w-full" disabled={status === "connecting"}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    {status === "connecting" ? "Conectando..." : "Conectar WhatsApp"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">QR Code</h2>

            {status === "connected" ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-lg font-medium">WhatsApp conectado com sucesso!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Seu WhatsApp está conectado e pronto para enviar e receber mensagens.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {qrCodeUrl && (
                    <div className="border p-4 rounded-lg bg-white">
                      <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code WhatsApp" className="w-64 h-64" />
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>Escaneie o QR Code com seu WhatsApp</p>
                  <p className="mt-1">
                    Abra o WhatsApp no seu celular &gt; Menu &gt; WhatsApp Web &gt; Escanear QR Code
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleRefreshQR} disabled={status === "connecting"}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar QR Code
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 md:col-span-2">
            <h2 className="text-lg font-medium mb-4">Histórico de Conexões</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Evento
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Dispositivo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date().toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Conectado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">WhatsApp Business</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(Date.now() - 86400000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Desconectado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">WhatsApp Business</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(Date.now() - 172800000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Conectado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">WhatsApp Business</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
