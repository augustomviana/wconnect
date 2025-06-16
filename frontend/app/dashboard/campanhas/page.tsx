// frontend/app/dashboard/campanhas/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, DragOverlay, type DragStartEvent, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Phone, Loader, Search, X } from 'lucide-react';

// --- Tipos de Dados ---
interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  status: string;
  nome_campanha: string;
}

interface Column {
  id: string;
  title: string;
}

// --- Componente do Card do Lead ---
const LeadCard = ({ lead }: { lead: Lead }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id, data: { type: 'Lead', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 touch-none"
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-gray-800 text-sm break-words">{lead.nome}</span>
        <div {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <p className="text-xs text-white bg-teal-500 px-2 py-0.5 rounded-full inline-block mt-2">{lead.nome_campanha}</p>
      <a 
        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-xs text-green-600 mt-3 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Phone className="h-3 w-3 mr-1.5" />
        {lead.whatsapp}
      </a>
    </div>
  );
};


// --- Componente da Coluna do Kanban ---
const KanbanColumn = ({ column, leads }: { column: Column, leads: Lead[] }) => {
    const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column' } });
    return (
        <div ref={setNodeRef} className="bg-gray-100 rounded-xl w-72 md:w-80 flex-shrink-0 flex flex-col max-h-full">
            <h3 className="font-bold text-gray-600 mb-4 px-4 pt-4 tracking-wider text-sm">{column.title} ({leads.length})</h3>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {leads.map(lead => (
                          <LeadCard key={lead.id} lead={lead} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};


// --- Componente Principal da Página de Campanhas ---
export default function CampanhasPage() {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [columns, setColumns] = useState<Column[]>([
        { id: 'Novo', title: 'NOVO' },
        { id: 'Em Contato', title: 'EM CONTATO' },
        { id: 'Proposta', title: 'PROPOSTA' },
        { id: 'Fechado', title: 'FECHADO' },
    ]);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState('all');

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        const fetchLeads = async () => {
          setLoading(true);
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/api/campanha/leads`);
            if (!response.ok) throw new Error("Falha ao buscar dados");
            
            const leadsData: Lead[] = await response.json();
            setAllLeads(leadsData);
    
          } catch (error) {
            console.error("Erro ao carregar leads:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchLeads();
    }, []);

    // ===== INÍCIO DA CORREÇÃO DEFINITIVA DO FILTRO =====
    const filteredLeads = useMemo(() => {
        // Normaliza e divide o termo de busca do usuário em palavras.
        const searchTerms = searchTerm
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .split(/\s+/) // Divide por qualquer espaço em branco
            .filter(term => term.length > 0);

        return allLeads.filter(lead => {
            // Aplica primeiro o filtro do dropdown de campanha.
            const matchesCampaign = selectedCampaign === 'all' || lead.nome_campanha === selectedCampaign;
            if (!matchesCampaign) {
                return false;
            }
            
            // Se não houver termo de busca, não filtra mais.
            if (searchTerms.length === 0) {
                return true;
            }
            
            // Combina o nome do lead e da campanha e normaliza.
            const contentToSearch = (lead.nome + ' ' + lead.nome_campanha)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            const contentWords = contentToSearch.split(/\s+/);

            // Verifica se TODAS as palavras buscadas pelo usuário começam alguma palavra no conteúdo.
            return searchTerms.every(term => 
                contentWords.some(word => word.startsWith(term))
            );
        });
    }, [allLeads, searchTerm, selectedCampaign]);
    // ===== FIM DA CORREÇÃO DO FILTRO =====


    const uniqueCampaigns = useMemo(() => {
        const campaignNames = allLeads.map(lead => lead.nome_campanha);
        return ['all', ...Array.from(new Set(campaignNames))];
    }, [allLeads]);


    const findColumnIdOfLead = (leadId: string) => {
        return allLeads.find(l => l.id === leadId)?.status;
    }
  
    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Lead') {
            setActiveLead(event.active.data.current.lead);
        }
    };
  
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveLead(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);
        
        const activeColumnId = findColumnIdOfLead(activeId);
        let overColumnId = columns.find(c => c.id === overId)?.id;
        if (!overColumnId) {
            overColumnId = findColumnIdOfLead(overId);
        }

        if (!activeColumnId || !overColumnId || activeId === overId) return;

        setAllLeads(prevLeads => {
            const activeLeadIndex = prevLeads.findIndex(l => l.id === activeId);

            if (activeColumnId === overColumnId) { // Reordenar
                const overLeadIndex = prevLeads.findIndex(l => l.id === overId);
                return arrayMove(prevLeads, activeLeadIndex, overLeadIndex);
            } else { // Mover para outra coluna
                const updatedLeads = [...prevLeads];
                updatedLeads[activeLeadIndex] = { ...updatedLeads[activeLeadIndex], status: overColumnId! };
                updateLeadStatus(activeId, overColumnId!);
                return updatedLeads;
            }
        });
    };
  
    const updateLeadStatus = async (leadId: string, newStatus: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            await fetch(`${apiUrl}/api/campanha/leads/${leadId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error("Erro ao atualizar status do lead:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-4 text-gray-600">A carregar leads...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-theme(space.32))] flex flex-col bg-gray-50">
            <div className='flex-shrink-0'>
                <h1 className="text-3xl font-bold text-gray-800">Kanban Geral de Campanhas</h1>
                <p className="text-gray-500 mt-1 mb-6">Visão geral de todos os leads de todas as campanhas.</p>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Buscar por nome ou campanha..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="h-5 w-5 text-gray-500 hover:text-gray-800" />
                            </button>
                        )}
                    </div>
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                        {uniqueCampaigns.map(campaign => (
                            <option key={campaign} value={campaign}>
                                {campaign === 'all' ? 'Todas as Campanhas' : campaign}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Mostrando {filteredLeads.length} de {allLeads.length} leads.
                </p>
            </div>

            <div className="flex-grow overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start">
                        {columns.map(col => (
                            <KanbanColumn 
                                key={col.id} 
                                column={col} 
                                leads={filteredLeads.filter(l => l.status === col.id)}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeLead ? <LeadCard lead={activeLead} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}

