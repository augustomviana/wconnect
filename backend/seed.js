// backend/seed.js

// Este script envia dados de exemplo para a sua API para popular o Kanban.
// Certifique-se de que o seu servidor backend esteja rodando antes de executar este script.

const leadsDeExemplo = [
  { nome: "Ana Clara", whatsapp: "+5521988776655", campanha: "Lançamento de Verão", campos_personalizados: { produto: "Bikini", tamanho: "M" } },
  { nome: "Bruno Martins", whatsapp: "+5531977665544", campanha: "Lançamento de Verão", campos_personalizados: { produto: "Canga", cor: "Azul" } },
  { nome: "Carla Dias", whatsapp: "+5541966554433", campanha: "Desconto para Clientes VIP", campos_personalizados: { nivel_vip: "Ouro" } },
  { nome: "Daniel Fogaça", whatsapp: "+5551955443322", campanha: "Webinar de Marketing Digital", campos_personalizados: { interesse: "SEO" } },
  { nome: "Elisa Furtado", whatsapp: "+5561944332211", campanha: "Webinar de Marketing Digital", campos_personalizados: { interesse: "Tráfego Pago" } },
  { nome: "Fábio Neves", whatsapp: "+5571933221100", campanha: "Consultoria Gratuita", campos_personalizados: { area: "Finanças" } },
  { nome: "Gabriela Rios", whatsapp: "+5581922110099", campanha: "Feira de Tecnologia 2025", campos_personalizados: { empresa: "TecMundo" } },
  { nome: "Heitor Lins", whatsapp: "+5591911009988", campanha: "Feira de Tecnologia 2025", campos_personalizados: { empresa: "StartSe" } },
  { nome: "Isabela Bastos", whatsapp: "+5511999887766", campanha: "Desconto para Clientes VIP", campos_personalizados: { nivel_vip: "Prata" } },
  { nome: "Jonas Mendes", whatsapp: "+5511988776655", campanha: "Lançamento de Verão", campos_personalizados: { produto: "Óculos de Sol" } },
];

async function criarLead(lead) {
  try {
    const response = await fetch('http://localhost:5000/api/campanha/novo-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Sucesso: Lead "${lead.nome}" da campanha "${lead.campanha}" criado.`);
  } catch (error) {
    console.error(`❌ Falha ao criar lead "${lead.nome}":`, error.message);
  }
}

async function popularBanco() {
  console.log('🚀 Iniciando a criação de leads de exemplo...');
  for (const lead of leadsDeExemplo) {
    // Adiciona um pequeno atraso para não sobrecarregar o serviço de WhatsApp
    await new Promise(resolve => setTimeout(resolve, 200)); 
    await criarLead(lead);
  }
  console.log('\n🎉 Processo concluído!');
}

popularBanco();

