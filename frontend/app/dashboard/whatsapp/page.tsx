"use client"

import { useState, useEffect } from "react"
import { io, Socket } from "socket.io-client"
import { RefreshCw, Smartphone, CheckCircle, XCircle, AlertTriangle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import dynamic from 'next/dynamic'

type Status = "connected" | "disconnected" | "connecting" | "qr_code" | "authenticated";

function WhatsAppDashboardClient() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [statusMessage, setStatusMessage] = useState("Aguardando conexão com o servidor...");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const socket: Socket = io("https://wconnect.repagil.com.br", {
      path: "/socket.io/",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket.IO Conectado:", socket.id);
      setStatusMessage("Conectado ao servidor. Iniciando WhatsApp...");
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO Desconectado.");
      setStatus("disconnected");
      setStatusMessage("Desconectado do servidor.");
    });

    socket.on("connect_error", (err) => {
      console.error("Erro de conexão com o WebSocket:", err.message);
      setStatus("disconnected");
      setStatusMessage("Falha ao conectar com o servidor em tempo real.");
      toast({ variant: "destructive", title: "Erro de Conexão", description: "Não foi possível conectar ao servidor em tempo real." });
    });

    socket.on("qr_code", (qrUrl: string) => {
      console.log("QR Code recebido via WebSocket!");
      setQrCodeUrl(qrUrl);
      setStatus("qr_code");
      setStatusMessage("Escaneie o QR Code para conectar.");
    });

    socket.on("status_change", (data: { status: Status; message: string }) => {
      console.log("Novo status do WhatsApp:", data.status);
      setStatus(data.status);
      setStatusMessage(data.message);
      if (data.status === 'connected') {
        setQrCodeUrl(null);
        toast({ title: "Sucesso!", description: "WhatsApp conectado." });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const handleRestart = async () => {
    toast({ title: "Reiniciando conexão...", description: "Aguarde um novo QR Code." });
    try {
        await fetch('/api/whatsapp/restart', { method: 'POST' });
    } catch (error) {
        console.error("Falha ao reiniciar:", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível reiniciar o serviço." });
    }
  };

  const getStatusComponent = () => {
    switch (status) {
      case 'connected': return <><CheckCircle className="h-4 w-4 mr-1" />Conectado</>;
      case 'connecting':
      case 'authenticated': return <><Loader className="h-4 w-4 mr-1 animate-spin" />Conectando...</>;
      case 'qr_code': return <><AlertTriangle className="h-4 w-4 mr-1" />Aguardando Scan</>;
      default: return <><XCircle className="h-4 w-4 mr-1" />Desconectado</>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <div className={`px-3 py-1 rounded-full text-sm flex items-center ${status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {getStatusComponent()}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-center items-center">
          <h2 className="text-lg font-medium mb-4">Status da Conexão</h2>
          <div className="text-center">
            <div className="flex items-center justify-center">{getStatusComponent()}</div>
            <p className="text-sm text-gray-500 mt-2">{statusMessage}</p>
          </div>
          <Button onClick={handleRestart} className="w-full mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reiniciar Conexão / Novo QR Code
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium mb-4">QR Code</h2>
          <div className="flex justify-center items-center h-64">
            {status === 'qr_code' && qrCodeUrl ? (
              <div className="border p-2 rounded-lg bg-white">
                <img src={qrCodeUrl} alt="QR Code WhatsApp" className="w-60 h-60" />
              </div>
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center justify-center">
                {status === 'connected' ? <CheckCircle className="h-16 w-16 text-green-500 mb-4" /> : <Smartphone className="h-16 w-16 text-gray-300 mb-4" />}
                <p>{status === 'connected' ? 'Conectado com sucesso!' : 'QR Code aparecerá aqui.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const WhatsAppDashboard = dynamic(() => Promise.resolve(WhatsAppDashboardClient), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div><p className="ml-4">Carregando componente dinâmico...</p></div>
});

export default WhatsAppDashboard;
