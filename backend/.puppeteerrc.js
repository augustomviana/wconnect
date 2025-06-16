// backend/.puppeteerrc.js

const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configura o caminho onde o cache do navegador será guardado.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  
  // Aponta para o seu Chrome já instalado, em vez de baixar um novo.
  // Isto é mais eficiente e resolve muitos problemas no Windows.
  product: 'chrome',
};
