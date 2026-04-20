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
      <h2 className="text-lg font-bold text-white font-heading mb-4 pb-3 border-b border-white/[0.06]">
        {title}
      </h2>
      <div className="text-slate-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0A1628] border border-white/[0.06] rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
      {children}
    </pre>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-mono mr-1.5"
      style={{ background: color + '20', color, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  )
}

function ApiRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = { GET: '#00C2A8', POST: '#0066FF', PATCH: '#F59E0B' }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <Badge color={colors[method] || '#64748B'}>{method}</Badge>
      <code className="text-slate-300 text-xs font-mono flex-1">{path}</code>
      <span className="text-slate-500 text-xs text-right">{desc}</span>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#0066FF]" />
          <h1 className="text-2xl font-bold text-white font-heading">Documentation Technique</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Référence complète du pipeline de prospection intelligente Mirakle GTM
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sticky TOC */}
        <aside className="hidden xl:block w-52 shrink-0">
          <div className="sticky top-6 bg-[#162035] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Table des matières
            </p>
            <nav className="space-y-0.5">
              {sections.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 bg-[#162035] border border-white/[0.06] rounded-2xl p-8">
          {/* Architecture */}
          <Section id="architecture" title="Architecture — 2 Workflows n8n">
            <p>
              L'application orchestre <strong className="text-white">deux workflows n8n distincts</strong> pour
              automatiser le pipeline complet de prospection B2B.
            </p>

            <div>
              <p className="text-white text-xs font-semibold mb-2">Workflow 1 — Création de campagne</p>
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
              <p className="text-white text-xs font-semibold mb-2">Workflow 2 — Lancement de campagne</p>
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
            <p>PostgreSQL hébergé sur Supabase avec l'extension <code className="text-[#00C2A8]">pgvector</code> pour les embeddings.</p>

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
              <strong className="text-white">Realtime activé</strong> sur les tables <code className="text-[#00C2A8]">campaigns</code>,{' '}
              <code className="text-[#00C2A8]">companies</code>, <code className="text-[#00C2A8]">contacts</code> via{' '}
              <code className="text-slate-300">supabase_realtime publication</code>.
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
              <strong className="text-white">Webhook n8n → App</strong> — payload attendu :
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
          <Section id="design" title="Design System Mirakle">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { name: 'Navy (BG)', hex: '#0F1F3D' },
                { name: 'Card', hex: '#162035' },
                { name: 'Accent Blue (CTAs)', hex: '#0066FF' },
                { name: 'Accent Teal (succès)', hex: '#00C2A8' },
                { name: 'Success', hex: '#10B981' },
                { name: 'Warning', hex: '#F59E0B' },
                { name: 'Error', hex: '#EF4444' },
                { name: 'Muted text', hex: '#64748B' },
              ].map(({ name, hex }) => (
                <div key={hex} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded shrink-0 border border-white/10"
                    style={{ background: hex }}
                  />
                  <span className="text-xs text-slate-400">{name}</span>
                  <code className="text-[10px] font-mono text-slate-600 ml-auto">{hex}</code>
                </div>
              ))}
            </div>

            <p><strong className="text-white">Typographie</strong></p>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-500">
              <li><code className="text-slate-300">Manrope</code> — titres et headings (Bold 700/800)</li>
              <li><code className="text-slate-300">DM Sans</code> — corps de texte et UI (400/500)</li>
              <li><code className="text-slate-300">DM Mono</code> — données numériques, scores, codes</li>
            </ul>

            <p className="mt-3"><strong className="text-white">Composants clés</strong></p>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-500">
              <li>Score bar — gradient <code className="text-slate-300">#0066FF → #00C2A8</code>, animée au montage</li>
              <li>Badges statut — fond tinted 12% opacity, texte coloré, bordure 20%</li>
              <li>Cards — <code className="text-slate-300">bg-[#162035] border-white/6 rounded-xl</code></li>
              <li>CTAs primaires — <code className="text-slate-300">bg-[#0066FF] hover:bg-[#0052CC]</code></li>
            </ul>
          </Section>

          {/* Integrations */}
          <Section id="integration" title="Intégrations externes">
            <p><strong className="text-white">n8n</strong> — Orchestrateur des workflows. Variables d'environnement :</p>
            <CodeBlock>{`N8N_WORKFLOW1_WEBHOOK_URL=https://n8n.votre-instance.com/webhook/workflow1
N8N_WORKFLOW2_WEBHOOK_URL=https://n8n.votre-instance.com/webhook/workflow2
N8N_WEBHOOK_SECRET=votre-secret-ici  # pour valider les callbacks`}</CodeBlock>

            <p><strong className="text-white">Supabase</strong> — DB + Realtime. Variables requises :</p>
            <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # pour les API routes server-side`}</CodeBlock>

            <p><strong className="text-white">Mode Mock</strong> — pour démo sans services live :</p>
            <CodeBlock>{`NEXT_PUBLIC_USE_MOCK_DATA=true`}</CodeBlock>
            <p>
              Quand activé, tous les hooks retournent des données mockées depuis{' '}
              <code className="text-[#00C2A8]">src/lib/mock/</code> sans appels réseau.
            </p>
          </Section>

          {/* Deployment */}
          <Section id="deployment" title="Checklist de déploiement">
            <ol className="list-decimal list-inside text-xs space-y-2 text-slate-500">
              <li>
                <span className="text-slate-300">Créer un projet Supabase</span> et exécuter le SQL de création des tables
                (activer pgvector, realtime, RLS)
              </li>
              <li>
                <span className="text-slate-300">Configurer n8n</span> — importer les workflows, paramétrer les nodes Cargo, OpenAI, Dust
              </li>
              <li>
                <span className="text-slate-300">Variables d'environnement</span> — renseigner toutes les vars dans{' '}
                <code className="text-[#00C2A8]">.env.local</code>
              </li>
              <li>
                <span className="text-slate-300">Peupler mirakle_marketplaces</span> — insérer les 8 marketplaces Mirakle avec embeddings OpenAI
              </li>
              <li>
                <span className="text-slate-300">Désactiver le mode mock</span> — passer{' '}
                <code className="text-[#00C2A8]">NEXT_PUBLIC_USE_MOCK_DATA=false</code>
              </li>
              <li>
                <span className="text-slate-300">Tester Workflow 1</span> — créer une campagne, vérifier que Cargo scrappe et que le statut passe à "ready"
              </li>
              <li>
                <span className="text-slate-300">Tester Workflow 2</span> — lancer la campagne, vérifier l'envoi des mails via Dust
              </li>
              <li>
                <span className="text-slate-300">Déployer sur Vercel</span> — configurer les env vars dans le projet Vercel
              </li>
            </ol>
          </Section>
        </div>
      </div>
    </div>
  )
}
