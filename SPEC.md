# JurisAI — Full SaaS Build Prompt for Claude Code

## SYSTEM CONTEXT

You are building **JurisAI** (jurisai.com.mx), an AI-powered legal intelligence platform for the Mexican legal system. This is a production-grade SaaS product. You are the builder; the architect has defined the full specification below. Follow it precisely.

---

## PROJECT OVERVIEW

JurisAI is the "Harvey AI for Mexico" — a vertical AI legal copilot that helps Mexican lawyers, corporate legal teams, notarios, and SMEs with legal research, document drafting, regulatory compliance, and strategic analysis. It is natively bilingual (Spanish/English), built for Mexico's civil law system, and priced for the Mexican market.

**Brand identity:**
- **Name:** JurisAI
- **Domain:** jurisai.com.mx
- **Tagline:** "Inteligencia Legal para México"
- **Voice:** Authoritative, modern, trustworthy. The precision of a top-tier abogado meets the speed of AI.
- **Primary color palette:** Deep navy (#0C1B2A), white (#FFFFFF), gold accent (#C9A84C), slate (#64748B)
- **Logo concept:** "JurisAI" wordmark — "Juris" in a refined serif, "AI" in a clean geometric sans-serif, separated by a subtle gold vertical bar

---

## TECH STACK

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State management:** Zustand for global state, React Query (TanStack Query) for server state
- **Forms:** React Hook Form + Zod validation
- **Rich text:** TipTap editor for document drafting
- **PDF rendering:** react-pdf for document preview
- **Charts:** Recharts for analytics dashboards
- **i18n:** next-intl (Spanish primary, English secondary)
- **Real-time:** Socket.io client for streaming AI responses

### Backend
- **Framework:** Next.js API routes + separate FastAPI (Python) service for AI/ML pipeline
- **Language:** TypeScript (Next.js), Python 3.11+ (AI service)
- **ORM:** Prisma (TypeScript), SQLAlchemy (Python)
- **API style:** REST for CRUD, WebSockets for AI streaming responses
- **Authentication:** NextAuth.js v5 with credentials + Google + Microsoft SSO
- **Authorization:** Role-based (RBAC) with firm-level multi-tenancy
- **Rate limiting:** Upstash Redis
- **File processing:** pdf-parse, mammoth (docx), python-docx

### AI/ML Pipeline (Python FastAPI Service)
- **LLM provider:** Anthropic Claude API (primary), OpenAI GPT-4 (fallback)
- **RAG framework:** LangChain + LlamaIndex hybrid
- **Vector database:** Pinecone (production), ChromaDB (development)
- **Embeddings:** Cohere embed-multilingual-v3.0 (optimized for Spanish)
- **Document processing:** LangChain document loaders + custom Mexican legal parsers
- **Citation verification:** Custom pipeline that cross-references generated citations against indexed legal corpus
- **Prompt management:** LangSmith for prompt versioning, testing, and observability
- **Caching:** Redis for query caching, semantic dedup

### Database
- **Primary:** PostgreSQL 16 (Supabase or Neon)
- **Vector store:** Pinecone (legal corpus embeddings)
- **Cache/sessions:** Redis (Upstash)
- **File storage:** AWS S3 or Cloudflare R2
- **Search:** Elasticsearch for full-text legal search (complement to vector search)

### Infrastructure
- **Hosting:** Vercel (Next.js frontend) + Railway or Fly.io (FastAPI service)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors), PostHog (analytics), Grafana (infra)
- **Logging:** Structured JSON logging with correlation IDs
- **Secrets:** Doppler or Vercel environment variables

### Payments
- **Provider:** Stripe (international cards) + Conekta (Mexican payment methods: OXXO, SPEI, domiciliación)
- **Billing:** Monthly/annual subscriptions with usage-based AI query metering

---

## DATABASE SCHEMA

Design the PostgreSQL schema with these core entities. Use Prisma schema syntax.

### Multi-Tenancy Model
```
Organization (law firm / company / individual)
├── Users (members of the organization)
├── Subscription (billing plan)
├── Matters/Cases (work organized by client matter)
│   ├── Documents (generated/uploaded files)
│   ├── Research Sessions (AI research threads)
│   └── Notes
└── Settings (org-level config)
```

### Core Tables

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// MULTI-TENANCY & AUTH
// ============================================================

model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  type          OrgType  // LAW_FIRM, CORPORATE, NOTARIA, SME, INDIVIDUAL
  taxId         String?  // RFC for Mexican tax
  address       String?
  city          String?
  state         String?  // Mexican state code
  phone         String?
  logo          String?  // S3 URL
  
  // Billing
  stripeCustomerId  String?  @unique
  conektaCustomerId String?  @unique
  subscription      Subscription?
  
  // Relations
  members       OrgMember[]
  matters       Matter[]
  templates     Template[]
  settings      OrgSettings?
  apiKeys       ApiKey[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([slug])
}

enum OrgType {
  LAW_FIRM
  CORPORATE
  NOTARIA
  SME
  INDIVIDUAL
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  passwordHash  String?
  image         String?
  locale        String   @default("es-MX")
  
  // Auth
  emailVerified DateTime?
  accounts      Account[]  // OAuth accounts
  sessions      Session[]
  
