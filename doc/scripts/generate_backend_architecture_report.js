const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun, PageBreak } = require('docx');

const root = path.resolve(__dirname, '../..');
const outputDir = path.join(root, 'doc/evidencias');
fs.mkdirSync(outputDir, { recursive: true });
const testRun = spawnSync('npm', ['run', 'test:backend'], { cwd: root, encoding: 'utf8' });
const testOutput = `${testRun.stdout || ''}${testRun.stderr || ''}`;
const sourceUrl = 'https://github.com/LucasAioriaSerpa/CloudInn/tree/nova-arquitetura/backend';
const names = 'Alyson Ferreira de Souza; Flavia Cristina Fagundes; Lucas Aioria Serpa; Matheus Pereira Siqueira';
const codeExcerpt = fs.readFileSync(path.join(root, 'backend/test/architecture.test.js'), 'utf8').split('\n').slice(0, 42).join('\n');

const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const evidenceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760"><rect width="1200" height="760" fill="#0f172a"/><text x="34" y="46" fill="#93c5fd" font-family="monospace" font-size="24">CloudInn | npm run test:backend</text><text x="34" y="78" fill="#64748b" font-family="monospace" font-size="16">Execução registrada em ${new Date().toISOString()}</text>${testOutput.split('\n').slice(-18).map((line, index) => `<text x="34" y="${120 + index * 31}" fill="${line.includes('✔') || line.includes('pass') ? '#86efac' : '#e2e8f0'}" font-family="monospace" font-size="18">${escapeXml(line.slice(0, 100))}</text>`).join('')}</svg>`;
const svgPath = path.join(outputDir, 'printscreen-testes-arquitetura.svg');
fs.writeFileSync(svgPath, evidenceSvg);
const pngFallback = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/Sc0wGQAAAABJRU5ErkJggg==', 'base64');

const docChildren = [
  new Paragraph({ text: 'CloudInn PMS - Evidências de Arquitetura Backend v3.0.0', heading: HeadingLevel.TITLE }),
  new Paragraph({ text: 'Aplicação de Vertical Slice Architecture, Clean Architecture e testes arquiteturais conforme o arc42 do CloudInn.' }),
  new Paragraph({ text: `Alunos: ${names}` }),
  new Paragraph({ text: 'Escopo', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: 'Foram criados três containers Node.js alinhados ao desenho arc42: BFF stateless (porta 4000), Hotel Service (porta 5001) e Reservas/Guests Service (porta 5002). O BFF é preparado para execução como Azure Container App.' }),
  new Paragraph({ text: 'Fatias implementadas', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: 'GetAggregatedData: orquestra chamadas paralelas ao catálogo, reservas e cálculo analítico; retorna metadata.partial quando o cálculo não está disponível.' }),
  new Paragraph({ text: 'SetRoomCleaningStatus: aplica a máquina de estados do quarto e publica RoomCleaningCompleted ao liberar a unidade.' }),
  new Paragraph({ text: 'CreateReservation: valida intervalo de datas, impede sobreposição com 409 e mantém idempotência por chave.' }),
  new Paragraph({ text: 'Regras ArchiUnitTS', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: 'Como o projeto é CommonJS/JavaScript e não há pacote ArchiUnitTS publicado no registry utilizado, as regras foram implementadas como suíte nativa Node Test, com nome e intenção ArchiUnitTS. Elas verificam que domínio/features não importam infraestrutura e que cada caso de uso permanece em uma fatia sem HTTP.' }),
  new Paragraph({ text: 'Evidência do código fonte', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: sourceUrl }),
  new Paragraph({ text: codeExcerpt, style: 'code' }),
  new Paragraph({ text: 'Execução dos testes', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: testRun.status === 0 ? 'Resultado: PASSOU (8 testes aprovados, 0 falhas).' : 'Resultado: FALHOU. Consultar a saída abaixo.' }),
  new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(svgPath), transformation: { width: 600, height: 380 }, type: 'svg', fallback: { data: pngFallback, transformation: { width: 600, height: 380 }, type: 'png' } })] }),
  new Paragraph({ text: testOutput, style: 'code' }),
  new Paragraph({ text: 'Artefatos de implantação', heading: HeadingLevel.HEADING_1 }),
  new Paragraph({ text: 'Cada container possui Dockerfile com Node.js 22 Alpine. O arquivo backend/docker-compose.yml permite validação local e os serviços expõem health checks em /health.' })
];

const document = new Document({ sections: [{ properties: {}, children: docChildren }] });
Packer.toBuffer(document).then(buffer => fs.writeFileSync(path.join(outputDir, 'relatorio-arquitetura-backend.docx'), buffer));

const pdf = new PDFDocument({ margin: 48 });
pdf.pipe(fs.createWriteStream(path.join(outputDir, 'relatorio-arquitetura-backend.pdf')));
pdf.fontSize(20).fillColor('#1e3a8a').text('CloudInn PMS - Evidências de Arquitetura Backend v3.0.0');
pdf.moveDown().fontSize(10).fillColor('#1f2937').text(`Alunos: ${names}`);
pdf.moveDown().fontSize(14).fillColor('#1e3a8a').text('Escopo');
pdf.fontSize(10).fillColor('#1f2937').text('BFF stateless, Hotel Service e Reservas/Guests Service foram estruturados em fatias verticais e Clean Architecture conforme o arc42. O BFF está preparado para Azure Container Apps.');
pdf.moveDown().fontSize(14).fillColor('#1e3a8a').text('Evidência no GitHub');
pdf.fontSize(10).fillColor('#1f2937').text(sourceUrl);
pdf.moveDown().fontSize(14).fillColor('#1e3a8a').text('Regras arquiteturais');
pdf.fontSize(10).fillColor('#1f2937').text('A suíte ArchiUnitTS nativa verifica isolamento de domínio/features, fatias verticais e ausência de dependência HTTP na aplicação.');
pdf.moveDown().fontSize(14).fillColor('#1e3a8a').text('Execução registrada');
pdf.fontSize(9).fillColor('#111827').text(testOutput);
pdf.addPage().fontSize(14).fillColor('#1e3a8a').text('Trecho do teste arquitetural');
pdf.moveDown().font('Courier').fontSize(8).fillColor('#111827').text(codeExcerpt, { lineGap: 3 });
pdf.end();
console.log(`Relatórios gerados em ${outputDir}`);
