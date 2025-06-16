// frontend/app/dashboard/whatsapp/page.tsx

"use client";

import React from 'react';
import Image from "next/image";
import { Loader2, CheckCircle, Smartphone, Power, AlertTriangle, ScanLine } from 'lucide-react';

// --- ADICIONADO: Importa o hook para usar o nosso contexto centralizado ---
import { useWhatsApp } from '@/context/WhatsAppProvider';

export default function WhatsAppPage() {
  // --- LÓGICA SIMPLIFICADA ---
  // Obtém o estado e as funções diretamente do nosso contexto, que agora vive no layout.
  // A conexão não será mais perdida ao navegar entre páginas.
  const { status, qrCodeUrl, restartConnection } = useWhatsApp();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">WhatsApp</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Painel de Status e Ação */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
                <h2 className="font-semibold text-lg text-gray-700">Status da Conexão</h2>
                <p className="text-sm text-gray-500 mt-1">{status.message}</p>
            </div>
            <button
                onClick={restartConnection}
                disabled={status.status === 'connecting'}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                <Power size={18} />
                Reiniciar Conexão / Novo QR Code
            </button>
        </div>

        {/* Painel do QR Code */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center min-h-[300px]">
            {status.status === 'connecting' && (
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">A gerar QR Code...</p>
                </div>
            )}
            {status.status === 'qr_code' && qrCodeUrl && (
                <div className="text-center">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">Escaneie o Código</h3>
                    <Image src={qrCodeUrl} alt="QR Code do WhatsApp" width={250} height={250} className="rounded-lg shadow-md" />
                </div>
            )}
            {status.status === 'connected' && (
                 <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <p className="mt-4 text-lg font-semibold text-gray-700">Conectado com sucesso!</p>
                </div>
            )}
             {(status.status === 'disconnected' || status.status === 'error') && (
                 <div className="text-center text-gray-500">
                     <Smartphone className="h-16 w-16 mx-auto mb-4" />
                     <p>O QR Code aparecerá aqui.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}