  // Relations
  memberships   OrgMember[]
  researchSessions ResearchSession[]
  documents     Document[]
  auditLogs     AuditLog[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model OrgMember {
  id            String   @id @default(cuid())
  role          OrgRole  // OWNER, ADMIN, LAWYER, PARALEGAL, VIEWER
  
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  orgId         String
  organization  Organization @relation(fields: [orgId], references: [id])
  
  createdAt     DateTime @default(now())
  
  @@unique([userId, orgId])
  @@index([orgId])
}

enum OrgRole {
  OWNER
  ADMIN
  LAWYER
  PARALEGAL
  VIEWER
}

// ============================================================
// SUBSCRIPTIONS & BILLING
// ============================================================

model Subscription {
  id              String   @id @default(cuid())
  orgId           String   @unique
  organization    Organization @relation(fields: [orgId], references: [id])
  
  plan            PlanType
  status          SubStatus
  billingCycle    BillingCycle
  
  // Usage tracking
  queriesUsed     Int      @default(0)
  queriesLimit    Int
  documentsUsed   Int      @default(0)
  documentsLimit  Int
  seatsUsed       Int      @default(0)
  seatsLimit      Int
  
  // Stripe/Conekta
  stripeSubId     String?
  conektaSubId    String?
  
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PlanType {
  FREE_TRIAL
  BASICO        // Solo practitioners — $1,499 MXN/mo
  PROFESIONAL   // Mid-size firms — $2,999 MXN/user/mo
  EMPRESA       // Enterprise — custom
  PYME          // SME self-serve — $499 MXN/mo
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  PAUSED
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}

// ============================================================
// LEGAL WORK: MATTERS, RESEARCH, DOCUMENTS
// ============================================================

model Matter {
  id            String   @id @default(cuid())
  title         String
  description   String?
  clientName    String?
  clientRfc     String?  // Mexican tax ID
  matterNumber  String?  // Internal reference
  status        MatterStatus @default(ACTIVE)
  
  // Legal categorization
  areaOfLaw     AreaOfLaw
  jurisdiction  String?  // "federal", "cdmx", "jalisco", etc.
  
  orgId         String
  organization  Organization @relation(fields: [orgId], references: [id])
  
  // Relations
  documents     Document[]
  researchSessions ResearchSession[]
  notes         Note[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([orgId])
  @@index([status])
}

enum MatterStatus {
  ACTIVE
  CLOSED
  ON_HOLD
  ARCHIVED
}

enum AreaOfLaw {
  CIVIL
  PENAL
  MERCANTIL
  LABORAL
  FISCAL
  ADMINISTRATIVO
  CONSTITUCIONAL  // Amparo
  FAMILIAR
  AGRARIO
  AMBIENTAL
  PROPIEDAD_INTELECTUAL
  COMERCIO_EXTERIOR  // Trade/USMCA
  CORPORATIVO
  INMOBILIARIO
  MIGRATORIO
  NOTARIAL
  OTHER
}

model ResearchSession {
  id            String   @id @default(cuid())
  title         String?
  
  matterId      String?
  matter        Matter?  @relation(fields: [matterId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // AI conversation
  messages      Message[]
  
  // Metadata
  legalSources  Json?    // Array of cited sources
  tokensUsed    Int      @default(0)
  modelUsed     String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
  @@index([matterId])
}

model Message {
  id            String   @id @default(cuid())
  role          MessageRole
  content       String   @db.Text
  
  // AI metadata
  citations     Json?    // Structured citation objects
  confidence    Float?   // AI confidence score 0-1
  sources       Json?    // Source documents used
  tokensUsed    Int?
  latencyMs     Int?
  
  sessionId     String
  session       ResearchSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  
  @@index([sessionId])
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

model Document {
  id            String   @id @default(cuid())
  title         String
  type          DocumentType
  status        DocumentStatus @default(DRAFT)
  
  // Content
  content       String?  @db.Text  // Rich text content
  fileUrl       String?  // S3 URL for generated/uploaded files
  fileType      String?  // pdf, docx, etc.
  fileSizeBytes Int?
  
  // AI generation metadata
  prompt        String?  @db.Text
  modelUsed     String?
  templateId    String?
  template      Template? @relation(fields: [templateId], references: [id])
  
  // Relations
  matterId      String?
  matter        Matter?  @relation(fields: [matterId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  versions      DocumentVersion[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([matterId])
  @@index([userId])
  @@index([type])
}

enum DocumentType {
  CONTRACT           // Contrato
  AMPARO_PETITION    // Demanda de amparo
  CORPORATE_DEED     // Acta constitutiva
  POWER_OF_ATTORNEY  // Poder notarial
  LEGAL_OPINION      // Opinión legal
  MEMO               // Memorándum
  COMPLAINT          // Demanda
  MOTION             // Escrito/Promoción
  REGULATORY_FILING  // Trámite regulatorio
  NDA                // Convenio de confidencialidad
  EMPLOYMENT         // Contrato laboral
  LEASE              // Contrato de arrendamiento
  GENERAL            // Otro
}

enum DocumentStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  FINAL
  ARCHIVED
}

model DocumentVersion {
  id            String   @id @default(cuid())
  version       Int
  content       String   @db.Text
  changeNote    String?
  
  documentId    String
  document      Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  
  @@index([documentId])
}

// ============================================================
// TEMPLATES & KNOWLEDGE BASE
// ============================================================

model Template {
  id            String   @id @default(cuid())
  name          String
  description   String?
  category      DocumentType
  areaOfLaw     AreaOfLaw?
  jurisdiction  String?
  
  // Template content
  content       String   @db.Text  // Template with {{variable}} placeholders
  variables     Json?    // Array of variable definitions
  
  // Scope
  isSystem      Boolean  @default(false)  // System-provided vs user-created
  orgId         String?
  
  documents     Document[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([category])
  @@index([orgId])
}

// ============================================================
// LEGAL CORPUS (Metadata — actual content in vector DB)
// ============================================================

model LegalSource {
  id            String   @id @default(cuid())
  sourceType    LegalSourceType
  title         String
  identifier    String   @unique  // e.g., "CCF-ART-1916" or "SCJN-2a-2024-12345"
  
  // Hierarchy
  code          String?  // Código Civil Federal
  book          String?
  title2        String?  // Título (legal subdivision)
  chapter       String?
  article       String?
  
  // Metadata
  jurisdiction  String   // "federal", "cdmx", etc.
  publishDate   DateTime?
  lastReformDate DateTime?
  dofReference  String?  // DOF publication reference
  isVigente     Boolean  @default(true)  // Currently in force
  
  // Vector DB reference
  pineconeIds   String[] // Array of chunk IDs in Pinecone
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([sourceType])
  @@index([jurisdiction])
  @@index([identifier])
}

enum LegalSourceType {
  CONSTITUCION
  CODIGO_FEDERAL
  CODIGO_ESTATAL
  LEY_FEDERAL
  LEY_ESTATAL
  REGLAMENTO
  NOM
  JURISPRUDENCIA      // Binding SCJN precedent
  TESIS_AISLADA       // Non-binding SCJN thesis
  DOF_PUBLICACION
  TRATADO             // International treaty (USMCA etc.)
  CIRCULAR            // Regulatory circular (CNBV, SAT)
}

// ============================================================
// COMPLIANCE & MONITORING
// ============================================================

model RegulatoryAlert {
  id            String   @id @default(cuid())
  title         String
  summary       String   @db.Text
  sourceUrl     String?
  
  // Categorization
  authority     String   // SAT, IMSS, COFEPRIS, etc.
  areaOfLaw     AreaOfLaw
  jurisdiction  String
  impactLevel   ImpactLevel
  
  // DOF reference
  dofDate       DateTime?
  dofReference  String?
  
  publishedAt   DateTime
  createdAt     DateTime @default(now())
  
  @@index([authority])
  @@index([publishedAt])
}

enum ImpactLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// ============================================================
// AUDIT & ANALYTICS
// ============================================================

model AuditLog {
  id            String   @id @default(cuid())
  action        String   // "research.query", "document.create", etc.
  resource      String?
  resourceId    String?
  details       Json?
  
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  orgId         String?
  
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([orgId])
  @@index([createdAt])
}

model UsageMetric {
  id            String   @id @default(cuid())
  orgId         String
  userId        String?
  
  metricType    String   // "ai_query", "document_generated", "search"
  count         Int      @default(1)
  tokensUsed    Int?
  latencyMs     Int?
  modelUsed     String?
  
  date          DateTime @default(now()) @db.Date
  
  @@index([orgId, date])
  @@index([metricType, date])
}

// ============================================================
// API KEYS (for enterprise/API access)
// ============================================================

model ApiKey {
  id            String   @id @default(cuid())
  name          String
  keyHash       String   @unique  // SHA-256 of the actual key
  keyPrefix     String   // First 8 chars for identification — displayed as "jai_xxxx..."
  
  orgId         String
  organization  Organization @relation(fields: [orgId], references: [id])
  
  scopes        String[] // ["research", "documents", "compliance"]
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  
  @@index([keyHash])
  @@index([orgId])
}

// NextAuth.js required tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Note {
  id        String   @id @default(cuid())
  content   String   @db.Text
  matterId  String
  matter    Matter   @relation(fields: [matterId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model OrgSettings {
  id                String  @id @default(cuid())
  orgId             String  @unique
  organization      Organization @relation(fields: [orgId], references: [id])
  defaultLocale     String  @default("es-MX")
  defaultJurisdiction String?
  aiModel           String  @default("claude-sonnet")
  enableBilingual   Boolean @default(true)
  brandColor        String? @default("#0C1B2A")
}
```

---

## PAGE STRUCTURE & ROUTING

```
/                          → Marketing landing page (public)
/login                     → Auth page (email + SSO)
/register                  → Registration with org creation
/onboarding                → Post-registration setup wizard

/app                       → Dashboard (protected, requires auth)
/app/investigador          → AI Research interface (main workspace)
/app/investigador/[sessionId] → Specific research conversation
/app/documentos            → Document library
/app/documentos/nuevo      → New document (AI drafting)
/app/documentos/[id]       → Document editor
/app/documentos/[id]/versiones → Version history
/app/asuntos               → Case/matter management
/app/asuntos/[id]          → Matter detail view
/app/plantillas            → Template library
/app/cumplimiento          → Regulatory alerts & monitoring
/app/cumplimiento/alertas  → Alert feed
/app/analitica             → Usage analytics dashboard

/app/configuracion              → Organization settings
/app/configuracion/equipo       → Team management (invite, roles)
/app/configuracion/facturacion  → Subscription & payment
/app/configuracion/api          → API key management
/app/configuracion/perfil       → User profile

/api/v1/...                → Public API (for enterprise)
```

**IMPORTANT:** All user-facing routes, labels, navigation items, and UI text default to Spanish (es-MX). English is available via locale toggle. Route slugs are in Spanish as shown above.

---

## KEY FEATURES — DETAILED SPECIFICATIONS

### Feature 1: AI Legal Research — Investigador

**The core product. This must be excellent. This is where JurisAI lives or dies.**

**UI:** Chat interface with legal-grade enhancements:
- Left sidebar: session history, grouped by date, searchable
- Top bar: jurisdiction selector (Federal / state dropdown with all 32 states), area of law filter, source type filter (códigos, jurisprudencia, reglamentos, NOMs)
- Main panel: chat messages with streaming responses
- Inline citations rendered as interactive gold-accented chips `[Art. 1916 CCF]` that expand on click to show source text, vigencia status, and link to full source
- Confidence indicator badge on each AI response (Alta / Media / Baja) color-coded green/amber/red
- "Exportar" button on any AI response → saves to Documentos
- "Nuevo asunto" quick-link to attach research to a Matter
- Suggested follow-up questions rendered as clickable pills below each response
- Markdown rendering for structured AI responses (headers, blockquotes for legal text, numbered lists)
- Copy-to-clipboard on any response block
- Mobile: collapsible sidebar, full-width chat

**AI Behavior — Non-negotiable rules:**
1. Every factual legal claim MUST include a citation to a specific Mexican legal source
2. Citations format: `[Art. 1916 CCF]`, `[Jurisprudencia 2a./J. 15/2024, SCJN]`, `[Art. 123 CPEUM]`
3. If uncertain, explicitly state uncertainty with confidence level
4. Always identify the applicable jurisdiction
5. Provide both the legal text (in blockquote) AND a plain-language explanation
6. When relevant, note recent reforms or pending changes
7. Cross-reference related provisions across codes
8. For amparo questions, trace the constitutional basis through the chain
9. Distinguish between jurisprudencia (binding) and tesis aisladas (non-binding)
10. Never hallucinate a citation — if no source found, say so explicitly

**Streaming:** Responses stream token-by-token via WebSocket. The citation chips render once the full citation identifier is received (buffer until closing bracket).

**System prompt for Investigador mode:**
```
You are JurisAI Investigador, an AI legal research assistant specialized in Mexican law.
You operate under Mexico's civil law system (sistema de derecho civil).

IDENTITY:
- You are JurisAI, created to serve Mexican legal professionals
- You are authoritative but transparent about uncertainty
- You cite every claim. No exceptions.

CORE RULES:
1. ALWAYS cite specific legal sources. Format: [Art. X, Código/Ley] or [Jurisprudencia Xa./J. XX/YYYY, SCJN]
2. Distinguish between jurisprudencia (binding, 5+ consistent rulings) and tesis aisladas (non-binding, persuasive only)
3. Identify the applicable jurisdiction (federal vs specific state)
4. Note the vigencia (current enforceability) of every cited provision
5. Flag any recent reforms (reformas) that may affect the answer — include DOF date if known
6. When multiple interpretations exist, present them with their respective legal basis
7. For constitutional questions, trace the hierarchy: Constitución → Ley → Reglamento → NOM/Circular
8. Use Mexican legal terminology precisely:
   - "demandado" not "acusado" in civil matters
   - "quejoso" in amparo proceedings
   - "patrón" not "empleador" in labor law (per LFT)
   - "fedatario público" when referring to notarios in their public faith capacity
9. If the question touches USMCA/T-MEC, cite both the treaty provision and implementing Mexican law
10. Respond in the user's language (Spanish or English) but ALWAYS cite sources in their original language
11. When citing Código Civil, always specify: Federal (CCF) vs state code (e.g., CCCDMX)
12. For fiscal/tax questions, note whether SAT has issued relevant reglas de miscelánea fiscal

CONFIDENCE LEVELS — assign to every response:
- ALTA: Direct, unambiguous statutory text or consolidated jurisprudencia (5+ consistent rulings from same Sala)
- MEDIA: Applicable tesis aislada, analogical interpretation, evolving jurisprudential criteria, or recently reformed area
- BAJA: No direct authority found, extrapolating from general principles, or conflicting criteria between Salas

RESPONSE FORMAT:
- Use structured headers for complex answers (## for main sections)
- Present relevant legal text in blockquotes (> )
- Follow with plain-language explanation
- End with: (a) related provisions worth consulting, (b) suggested follow-up questions
- For multi-issue questions, address each issue under its own header

NEVER DO:
- Never invent or fabricate a citation
- Never present tesis aisladas as binding without qualification
- Never ignore jurisdiction — federal vs state distinction is critical
- Never omit vigencia status on cited provisions
- Never provide legal advice — you provide legal research and analysis
```

### Feature 2: Document Drafting — Redactor

**UI:** Split-pane editor:
- Left pane: TipTap rich text editor with legal formatting toolbar (bold, italic, underline, numbered clauses, alignment, page break, insert table)
- Right pane: AI assistant panel — user types instructions, AI suggests content/edits inline
- Top bar: document title (editable), document type badge, status dropdown, Matter association selector
- Template selector modal with category filters and preview
- Variable fill-in wizard: step-by-step form for template variables (party names, dates, amounts, jurisdiction, etc.)
- Export toolbar: Download DOCX, Download PDF, Send to Matter
- Version history drawer: list of saves with diff view between versions
- Collaboration features (Phase 2): inline comments, @mentions, tracked changes

**Document generation flow:**
1. User clicks "Nuevo Documento" → selects document type from categorized grid
2. System shows relevant templates (system + org-custom), user picks one or starts blank
3. For templates: variable fill wizard appears (form fields for all `{{variables}}`)
4. AI generates first draft using template + variables + any additional user instructions
5. Draft appears in editor — user can edit freely
6. AI assistant panel stays open: user can ask "add a penalty clause for late payment" → AI generates clause → user accepts/rejects inline
7. "Verificar citas" button: runs citation check on all legal references in document, flags any invalid ones
8. Export generates clean DOCX (via docx-js on backend) or PDF (via Puppeteer/WeasyPrint)
9. Document auto-saves to matter, version history tracks every save

**System prompt for Redactor mode:**
```
You are JurisAI Redactor, an AI legal document drafting assistant for Mexican law.

IDENTITY:
- You draft legal documents, never provide legal advice
- You produce professional, court-ready Mexican legal documents
- You maintain the formal register expected in Mexican legal practice

CORE RULES:
1. Draft in formal Mexican legal Spanish unless English is explicitly requested
2. Use proper Mexican legal formulas and structure:
   - Contracts: "COMPARECEN", "DECLARAN", "CLÁUSULAS", "TRANSITORIOS"
   - Court filings: "H. JUZGADO...", "PROTESTO LO NECESARIO"
   - Corporate: "ACTA DE ASAMBLEA", "ORDEN DEL DÍA"
3. Include all legally required clauses for the specific document type under Mexican law
4. Reference applicable legal basis for key provisions (e.g., "en términos del artículo 2248 del CCF")
5. Use Mexican-standard formatting:
   - UPPERCASE for party references after first definition (e.g., "EL ARRENDADOR")
   - Numbered cláusulas (PRIMERA, SEGUNDA, etc.) in contracts
   - Roman numerals for sub-sections in court filings
6. Include jurisdiction and competencia clauses appropriate to the matter
7. For contracts: always include cláusula penal, resolución de controversias, domicilios convencionales, and identificación de las partes
8. For amparos: structure per Ley de Amparo requirements:
   - Autoridad responsable
   - Acto reclamado
   - Hechos (narración de antecedentes)
   - Conceptos de violación
   - Suspensión del acto reclamado (if applicable)
   - Pruebas
9. Flag any provisions that require notarial intervention (e.g., poder notarial, compraventa inmobiliaria)
10. Maintain internal consistency in defined terms throughout the document
11. Never leave placeholder text in outputs — all variables must be filled or clearly marked as [POR COMPLETAR]

FORMATTING:
- Use proper legal indentation and numbering
- Separate major sections with clear headers
- Include signature blocks with lines for Firma and Nombre
- Include testigo (witness) blocks where legally customary
- Date format: "[día] de [mes] de [año]" (e.g., "15 de marzo de 2026")
- Currency: "$XX,XXX.00 (CANTIDAD EN LETRA XX/100 M.N.)" for amounts
```

### Feature 3: Regulatory Compliance Monitor — Cumplimiento

**Background service (Python cron job / scheduled task) that:**
- Scrapes DOF (Diario Oficial de la Federación) daily for new publications
- Monitors SAT, IMSS, COFEPRIS, CNBV, SE, STPS publication feeds
- Classifies each new regulation/circular by area of law, jurisdiction, and impact level using AI
- Generates concise AI summaries in Spanish
- Matches alerts to each organization's configured areas of practice
- Delivers notifications: in-app badge + optional email digest (daily/weekly configurable)

**UI — /app/cumplimiento:**
- Alert feed: card-based list, filterable by authority, area of law, impact level, date range
- Each card: title, authority badge, impact level color indicator, date, 2-line summary
- Alert detail view: full AI summary, original source link, "Análisis de impacto" button
- "Análisis de impacto" → AI evaluates how the regulatory change affects the org's active matters, generates a brief per relevant matter
- Compliance calendar: timeline view with upcoming regulatory deadlines (declaraciones fiscales, IMSS reporting, annual compliance filings)
- Settings: configure which areas of law / authorities to monitor, notification preferences

### Feature 4: Analytics Dashboard — Analítica

**UI — /app/analitica:**
- Usage overview cards: total queries this period, documents generated, active matters, team members active
- Line chart: queries over time (daily/weekly/monthly toggle)
- Bar chart: queries by area of law
- Donut chart: document types generated
- Table: team member usage breakdown (name, queries, documents, last active)
- Subscription usage gauge: queries used / limit, documents used / limit, seats used / limit
- Export: download usage report as CSV

---

## AI PIPELINE — DETAILED ARCHITECTURE

### RAG Pipeline for Mexican Legal Corpus

```
User Query
    │
    ▼
[Query Preprocessing]
    │  - Language detection (es/en)
    │  - Legal entity extraction (article numbers, law names, court references, dates)
    │  - Jurisdiction identification (explicit or inferred from context)
    │  - Query expansion with Mexican legal synonyms
    │     e.g., "despido injustificado" → also search "rescisión laboral", "terminación de relación laboral"
    │
    ▼
[Hybrid Retrieval]
    │
    ├──▶ [Vector Search — Pinecone]
    │     - Semantic similarity using Cohere multilingual embeddings
    │     - Metadata filters: jurisdiction, area_of_law, source_type, vigente=true
    │     - Top 20 chunks retrieved
    │
    ├──▶ [Full-Text Search — Elasticsearch]
    │     - Exact match for article numbers, law abbreviations
    │     - Boolean queries for specific legal terms (e.g., "artículo 123 constitucional fracción XXII")
    │     - Spanish analyzer with legal stopwords
    │     - Top 10 results
    │
    ▼
[Reranking & Fusion]
    │  - Cohere reranker (multilingual)
    │  - Reciprocal Rank Fusion to combine vector + text results
    │  - Deduplicate overlapping chunks
    │  - Boost: jurisprudencia > tesis aislada > ley > reglamento (by authority weight)
    │  - Boost: more recent reforma > older version
    │  - Select top 8-12 chunks for context window
    │
    ▼
[Context Assembly]
    │  - Format retrieved chunks with full source metadata:
    │    { identifier, title, article, law_name, jurisdiction, vigente, last_reform_date }
    │  - Include citation identifiers for the LLM to reference
    │  - Add session context (previous messages in this research session)
    │  - Check token budget: ~6,000 tokens for context, ~2,000 for system prompt
    │
    ▼
[LLM Generation — Claude API]
    │  - System prompt (Investigador) + assembled context + user query
    │  - model: claude-sonnet-4-20250514 (balance of speed + quality)
    │  - max_tokens: 4096
    │  - temperature: 0.2 (factual, low creativity)
    │  - Stream response via WebSocket to client
    │
    ▼
[Post-Processing]
    │
    ├──▶ [Citation Extraction]
    │     - Regex parse all [bracketed citations] from response
    │     - Extract: article number, law abbreviation, jurisprudencia number
    │
    ├──▶ [Citation Verification]
    │     - Cross-reference each extracted citation against LegalSource table
    │     - For each citation: VERIFIED (found exact match) / PARTIAL (similar match) / UNVERIFIED (not found)
    │     - Assign response-level confidence based on % verified citations
    │
    ├──▶ [Metrics Logging]
    │     - Log: tokens_used, latency_ms, model, num_citations, confidence_score, retrieval_scores
    │     - Increment org usage counters
    │
    ▼
[Response Delivery]
       - Stream to client with citation metadata attached
       - Citation chips rendered with verification status (gold = verified, gray = unverified)
       - Cache response embedding for future semantic dedup
```

### Legal Corpus Ingestion Pipeline

```python
# ai_service/ingestion/mexican_legal_parser.py

from enum import Enum
from dataclasses import dataclass
from typing import Optional
import re


class SourceType(Enum):
    CONSTITUCION = "constitucion"
    CODIGO_FEDERAL = "codigo_federal"
    CODIGO_ESTATAL = "codigo_estatal"
    LEY_FEDERAL = "ley_federal"
    LEY_ESTATAL = "ley_estatal"
    REGLAMENTO = "reglamento"
    NOM = "nom"
    JURISPRUDENCIA = "jurisprudencia"
    TESIS_AISLADA = "tesis_aislada"
    DOF = "dof_publicacion"
    TRATADO = "tratado"
    CIRCULAR = "circular"


@dataclass
class LegalChunk:
    """A single chunk of Mexican legal text ready for embedding."""
    text: str                          # The chunk content
    identifier: str                    # Unique ID, e.g., "CCF-ART-1916"
    source_type: SourceType
    law_name: str                      # Full name: "Código Civil Federal"
    law_abbreviation: str              # Short: "CCF"
    jurisdiction: str                  # "federal", "cdmx", "jalisco", etc.
    article: Optional[str] = None
    book: Optional[str] = None
    title: Optional[str] = None        # Título (legal subdivision)
    chapter: Optional[str] = None
    vigente: bool = True
    last_reform_date: Optional[str] = None
    dof_reference: Optional[str] = None
    authority_level: int = 3           # 1=constitución, 2=ley, 3=reglamento, 4=nom, 5=circular
    
    # Hierarchical context prepended to chunk for embedding
    @property
    def context_prefix(self) -> str:
        parts = [self.law_name]
        if self.book:
            parts.append(f"Libro {self.book}")
        if self.title:
            parts.append(f"Título {self.title}")
        if self.chapter:
            parts.append(f"Capítulo {self.chapter}")
        if self.article:
            parts.append(f"Artículo {self.article}")
        return " > ".join(parts)
    
    @property
    def embedding_text(self) -> str:
        return f"{self.context_prefix}\n\n{self.text}"
    
    @property
    def pinecone_metadata(self) -> dict:
        return {
            "identifier": self.identifier,
            "source_type": self.source_type.value,
            "law_name": self.law_name,
            "law_abbreviation": self.law_abbreviation,
            "jurisdiction": self.jurisdiction,
            "article": self.article or "",
            "vigente": self.vigente,
            "last_reform_date": self.last_reform_date or "",
            "authority_level": self.authority_level,
        }


class MexicanLegalParser:
    """
    Parses Mexican legal documents into structured LegalChunks
    suitable for embedding and retrieval in JurisAI.
    """
    
    # Common Mexican legal code abbreviations
    CODE_MAP = {
        "Constitución Política de los Estados Unidos Mexicanos": ("CPEUM", "federal", 1),
        "Código Civil Federal": ("CCF", "federal", 2),
        "Código Penal Federal": ("CPF", "federal", 2),
        "Código de Comercio": ("CCo", "federal", 2),
        "Código Federal de Procedimientos Civiles": ("CFPC", "federal", 2),
        "Código Nacional de Procedimientos Penales": ("CNPP", "federal", 2),
        "Ley Federal del Trabajo": ("LFT", "federal", 2),
        "Ley del Impuesto Sobre la Renta": ("LISR", "federal", 2),
        "Ley del Impuesto al Valor Agregado": ("LIVA", "federal", 2),
        "Código Fiscal de la Federación": ("CFF", "federal", 2),
        "Ley General de Sociedades Mercantiles": ("LGSM", "federal", 2),
        "Ley de Amparo": ("LA", "federal", 2),
        "Ley Federal de Protección al Consumidor": ("LFPC", "federal", 2),
        "Ley General de Salud": ("LGS", "federal", 2),
        "Ley Federal de Protección de Datos Personales": ("LFPDPPP", "federal", 2),
    }
    
    def parse_codigo(self, raw_text: str, law_name: str, jurisdiction: str = "federal") -> list[LegalChunk]:
        """
        Parse a Mexican legal code into article-level chunks.
        
        Structure hierarchy: Libro > Título > Capítulo > Sección > Artículo
        Each article becomes one chunk with full hierarchical context.
        Transitorios (transitional articles) are parsed separately.
        """
        chunks = []
        abbreviation, _, authority = self.CODE_MAP.get(law_name, (law_name[:5].upper(), jurisdiction, 3))
        
        # Parse hierarchical structure
        current_book = None
        current_title = None
        current_chapter = None
        
        # Split by article boundaries
        article_pattern = re.compile(
            r'(?:Artículo|ARTÍCULO)\s+(\d+(?:\s*[Bb]is|[Tt]er|[Qq]uáter)?)\s*[\.\-\:]?\s*',
            re.MULTILINE
        )
        
        # Implementation: iterate through articles, track parent hierarchy,
        # create one LegalChunk per article with context_prefix from hierarchy
        # Target chunk size: 256-1024 tokens per chunk
        # If article exceeds 1024 tokens, split at paragraph boundaries
        # Always include cross-reference: previous article number + next article number in metadata
        
        return chunks
    
    def parse_jurisprudencia(self, raw_text: str) -> list[LegalChunk]:
        """
        Parse SCJN jurisprudencia and tesis aisladas.
        
        Key fields to extract:
        - Registro digital (unique ID)
        - Número de tesis (e.g., "2a./J. 15/2024")
        - Época (10a Época, 11a Época)
        - Instancia (Pleno, Primera Sala, Segunda Sala, Tribunales Colegiados)
        - Materia (Civil, Penal, Laboral, Administrativa, Constitucional)
        - Tipo (Jurisprudencia vs Tesis Aislada)
        - Rubro (heading/summary)
        - Texto (full body)
        - Precedentes (cases that form the jurisprudencia)
        """
        chunks = []
        # Each tesis = 1 chunk
        # identifier format: "SCJN-{sala}-{type}-{number}" e.g., "SCJN-2a-J-15-2024"
        # source_type: JURISPRUDENCIA or TESIS_AISLADA based on tipo field
        # authority_level: 1 for Pleno jurisprudencia, 2 for Sala, 3 for TCC
        return chunks
    
    def parse_dof(self, raw_text: str, metadata: dict) -> list[LegalChunk]:
        """
        Parse Diario Oficial de la Federación publications.
        Types: decretos, acuerdos, avisos, circulares, sentencias, licitaciones
        """
        chunks = []
        return chunks
    
    def chunk_document(self, parsed_doc: str, max_tokens: int = 1024) -> list[str]:
        """
        Smart chunking respecting legal document structure.
        
        Rules:
        - NEVER split an article across chunks
        - Include hierarchical context prefix in every chunk
        - Overlap: include reference to previous/next article in metadata
        - Target: 256-1024 tokens per chunk
        - If single article > max_tokens, split at paragraph/fracción boundaries
        """
        pass
    
    def generate_embeddings(self, chunks: list[LegalChunk], batch_size: int = 96):
        """
        Generate multilingual embeddings using Cohere embed-multilingual-v3.0
        and upsert to Pinecone.
        
        Pinecone index configuration:
        - Dimension: 1024 (Cohere multilingual v3)
        - Metric: cosine
        - Metadata fields indexed for filtering:
            source_type, jurisdiction, law_abbreviation, vigente, authority_level
        """
        # Batch embed using Cohere
        # Upsert to Pinecone with metadata
        # Store pinecone chunk IDs back in PostgreSQL LegalSource table
        pass


# Priority ingestion order for MVP:
# 1. CPEUM (Constitución) — foundation of everything
# 2. CCF (Código Civil Federal) — most-used code
# 3. LFT (Ley Federal del Trabajo) — high-demand area
# 4. CFF + LISR + LIVA (tax codes) — massive demand from SMEs/corporates
# 5. LGSM (Sociedades Mercantiles) — corporate law
# 6. LA (Ley de Amparo) — unique differentiator
# 7. CNPP (Procedimientos Penales) — criminal procedure
# 8. CCo (Código de Comercio) — commercial law
# 9. Top 1000 SCJN jurisprudencias by citation frequency
# 10. State codes: CDMX, Jalisco, Nuevo León, Estado de México (top 4 by legal activity)
```

### FastAPI Service Structure

```
ai_service/
├── main.py                    # FastAPI app, CORS, middleware
├── config.py                  # Settings from env vars
├── routers/
│   ├── research.py            # POST /research/query (streaming)
│   ├── drafting.py            # POST /draft/generate
│   ├── compliance.py          # GET /compliance/scan
│   └── health.py              # GET /health
├── services/
│   ├── rag_pipeline.py        # Full RAG orchestration
│   ├── retriever.py           # Pinecone + Elasticsearch hybrid retrieval
│   ├── reranker.py            # Cohere reranking + fusion
│   ├── generator.py           # Claude API call + streaming
│   ├── citation_verifier.py   # Post-processing citation check
│   ├── query_preprocessor.py  # NER, jurisdiction detection, expansion
│   └── compliance_scanner.py  # DOF scraping + classification
├── ingestion/
│   ├── mexican_legal_parser.py
│   ├── dof_scraper.py
│   ├── scjn_scraper.py
│   └── embedder.py
├── models/
│   ├── schemas.py             # Pydantic models
│   └── prompts.py             # All system prompts versioned here
├── utils/
│   ├── mexican_legal_nlp.py   # Spanish legal NER, abbreviation expansion
│   ├── cache.py               # Redis caching layer
│   └── metrics.py             # Usage tracking
└── tests/
    ├── test_rag_pipeline.py
    ├── test_citation_verifier.py
    ├── test_legal_parser.py
    └── fixtures/               # Sample legal texts for testing
```

---

## AUTHENTICATION & AUTHORIZATION

### Auth Flow
1. Registration → Create User + Organization + default OrgMember(OWNER) + Subscription(FREE_TRIAL, 14 days)
2. Login → NextAuth.js session → JWT containing: userId, orgId, role, plan, locale
3. Middleware on all `/app/*` routes: verify JWT, check subscription status (block if CANCELED/PAST_DUE with grace), inject org context
4. API routes: extract JWT from header, verify role permissions per endpoint
5. Usage checks: before AI queries, verify queriesUsed < queriesLimit for current billing period

### Permission Matrix

| Action | OWNER | ADMIN | LAWYER | PARALEGAL | VIEWER |
|--------|-------|-------|--------|-----------|--------|
| Investigador (AI research) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Redactor (create/edit docs) | ✅ | ✅ | ✅ | ✅ | ❌ |
| View documents (read-only) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage asuntos (matters) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cumplimiento (compliance) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Analítica (analytics) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage equipo (team) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Facturación (billing) | ✅ | ✅ | ❌ | ❌ | ❌ |
| API keys | ✅ | ✅ | ❌ | ❌ | ❌ |
| Org settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## API DESIGN

### Internal API (Next.js API Routes)

```
# Auth
POST   /api/auth/register          → Create user + org + trial sub
POST   /api/auth/[...nextauth]     → NextAuth handlers

# Investigador (Research)
GET    /api/investigador/sesiones                → List research sessions
POST   /api/investigador/sesiones                → Create new session
GET    /api/investigador/sesiones/[id]           → Get session with messages
DELETE /api/investigador/sesiones/[id]           → Delete session
POST   /api/investigador/consulta                → Submit query → proxies to FastAPI, streams back via WebSocket
POST   /api/investigador/sesiones/[id]/exportar  → Export session to document

# Documentos
GET    /api/documentos                    → List documents (filterable)
POST   /api/documentos                    → Create document
GET    /api/documentos/[id]               → Get document
PUT    /api/documentos/[id]               → Update document content
DELETE /api/documentos/[id]               → Soft delete
POST   /api/documentos/[id]/exportar      → Generate DOCX or PDF download
GET    /api/documentos/[id]/versiones     → List versions
POST   /api/documentos/[id]/verificar     → Run citation verification on document

# Asuntos (Matters)
GET    /api/asuntos                       → List matters
POST   /api/asuntos                       → Create matter
GET    /api/asuntos/[id]                  → Get matter with related docs/sessions
PUT    /api/asuntos/[id]                  → Update matter
DELETE /api/asuntos/[id]                  → Archive matter

# Plantillas (Templates)
GET    /api/plantillas                    → List templates (system + org)
POST   /api/plantillas                    → Create org template
GET    /api/plantillas/[id]               → Get template with variables
PUT    /api/plantillas/[id]               → Update template
DELETE /api/plantillas/[id]               → Delete org template

# Cumplimiento (Compliance)
GET    /api/cumplimiento/alertas          → List alerts (filterable)
GET    /api/cumplimiento/alertas/[id]     → Alert detail
POST   /api/cumplimiento/alertas/[id]/impacto → Run AI impact analysis vs org's matters
GET    /api/cumplimiento/calendario       → Compliance deadlines

# Analítica
GET    /api/analitica/uso                 → Usage stats for current period
GET    /api/analitica/consultas           → Query analytics (volume, areas, confidence)
GET    /api/analitica/equipo              → Team member activity

# Configuración
GET    /api/configuracion/org             → Get org settings
PUT    /api/configuracion/org             → Update org settings
GET    /api/configuracion/equipo          → List team members
POST   /api/configuracion/equipo/invitar  → Send invite email
PUT    /api/configuracion/equipo/[memberId] → Update member role
DELETE /api/configuracion/equipo/[memberId] → Remove member
GET    /api/configuracion/facturacion     → Get subscription + invoices
POST   /api/configuracion/facturacion/checkout → Create Stripe/Conekta checkout session
POST   /api/configuracion/facturacion/portal   → Create billing portal session
GET    /api/configuracion/perfil          → Get user profile
PUT    /api/configuracion/perfil          → Update user profile

# API Keys
GET    /api/configuracion/api-keys        → List API keys (prefix only, never full key)
POST   /api/configuracion/api-keys        → Generate new key (return full key ONCE)
DELETE /api/configuracion/api-keys/[id]   → Revoke key
```

### Public API v1 (Enterprise — API key auth via `Authorization: Bearer jai_xxxxxxxxxxxx`)

```
POST   /api/v1/investigador/consulta      → Research query (non-streaming JSON response)
POST   /api/v1/redactor/generar           → Generate document from template + variables
GET    /api/v1/cumplimiento/alertas       → Compliance alerts feed
GET    /api/v1/fuentes/buscar             → Search legal corpus directly
GET    /api/v1/uso                        → API usage stats
```

Rate limits: Básico = 100 queries/day, Profesional = 500/day, Empresa = custom, PyME = 30/day

---

## LANDING PAGE — jurisai.com.mx

**Design direction:** Premium law meets cutting-edge tech. Dark navy (#0C1B2A) primary background, white text, gold (#C9A84C) accents for CTAs and highlights. Think: the authority of a marble courthouse + the innovation of a fintech unicorn. No generic AI aesthetics. This should feel like it was designed by a top-tier Mexican design studio.

**Typography:** Display font: something editorial and commanding (DM Serif Display or similar serif). Body: clean geometric sans (Satoshi, General Sans, or similar). Never Inter, never Roboto, never Arial.

**Sections in order:**

1. **Hero** (full viewport)
   - Headline: "Tu Copiloto Legal con Inteligencia Artificial"
   - Subheadline: "Investigación jurídica, redacción de documentos y cumplimiento regulatorio — impulsados por IA, diseñados para el derecho mexicano."
   - Two CTAs: "Comenzar Prueba Gratis" (gold button) + "Ver Demo" (outline button)
   - Product screenshot/mockup showing the Investigador interface with a real Mexican legal query and citation chips
   - Subtle animated background: abstract geometric pattern evoking legal scales / code structure

2. **Trusted By** (logo bar)
   - "Utilizado por despachos líderes en México"
   - Placeholder for beta firm logos (use tasteful gray placeholders during pre-launch)

3. **Problem Statement**
   - "Los abogados mexicanos pasan 60% de su tiempo en tareas que la IA puede resolver"
   - Three pain points with icons: Manual research (hours searching in código), Repetitive drafting (same contracts rewritten), Regulatory maze (32 states × federal = chaos)

4. **Three Modules** (feature showcase)
   - **Investigador** — AI legal research with verified citations. Show: chat interface with citation chips, confidence badges, jurisdiction selector
   - **Redactor** — AI document drafting in proper Mexican legal Spanish. Show: split-pane editor with AI panel
   - **Cumplimiento** — Real-time regulatory monitoring. Show: alert feed with DOF badges
   - Each module: icon, title, 2-line description, "Explorar →" link, product screenshot

5. **Interactive Demo Section**
   - Embedded demo: pre-loaded research query "¿Cuáles son los requisitos para interponer un amparo indirecto?" showing JurisAI's real response with citations
   - OR: 60-second video walkthrough

6. **How It Works** (3-step)
   - Step 1: "Haz tu consulta" — Ask any legal question in natural language
   - Step 2: "JurisAI investiga" — AI searches across códigos, jurisprudencia, and regulations
   - Step 3: "Obtén respuestas verificadas" — Every claim cited, every source linked

7. **Built for Mexican Law** (differentiators)
   - Grid of capabilities:
     - "32 códigos estatales + federal"
     - "Jurisprudencia SCJN verificada"
     - "Amparos y derecho constitucional"
     - "Cumplimiento SAT, IMSS, COFEPRIS"
     - "Bilingüe: español ↔ inglés"
     - "Sistema notarial mexicano"

8. **Pricing** — `/precios` anchor
   - Four tier cards: PyME ($499 MXN), Básico ($1,499 MXN), Profesional ($2,999 MXN/usuario), Empresa (Contactar)
   - Feature comparison table below cards
   - Toggle: Mensual / Anual (20% discount on annual)
   - "Prueba gratis por 14 días" badge on all tiers

9. **Security & Compliance**
   - "Tus datos están protegidos"
   - Badges: Cifrado AES-256, LFPDPPP Compliant, Hosting en México/LATAM, Zero data retention on AI
   - Brief explanation: "JurisAI nunca usa tus consultas o documentos para entrenar modelos de IA."

10. **FAQ**
    - "¿Qué tan preciso es JurisAI?" → Citation verification + confidence scoring explanation
    - "¿Reemplaza a un abogado?" → No, it's a research and drafting tool for legal professionals
    - "¿Mis datos son confidenciales?" → Yes, encrypted, isolated per organization, never used for training
    - "¿Cubre derecho estatal?" → Currently federal + CDMX/JAL/NL/EDOMEX, expanding to all 32 states
    - "¿Puedo cancelar en cualquier momento?" → Yes, no long-term contracts
    - "¿Funciona en inglés?" → Yes, bilingual by design for cross-border work

11. **Final CTA**
    - "Transforma tu práctica legal hoy"
    - Large gold "Crear Cuenta Gratis" button
    - "Sin tarjeta de crédito. 14 días de prueba."

12. **Footer**
    - JurisAI logo + tagline
    - Links: Producto, Precios, Blog, Soporte, API Docs
    - Legal: Aviso de Privacidad, Términos de Servicio
    - Contact: hola@jurisai.com.mx
    - Social: LinkedIn, X/Twitter
    - "Hecho en México 🇲🇽"

---

## IMPLEMENTATION ORDER

Build in this exact sequence. Each sprint = 2 weeks.

### Sprint 1 (Weeks 1-2): Foundation & Auth
- [ ] Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui
- [ ] Configure next-intl with es-MX (default) and en message files
- [ ] Prisma schema → PostgreSQL (Neon/Supabase) → run initial migration
- [ ] NextAuth.js v5 setup: email/password + Google SSO
- [ ] Registration flow: signup → create User + Organization + FREE_TRIAL Subscription
- [ ] Login page with JurisAI branding
- [ ] App layout: sidebar navigation (Investigador, Documentos, Asuntos, Cumplimiento, Analítica, Configuración), top bar (org name, user avatar, locale toggle)
- [ ] Basic dashboard at /app showing welcome state
- [ ] User profile page at /app/configuracion/perfil
- [ ] Middleware: auth check on /app/*, subscription status check, role injection

### Sprint 2 (Weeks 3-4): AI Research Core — Investigador
- [ ] FastAPI Python service setup with project structure (see above)
- [ ] Pinecone index creation (dimension 1024, cosine metric)
- [ ] Legal corpus ingestion: CPEUM + CCF + LFT (minimum viable corpus)
- [ ] Cohere embeddings integration → Pinecone upsert
- [ ] Elasticsearch index for full-text legal search
- [ ] Query preprocessor: language detection, legal entity extraction, jurisdiction inference
- [ ] Hybrid retrieval: Pinecone vector + Elasticsearch text → Cohere reranker → context assembly
- [ ] Claude API integration with Investigador system prompt
- [ ] WebSocket streaming endpoint (FastAPI → Next.js → client)
- [ ] Research session CRUD (create, list, get, delete)
- [ ] Full Investigador UI:
  - [ ] Chat interface with message bubbles
  - [ ] Streaming text rendering
  - [ ] Citation chip rendering (parse `[Art. X, CODE]` → interactive gold chips)
  - [ ] Citation expansion panel (click chip → show source text + metadata)
  - [ ] Confidence badge (Alta/Media/Baja)
  - [ ] Jurisdiction selector (top bar dropdown)
  - [ ] Session sidebar (history, search, grouped by date)
  - [ ] Suggested follow-up pills
  - [ ] "Exportar" button → save response as Document
  - [ ] Empty state for new users
  - [ ] Loading/streaming state
  - [ ] Error state with retry

### Sprint 3 (Weeks 5-6): Documents & Matters — Redactor + Asuntos
- [ ] Matter CRUD: create, list, get, update, archive
- [ ] Matter detail page with tabs: Documentos, Investigación, Notas
- [ ] Document CRUD: create, list, get, update, soft delete
- [ ] Document library page with filters (type, status, matter, date range)
- [ ] Template system: seed 10+ system templates for common Mexican documents:
  - Contrato de arrendamiento
  - Contrato de prestación de servicios
  - Contrato de compraventa
  - NDA / Convenio de confidencialidad
  - Contrato laboral individual
  - Poder notarial (general/especial)
  - Acta constitutiva (SA de CV, SAS)
  - Demanda de amparo indirecto
  - Escrito de agravios
  - Convenio de divorcio incausado
- [ ] Template variable system: JSON schema per template, auto-generated form
- [ ] AI document generation endpoint: template + variables + user instructions → Claude Redactor prompt → full draft
- [ ] TipTap rich text editor integration with legal formatting toolbar
- [ ] AI assistant panel (right side): inline instructions → AI generates clause/section → insert into editor
- [ ] Document versioning: auto-save creates version, version list, diff view
- [ ] DOCX export via docx-js (server-side generation)
- [ ] PDF export via Puppeteer or WeasyPrint
- [ ] Citation verification button: scans document for legal references, validates against corpus

### Sprint 4 (Weeks 7-8): Billing, Analytics & Compliance
- [ ] Stripe integration:
  - Products/prices for all 4 tiers (monthly + annual)
  - Checkout session creation
  - Webhook handler: subscription.created, updated, deleted, invoice.paid, invoice.payment_failed
  - Customer portal for self-service billing management
- [ ] Conekta integration:
  - OXXO cash payments
  - SPEI bank transfers
  - Domiciliación (recurring bank debit)
  - Webhook handlers
- [ ] Subscription management UI at /app/configuracion/facturacion:
  - Current plan display
  - Usage gauges (queries, documents, seats)
  - Upgrade/downgrade flow
  - Invoice history
  - Payment method management
- [ ] Usage metering: increment counters on each AI query/document generation, enforce limits with clear "upgrade" prompts
- [ ] Team management at /app/configuracion/equipo:
  - Invite by email (sends magic link)
  - Role assignment dropdown
  - Remove member
  - Seat count vs limit display
- [ ] Analytics dashboard at /app/analitica:
  - Usage overview cards (Recharts)
  - Query volume line chart
  - Area of law distribution bar chart
  - Document type donut chart
  - Team activity table
  - CSV export
- [ ] Compliance module foundation:
  - DOF scraper (Python cron, runs daily)
  - Alert classification pipeline (AI categorizes by area + impact)
  - Alert CRUD API
  - Alert feed UI with filters
  - Alert detail with AI summary
- [ ] Email integration (Resend): welcome email, invite email, weekly usage digest, compliance alert digest

### Sprint 5 (Weeks 9-10): Landing Page, Polish & Launch Prep
- [ ] Landing page at / (see specification above) — full implementation with animations
- [ ] Onboarding wizard (post-registration):
  - Step 1: Organization details (name, type, RFC)
  - Step 2: Practice areas selection
  - Step 3: Invite team members (optional)
  - Step 4: First research query (guided)
- [ ] Responsive design pass: all pages must work on mobile (375px+) and tablet (768px+)
- [ ] Empty states: every list/page has a meaningful empty state with CTA
- [ ] Loading states: skeleton loaders for all data-fetching components
- [ ] Error handling:
  - Error boundaries on all page components
  - Toast notifications for user actions (success/error)
  - Graceful degradation when AI service is unavailable
  - Retry logic on failed API calls (exponential backoff)
- [ ] Audit logging: log all significant actions (login, query, document CRUD, settings changes)
- [ ] Rate limiting: Upstash Redis rate limiter on all API routes
- [ ] Security:
  - CSRF protection
  - XSS sanitization on all user inputs
  - SQL injection prevention (Prisma parameterized by default)
  - Content Security Policy headers
  - Secure cookie configuration
- [ ] SEO: meta tags, Open Graph, sitemap.xml, robots.txt
- [ ] Performance: 
  - Lighthouse score > 90
  - First Contentful Paint < 1.5s
  - AI response start streaming < 2s
- [ ] Accessibility: WCAG 2.1 AA compliance on all interactive elements
- [ ] Testing:
  - Unit tests (Vitest) for utility functions and components
  - Integration tests for API routes
  - E2E tests (Playwright) for critical flows:
    - Registration → onboarding → first query
    - Document creation → template fill → export
    - Billing upgrade flow
  - AI quality benchmark: 100 curated Mexican legal questions with verified answers
- [ ] Deployment:
  - Vercel project for Next.js (production + preview environments)
  - Railway/Fly.io for FastAPI AI service
  - GitHub Actions CI/CD pipeline
  - Environment variable configuration
  - Health check endpoints
  - Error alerting via Sentry

---

## TESTING REQUIREMENTS

### AI Quality Benchmark

Create a test suite of 100 Mexican legal questions across all major areas of law. For each question, include the verified correct answer with exact citations. Run this benchmark on every deployment to track accuracy over time.

Example test cases:
```json
[
  {
    "question": "¿Cuál es el plazo de prescripción para una acción civil por daño moral en México?",
    "expected_citations": ["Art. 1916 CCF", "Art. 1934 CCF"],
    "expected_jurisdiction": "federal",
    "expected_confidence": "ALTA",
    "area_of_law": "CIVIL"
  },
  {
    "question": "¿Cuáles son los requisitos para constituir una Sociedad por Acciones Simplificada?",
    "expected_citations": ["Art. 260-273 LGSM"],
    "expected_jurisdiction": "federal",
    "expected_confidence": "ALTA",
    "area_of_law": "CORPORATIVO"
  },
  {
    "question": "¿En qué casos procede el amparo indirecto?",
    "expected_citations": ["Art. 107 LA"],
    "expected_jurisdiction": "federal",
    "expected_confidence": "ALTA",
    "area_of_law": "CONSTITUCIONAL"
  }
]
```

### Performance Benchmarks
- Landing page: LCP < 2.5s, FID < 100ms, CLS < 0.1
- App pages: FCP < 1.5s
- AI query: first token streaming < 2s, full response < 15s
- Document generation: < 10s for standard contract
- API response (non-AI): p95 < 200ms

---

## ENVIRONMENT VARIABLES

```env
# ============================================================
# DATABASE
# ============================================================
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# ============================================================
# AUTH
# ============================================================
NEXTAUTH_URL=https://jurisai.com.mx
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# ============================================================
# AI PROVIDERS
# ============================================================
ANTHROPIC_API_KEY=
OPENAI_API_KEY=                    # Fallback
COHERE_API_KEY=                    # Embeddings + reranking

# ============================================================
# VECTOR DB & SEARCH
# ============================================================
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=jurisai-legal-corpus
ELASTICSEARCH_URL=
ELASTICSEARCH_API_KEY=

# ============================================================
# STORAGE
# ============================================================
S3_BUCKET=jurisai-documents
S3_REGION=us-east-1               # Or Cloudflare R2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# ============================================================
# PAYMENTS
# ============================================================
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CONEKTA_PRIVATE_KEY=
CONEKTA_PUBLIC_KEY=
CONEKTA_WEBHOOK_KEY=

# ============================================================
# EMAIL
# ============================================================
RESEND_API_KEY=
EMAIL_FROM=hola@jurisai.com.mx

# ============================================================
# MONITORING
# ============================================================
SENTRY_DSN=
POSTHOG_KEY=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=jurisai-production

# ============================================================
# AI SERVICE
# ============================================================
AI_SERVICE_URL=http://localhost:8000    # FastAPI service URL
AI_SERVICE_API_KEY=                     # Internal service-to-service auth

# ============================================================
# APP
# ============================================================
NEXT_PUBLIC_APP_URL=https://jurisai.com.mx
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## CODING STANDARDS

### TypeScript (Next.js)
- Strict mode: `"strict": true` in tsconfig
- ESLint + Prettier with consistent config
- Path aliases: `@/` for root imports
- Server Components by default, `"use client"` only when needed (interactivity, hooks)
- Zod schemas mirror Prisma types for runtime validation
- All API responses: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- All dates in ISO 8601 UTC
- All monetary values in centavos (MXN) as integers, format with Intl.NumberFormat("es-MX")
- Spanish UI text via next-intl message files — NEVER hardcode strings in components
- Error boundaries on all page-level components
- Suspense boundaries with skeleton loaders for async data

### Python (FastAPI)
- Python 3.11+
- Type hints everywhere
- Pydantic v2 for all request/response models
- Async endpoints where I/O bound
- Structured JSON logging with correlation IDs (passed from Next.js)
- pytest for all tests
- Black + isort for formatting
- mypy for type checking

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Branch naming: `feat/investigador-streaming`, `fix/citation-parsing`
- PR required for main, with passing CI

### AI-Specific
- Every AI response logged with: model, tokens, latency, citations, confidence, session_id
- All system prompts versioned in `ai_service/models/prompts.py` — never inline
- Prompt changes tracked in LangSmith
- Citation verification runs on every response — never skip

---

## FINAL DIRECTIVES FOR CLAUDE CODE

1. **Schema first.** Run migrations and verify the database before writing any UI.
2. **Investigador is the product.** The research chat must be flawless — streaming, citations, confidence. Spend 40% of effort here.
3. **Streaming is non-negotiable.** Users must see AI responses appear token-by-token. No loading spinner then full dump.
4. **Citations are the trust layer.** Every citation chip must link to a real, verified source. Unverified citations get a gray warning badge.
5. **Spanish first, always.** Default locale is es-MX. All routes, labels, empty states, error messages in Spanish. English is a toggle.
6. **Branding matters.** JurisAI is premium. Deep navy, gold accents, editorial serif for headings. No generic AI aesthetic.
7. **Performance is a feature.** FCP < 1.5s, AI stream start < 2s. Mexican internet can be slow — optimize accordingly.
8. **Mobile is required.** Many Mexican lawyers work from phones. Every page must be responsive from 375px.
9. **The landing page sells.** Make it stunning. It should make a senior partner at a CDMX law firm think "this is serious."
10. **Ship Sprint 1-2 as MVP.** Auth + Investigador is enough to get in front of beta users. Everything else is iteration.
11. **Test with real Mexican legal questions.** Not hypotheticals. Use the benchmark suite to validate accuracy.
12. **Never store API keys in code.** All secrets via environment variables. API keys prefixed with `jai_`.
13. **Log everything.** Audit trail on all user actions. Usage metrics on all AI calls. This data drives the business.
14. **Mexican payment methods are essential.** Many firms pay via OXXO or SPEI. Conekta integration is not optional.
15. **The corpus grows over time.** Design the ingestion pipeline to be easily extensible. New codes and states will be added monthly.
