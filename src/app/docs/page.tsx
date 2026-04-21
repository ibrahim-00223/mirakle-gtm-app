import { BookOpen, Database, Globe, Palette, Workflow, Server, CheckSquare } from 'lucide-react'

const sections = [
  { id: 'architecture', label: 'Architecture', icon: Workflow },
  { id: 'database', label: 'Base de données', icon: Database },
  { id: 'api', label: 'API Routes', icon: Server },
  { id: 'design', label: 'Design System', icon: Palette },
  { id: 'integration', label: 'Intégrations', icon: Globe },
  { id: 'deployment', label: 'Déploiement', icon: CheckSquare },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="text-[18px] leading-[28px] font-bold text-[#03182F] mb-4 pb-3 border-b border-[#03182F]/10">
        {title}
      </h2>
      <div className="text-[#30373E]/70 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#03182F] border border-[#03182F]/20 rounded-lg p-4 overflow-x-auto text-xs text-white/80 leading-relaxed">
      {children}
    </pre>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold mr-1.5"
      style={{ background: color + '20', color, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  )
}

function ApiRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = { GET: '#2764FF', POST: '#2764FF', PATCH: '#F22E75' }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#03182F]/5 last:border-0">
      <Badge color={colors[method] || '#30373E'}>{method}</Badge>
      <code className="text-[#03182F] text-xs flex-1">{path}</code>
      <span className="text-[#30373E]/50 text-xs text-right">{desc}</span>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#2764FF]" />
          <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Documentation Technique</h1>
        </div>
        <p className="text-[#30373E]/60 text-sm">
          Référence complète du pipeline de prospection intelligente Mirakle GTM
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sticky TOC */}
        <aside className="hidden xl:block w-52 shrink-0">
          <div className="sticky top-6 bg-white border border-[#03182F]/10 rounded-lg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <p className="text-[10px] font-semibold text-[#30373E]/40 uppercase tracking-wider mb-3">
              Table des matières
            </p>
            <nav className="space-y-0.5">
              {sections.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#30373E]/60 hover:text-[#03182F] rounded-lg hover:bg-[#F2F8FF] transition-all"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 bg-white border border-[#03182F]/10 rounded-lg p-8 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          {/* Architecture */}
          <Section id="architecture" title="Architecture — 2 Workflows n8n">
            <p>
              L'application orchestre <strong className="text-[#03182F]">deux workflows n8n distincts</strong> pour
              automatiser le pipeline complet de prospection B2B.
            </p>

            <div>
              <p className="text-[#03182F] text-xs font-semibold mb-2">Workflow 1 — Création de campagne</p>
              <CodeBlock>{`Bouton "Créer une campagne" + paramètres
        ↓
Webhook n8n déclenché (POST /api/campaigns)
        ↓
Cargo: scrape & enrichit les entreprises (LinkedIn, marketplaces)
        ↓
OpenAI Embeddings: matching vendeur ↔ data marketplace Mirakle
        ↓
Cargo: identification des key contacts par entreprise
        ↓
Supabase: alimenté (companies + contacts + scores)
        ↓
POST /api/webhooks/n8n → status campaign "ready"
        ↓
Notification BDR/SDR: "Campagne prête à lancer"`}</CodeBlock>
            </div>

            <div>
              <p className="text-[#03182F] text-xs font-semibold mb-2">Workflow 2 — Lancement de campagne</p>
              <CodeBlock>{`Bouton "Lancer la campagne" → confirmation modale
        ↓
POST /api/campaigns/[id]/launch
        ↓
Webhook n8n déclenché
        ↓
Dust Agent: génère un mail personnalisé par contact qualifié
        ↓
Mails envoyés + PATCH contacts.mail_status
        ↓
POST /api/webhooks/n8n → status campaign "completed"`}</CodeBlock>
            </div>
          </Section>

          {/* Database */}
          <Section id="database" title="Schéma Base de données (Supabase)">
            <p>PostgreSQL hébergé sur Supabase avec l'extension <code className="text-[#2764FF]">pgvector</code> pour les embeddings.</p>

            <CodeBlock>{`-- Campagnes
campaigns (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  sector      text,             -- 'fashion' | 'beauty' | 'home' | ...
  source_marketplace text,      -- 'Amazon FR' | 'Cdiscount' | 'Fnac'
  catalog_size text,            -- 'small' | 'medium' | 'large'
  tone        text,             -- 'consultative' | 'direct' | 'educational'
  status      text DEFAULT 'draft',  -- voir statuts ci-dessous
  created_at  timestamptz DEFAULT now()
)

-- Entreprises enrichies
companies (
  id                    uuid PRIMARY KEY,
  campaign_id           uuid REFERENCES campaigns(id),
  name                  text NOT NULL,
  sector                text,
  catalog_size          text,
  marketplaces          text[],       -- ['Amazon FR', 'Cdiscount']
  top_match_marketplace text,         -- 'Mirakl Fashion Hub'
  match_score           float,        -- 0-100
  match_rationale       text,         -- générée par OpenAI
  status                text DEFAULT 'pending',  -- 'qualified' | 'disqualified'
  enriched_at           timestamptz
)

-- Contacts / Prospects
contacts (
  id              uuid PRIMARY KEY,
  company_id      uuid REFERENCES companies(id),
  campaign_id     uuid REFERENCES campaigns(id),
  first_name      text,
  last_name       text,
  title           text,
  email           text,
  linkedin_url    text,
  mail_status     text DEFAULT 'pending',  -- 'sent' | 'opened' | 'replied'
  mail_sent_at    timestamptz,
  mail_opened_at  timestamptz,
  mail_replied_at timestamptz
)

-- Référentiel marketplaces Mirakle
mirakle_marketplaces (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  description text,
  categories  text[],
  embedding   vector(1536)  -- OpenAI text-embedding-ada-002
)`}</CodeBlock>

            <p>
              <strong className="text-[#03182F]">Realtime activé</strong> sur les tables <code className="text-[#2764FF]">campaigns</code>,{' '}
              <code className="text-[#2764FF]">companies</code>, <code className="text-[#2764FF]">contacts</code> via{' '}
              <code className="text-[#30373E]">supabase_realtime publication</code>.
            </p>
          </Section>

          {/* API Routes */}
          <Section id="api" title="API Routes Next.js">
            <ApiRow method="GET" path="/api/campaigns" desc="Liste toutes les campagnes" />
            <ApiRow method="POST" path="/api/campaigns" desc="Crée une campagne + déclenche Workflow 1" />
            <ApiRow method="GET" path="/api/campaigns/[id]" desc="Détail campagne + compteurs" />
            <ApiRow method="PATCH" path="/api/campaigns/[id]" desc="Met à jour les champs d'une campagne" />
            <ApiRow method="POST" path="/api/campaigns/[id]/launch" desc="Lance la campagne → Workflow 2" />
            <ApiRow method="GET" path="/api/companies" desc="Liste entreprises (filtres: campaign_id, status, sector)" />
            <ApiRow method="PATCH" path="/api/companies/[id]" desc="Met à jour le statut (qualified / disqualified)" />
            <ApiRow method="GET" path="/api/contacts" desc="Liste contacts (filtres: campaign_id, mail_status)" />
            <ApiRow method="POST" path="/api/webhooks/n8n" desc="Reçoit les mises à jour de statut depuis n8n" />

            <p className="mt-4">
              <strong className="text-[#03182F]">Webhook n8n → App</strong> — payload attendu :
            </p>
            <CodeBlock>{`// campaign_update
{
  "type": "campaign_update",
  "id": "uuid-campagne",
  "status": "ready"  // ou "completed"
}

// company_update
{
  "type": "company_update",
  "id": "uuid-company",
  "status": "qualified",
  "data": {
    "match_score": 87,
    "match_rationale": "...",
    "top_match_marketplace": "Mirakl Fashion Hub"
  }
}

// contact_update
{
  "type": "contact_update",
  "id": "uuid-contact",
  "status": "sent",  // "opened" | "replied"
  "data": {
    "mail_sent_at": "2025-04-20T10:00:00Z"
  }
}`}</CodeBlock>
          </Section>

          {/* Design System */}
          <Section id="design" title="Design System Mirakl">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { name: 'Primary Dark', hex: '#03182F' },
                { name: 'Primary Accent', hex: '#2764FF' },
                { name: 'Primary BG', hex: '#F2F8FF' },
                { name: 'Secondary Dark', hex: '#770031' },
                { name: 'Secondary Accent', hex: '#F22E75' },
                { name: 'Secondary BG', hex: '#FFE7EC' },
                { name: 'Body Text', hex: '#30373E' },
                { name: 'White', hex: '#FFFFFF' },
              ].map(({ name, hex }) => (
                <div key={hex} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded shrink-0 border border-[#03182F]/10"
                    style={{ background: hex }}
                  />
                  <span className="text-xs text-[#30373E]/70">{name}</span>
                  <code className="text-[10px] text-[#30373E]/40 ml-auto">{hex}</code>
                </div>
              ))}
            </div>

            <p><strong className="text-[#03182F]">Typographie</strong></p>
            <ul className="list-disc list-inside text-xs space-y-1 text-[#30373E]/60">
              <li><code className="text-[#03182F]">Roboto Serif</code> — toute la typographie (titres, corps, UI)</li>
              <li>H1: 22px / 700 — H2: 18px / 700 — H3: 16px / 700 — H4/H5: 14px</li>
            </ul>

            <p className="mt-3"><strong className="text-[#03182F]">Composants clés</strong></p>
            <ul className="list-disc list-inside text-xs space-y-1 text-[#30373E]/60">
              <li>Score bar — gradient <code className="text-[#03182F]">#2764FF → #F22E75</code>, animée au montage</li>
              <li>Badges statut — fond tinted 8–12% opacity, texte coloré, bordure 20%</li>
              <li>Cards — <code className="text-[#03182F]">bg-white border-[#03182F]/10 rounded-lg shadow-sm</code></li>
              <li>CTAs primaires — <code className="text-[#03182F]">bg-[#2764FF] hover:bg-[#1a4fd8]</code></li>
            </ul>
          </Section>

          {/* Integrations */}
          <Section id="integration" title="Intégrations externes">
            <p><strong className="text-[#03182F]">n8n</strong> — Orchestrateur des workflows. Variables d'environnement :</p>
            <CodeBlock>{`N8N_WORKFLOW1_WEBHOOK_URL=https://n8n.votre-instance.com/webhook/workflow1
N8N_WORKFLOW2_WEBHOOK_URL=https://n8n.votre-instance.com/webhook/workflow2
N8N_WEBHOOK_SECRET=votre-secret-ici  # pour valider les callbacks`}</CodeBlock>

            <p><strong className="text-[#03182F]">Supabase</strong> — DB + Realtime. Variables requises :</p>
            <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # pour les API routes server-side`}</CodeBlock>

            <p><strong className="text-[#03182F]">Mode Mock</strong> — pour démo sans services live :</p>
            <CodeBlock>{`NEXT_PUBLIC_USE_MOCK_DATA=true`}</CodeBlock>
            <p>
              Quand activé, tous les hooks retournent des données mockées depuis{' '}
              <code className="text-[#2764FF]">src/lib/mock/</code> sans appels réseau.
            </p>
          </Section>

          {/* Deployment */}
          <Section id="deployment" title="Checklist de déploiement">
            <ol className="list-decimal list-inside text-xs space-y-2 text-[#30373E]/60">
              <li>
                <span className="text-[#03182F]">Créer un projet Supabase</span> et exécuter le SQL de création des tables
                (activer pgvector, realtime, RLS)
              </li>
              <li>
                <span className="text-[#03182F]">Configurer n8n</span> — importer les workflows, paramétrer les nodes Cargo, OpenAI, Dust
              </li>
              <li>
                <span className="text-[#03182F]">Variables d'environnement</span> — renseigner toutes les vars dans{' '}
                <code className="text-[#2764FF]">.env.local</code>
              </li>
              <li>
                <span className="text-[#03182F]">Peupler mirakle_marketplaces</span> — insérer les 8 marketplaces Mirakle avec embeddings OpenAI
              </li>
              <li>
                <span className="text-[#03182F]">Désactiver le mode mock</span> — passer{' '}
                <code className="text-[#2764FF]">NEXT_PUBLIC_USE_MOCK_DATA=false</code>
              </li>
              <li>
                <span className="text-[#03182F]">Tester Workflow 1</span> — créer une campagne, vérifier que Cargo scrappe et que le statut passe à "ready"
              </li>
              <li>
                <span className="text-[#03182F]">Tester Workflow 2</span> — lancer la campagne, vérifier l'envoi des mails via Dust
              </li>
              <li>
                <span className="text-[#03182F]">Déployer sur Vercel</span> — configurer les env vars dans le projet Vercel
              </li>
            </ol>
          </Section>
        </div>
      </div>
    </div>
  )
}
