/**
 * Générateur d'emails commercial avec OpenAI GPT-4o
 * Utilisé dans le module Outreach pour créer les séquences de mails
 */

import type { OutreachAngle, SeasonalContext, EmailTone, EmailDraft } from '@/types'

const ANGLE_DESCRIPTIONS: Record<OutreachAngle, string> = {
  roi: 'ROI et revenus additionnels — mettre en avant le potentiel de chiffre d\'affaires supplémentaire',
  seasonality: 'Saisonnalité — timing parfait avec une saison commerciale clé à venir',
  partnership: 'Partenariat stratégique — opportunité de co-développement à long terme',
  growth: 'Croissance et expansion — aider l\'entreprise à scaler sur de nouveaux canaux',
  competitive: 'Avantage concurrentiel — démarquer le seller face à ses concurrents déjà présents',
}

const SEASONAL_DESCRIPTIONS: Record<SeasonalContext, string> = {
  black_friday: 'Black Friday / Cyber Monday (novembre)',
  christmas: 'Fêtes de fin d\'année / Noël (décembre)',
  chinese_ny: 'Nouvel An Chinois (janvier-février)',
  back_to_school: 'Rentrée scolaire (août-septembre)',
  summer: 'Soldes et ventes d\'été (juin-juillet)',
  none: 'contexte standard, sans événement saisonnier particulier',
}

const TONE_DESCRIPTIONS: Record<EmailTone, string> = {
  consultative: 'ton consultatif et expert — se positionner comme un conseiller de confiance',
  direct: 'ton direct et percutant — aller droit au but avec une proposition claire',
  educational: 'ton pédagogique — éduquer sur les opportunités marketplace avec des données',
  luxury: 'ton premium et élaboré — langage soigné, références haut de gamme',
}

export interface EmailGenerationParams {
  sequenceStep: number
  totalSteps: number
  angle: OutreachAngle
  tone: EmailTone
  seasonalContext: SeasonalContext
  customHook?: string
  sellerName: string
  sellerDomain?: string
  sellerSector?: string
  contactFirstName?: string
  contactTitle?: string
  marketplaceName?: string
  matchScore?: number
  previousSubjects?: string[]
}

export async function generateEmailWithOpenAI(params: EmailGenerationParams): Promise<EmailDraft> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback mock en dev si pas de clé
    return generateMockEmail(params)
  }

  const systemPrompt = `Tu es un expert en business development B2B pour Mirakl, la plateforme leader des marketplaces enterprise.
Tu rédiges des emails de prospection commerciale ultra-personnalisés pour convaincre des e-commerçants de rejoindre une marketplace partenaire Mirakl.

Règles absolues :
- Email en français, professionnel et naturel
- ${TONE_DESCRIPTIONS[params.tone]}
- Angle : ${ANGLE_DESCRIPTIONS[params.angle]}
- Contexte saisonnier : ${SEASONAL_DESCRIPTIONS[params.seasonalContext]}
- Longueur : 120-180 mots maximum pour le corps
- Pas de formule creuse type "J'espère que ce message vous trouve bien"
- Appel à l'action clair et unique en fin d'email
- Signe : Équipe Business Development, Mirakl`

  const stepContext = params.sequenceStep === 1
    ? 'Premier contact — présenter Mirakl et la valeur pour le seller'
    : params.sequenceStep === 2
    ? 'Relance #1 — apporter une nouvelle perspective ou donnée concrète'
    : 'Relance #2 — dernière tentative, proposition de call rapide de 15min'

  const userPrompt = `Rédige l'email de séquence n°${params.sequenceStep}/${params.totalSteps}.

Contexte :
- Destinataire : ${params.contactFirstName ?? 'le/la dirigeant(e)'}${params.contactTitle ? `, ${params.contactTitle}` : ''}
- Entreprise prospectée : ${params.sellerName}${params.sellerSector ? ` (secteur : ${params.sellerSector})` : ''}
- Marketplace cible : ${params.marketplaceName ?? 'marketplace partenaire Mirakl'}
${params.matchScore ? `- Score de compatibilité : ${params.matchScore}/100` : ''}
${params.customHook ? `- Accroche spécifique à utiliser : ${params.customHook}` : ''}
${params.previousSubjects?.length ? `- Sujets des emails précédents (ne pas répéter) : ${params.previousSubjects.join(' / ')}` : ''}

Étape de la séquence : ${stepContext}

Retourne UNIQUEMENT un JSON valide avec deux champs :
{
  "subject": "objet de l'email",
  "body": "corps de l'email en texte brut avec sauts de ligne"
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[OpenAI] Error:', err)
      return generateMockEmail(params)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) return generateMockEmail(params)

    const parsed = JSON.parse(content)
    return {
      subject: parsed.subject ?? `Opportunité marketplace pour ${params.sellerName}`,
      body: parsed.body ?? '',
    }
  } catch (err) {
    console.error('[OpenAI] generateEmail error:', err)
    return generateMockEmail(params)
  }
}

function generateMockEmail(params: EmailGenerationParams): EmailDraft {
  const stepLabels = ['Premier contact', 'Relance #1', 'Relance #2']
  const label = stepLabels[params.sequenceStep - 1] ?? `Séquence ${params.sequenceStep}`

  return {
    subject: `[${label}] Opportunité marketplace pour ${params.sellerName} × ${params.marketplaceName ?? 'Mirakl'}`,
    body: `Bonjour ${params.contactFirstName ?? ''},\n\nJe me permets de vous contacter au sujet d'une opportunité de croissance pour ${params.sellerName}.\n\nEn tant que partenaire Mirakl, ${params.marketplaceName ?? 'notre marketplace'} recherche activement des e-commerçants de votre calibre dans le secteur ${params.sellerSector ?? 'e-commerce'}.\n\nAu vu de votre catalogue et de votre positionnement, nous estimons un potentiel de croissance significatif (score de compatibilité : ${params.matchScore ?? 80}/100).\n\nSeriez-vous disponible pour un échange de 20 minutes cette semaine ?\n\nCordialement,\nÉquipe Business Development, Mirakl`,
  }
}
