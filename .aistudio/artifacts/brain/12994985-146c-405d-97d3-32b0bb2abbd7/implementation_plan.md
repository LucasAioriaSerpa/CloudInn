# Plano de Geração do Documento Word (.docx) da Arquitetura arc42

Plano para converter a especificação de arquitetura completa em Markdown (`/doc/arc42-arquitetura-sistemica-cloudInn.md`) para um documento Microsoft Word moderno formatado (`/doc/arc42-arquitetura-sistemica-cloudInn.docx`), com estilo visual corporativo, tabelas completas e placeholders dedicados para inserção manual de imagens dos diagramas pelo usuário.

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário:
> - **Formato de Saída**: Documento Word moderno (`.docx`).
> - **Caminho de Destino**: `/doc/arc42-arquitetura-sistemica-cloudInn.docx`.
> - **Tratamento de Diagramas**: Áreas vazias demarcadas explicitamente com caixas/molduras e legendas (ex.: `[Espaço reservado: Inserir Imagem do Diagrama: C4 Context (Nível 1)]`) para facilitar a colagem direta de imagens no Word.

---

### 1. Overview & Core Concept

- **Objetivo**: Disponibilizar uma versão executiva e acadêmica pronta para impressão/exportação em PDF ou edição no Microsoft Word, contendo todas as 12 seções da arquitetura arc42 consolidadas.
- **Conteúdo Coberto**:
  - Dados da equipe (Grupo 10) e cabeçalho institucional.
  - Requisitos funcionais (RF01 a RF11) e objetivos de qualidade ISO/IEC 25010.
  - Seções 1 a 12 completas, incluindo restrições, estratégias, blocos de construção, visão de tempo de execução, visão de implantação, conceitos transversais, ADRs, requisitos de qualidade, riscos e glossário.
- **Padrão Visual**:
  - Hierarquia de títulos (Título do Documento, Título 1, Título 2, Título 3).
  - Tabelas completas com cabeçalhos destacados e bordas limpas.
  - Caixas de destaque para notas importantes e decisões de design.
  - Quadros delimitados vazios para os diagramas (Contexto, Container, Componentes, Sequência 1, 2 e 3, Implantação e Entidade-Relacionamento).

---

### 2. Estrutura Visual e Mapeamento de Placeholders de Diagramas

O documento Word conterá áreas reservadas específicas nos pontos exatos onde cada diagrama pertence:

```
┌────────────────────────────────────────────────────────────────────────┐
│               PLACEHOLDERS RESERVADOS NO DOCUMENTO WORD                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Seção 3.1  -> [Inserir Imagem: Diagrama de Contexto - C4 Nível 1]   │
│ 2. Seção 5.1  -> [Inserir Imagem: Diagrama de Containers - C4 Nível 2] │
│ 3. Seção 5.2  -> [Inserir Imagem: Diagrama de Componentes - C4 Nível 3]│
│ 4. Seção 5.3  -> [Inserir Imagem: Diagrama Entidade-Relacionamento NoSQL]
│ 5. Seção 6.1  -> [Inserir Imagem: Sequência - Ingestão de Reserva]     │
│ 6. Seção 6.2  -> [Inserir Imagem: Sequência - Check-in Presencial]     │
│ 7. Seção 6.3  -> [Inserir Imagem: Sequência - Check-out e Governança]  │
│ 8. Seção 7.0  -> [Inserir Imagem: Diagrama de Implantação e Nuvem]    │
└────────────────────────────────────────────────────────────────────────┘
```

Cada placeholder será formatado com borda sutil, fundo contrastante e instrução visual clara, facilitando o clique com botão direito -> "Alterar Imagem" ou colagem direta no Microsoft Word / Google Docs / LibreOffice.

---

### 3. Estratégia Técnica de Conversão e Construção

1. **Geração via Biblioteca Especializada**:
   - Criação de um gerador Node.js utilizando o ecossistema `docx` (ou script Python com `python-docx`), garantindo que o arquivo gerado seja um binário `.docx` legítimo, compatível com as especificações OpenXML (ISO/IEC 29500).
2. **Estilos e Tipografia**:
   - Fonte padrão legível (Calibri / Arial).
   - Cores primárias sóbrias para títulos (Azul corporativo `#1E3A8A` e cinza escuro `#1F2937`).
   - Tabela de dados com cabeçalhos sombreados (`#F3F4F6`), espaçamento de células e alinhamento ajustado.
3. **Validação do Arquivo Final**:
   - Verificação da integridade do arquivo `.docx` gerado em `/doc/arc42-arquitetura-sistemica-cloudInn.docx`.
   - Garantia de que a aplicação principal continua compilando sem intercorrências.

---

### 4. Critérios de Conclusão

1. Existência física do arquivo `/doc/arc42-arquitetura-sistemica-cloudInn.docx`.
2. Presença de todas as 12 seções completas, incluindo tabelas integrais e ADRs.
3. 8 blocos de placeholders claramente identificados para inserção de imagens de diagramas.
