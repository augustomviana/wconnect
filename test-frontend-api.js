// Teste das APIs do frontend
const testAPIs = async () => {
  const apis = [
    'http://localhost:3000/api/integrations',
    'http://localhost:3000/api/gmaps-extractor/campaigns'
  ];
  
  for (const api of apis) {
    try {
      console.log(`Testando: ${api}`);
      const response = await fetch(api);
      const data = await response.text();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${data.substring(0, 200)}...`);
      console.log('---');
    } catch (error) {
      console.error(`Erro ao testar ${api}:`, error.message);
    }
  }
};

testAPIs();
