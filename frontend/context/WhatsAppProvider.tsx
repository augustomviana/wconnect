// frontend/app/context/WhatsAppProvider.tsx

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, type Socket } from "socket.io-client";

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_code' | 'connected' | 'error';
  message: string;
}

interface WhatsAppContextType {
  status: WhatsAppStatus;
  qrCodeUrl: string | null;
  socket: Socket | null;
  restartConnection: () => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp deve ser usado dentro de um WhatsAppProvider');
  }
  return context;
};

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({ status: 'disconnected', message: 'A iniciar...' });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl, { withCredentials: true, transports: ["websocket"] });
    setSocket(newSocket);

    console.log("🟢 [WhatsAppProvider] A conectar ao Socket.IO...");

    newSocket.on('connect', () => {
      console.log('✅ [WhatsAppProvider] Conectado ao servidor de Socket.IO');
    });

    newSocket.on('status_change', (data: WhatsAppStatus) => {
      console.log('[WhatsAppProvider] Status alterado recebido:', data);
      setStatus(data);
      if (data.status !== 'qr_code') {
        setQrCodeUrl(null);
      }
    });

    newSocket.on('qr_code', (url: string) => {
      console.log('[WhatsAppProvider] QR Code recebido pelo frontend');
      setQrCodeUrl(url);
      setStatus({ status: 'qr_code', message: 'Escaneie o QR Code para conectar.' });
    });

    newSocket.on('disconnect', () => {
        console.log("🔴 [WhatsAppProvider] Desconectado do Socket.IO.");
        setStatus({ status: 'disconnected', message: 'Desconectado do servidor.' });
    });

    return () => {
      console.log("🔌 [WhatsAppProvider] A limpar a conexão do Socket.IO...");
      newSocket.disconnect();
    };
  }, []);

  const restartConnection = () => {
    if (socket) {
      console.log("▶️  [WhatsAppProvider] A enviar evento 'restart_whatsapp'...");
      setQrCodeUrl(null);
      setStatus({ status: 'connecting', message: 'A pedir um novo QR Code...' });
      socket.emit('restart_whatsapp');
    } else {
      console.error("❌ [WhatsAppProvider] Socket não está conectado.");
    }
  };

  const value = {
    status,
    qrCodeUrl,
    socket,
    restartConnection,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};