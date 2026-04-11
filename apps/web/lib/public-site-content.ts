const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export type LegalSlug = 'terms' | 'privacy' | 'refund';

const legalFallback: Record<LegalSlug, string> = {
  terms:
    'By using Agencyfic OMS, you agree to lawful use, accurate account information, and responsible operation of linked marketplace accounts.',
  privacy:
    'We process account and order data only for OMS operations and platform integrations. Sensitive credentials are encrypted at rest.',
  refund:
    'Subscription credits are non-transferable. Refunds are handled according to approved support review and billing transaction state.',
};

export async function getPublicLegalContent(slug: LegalSlug) {
  if (!API_URL) {
    return legalFallback[slug];
  }

  try {
    const response = await fetch(`${API_URL}/api/site-settings/public/legal/${slug}`, { cache: 'no-store' });
    if (!response.ok) {
      return legalFallback[slug];
    }

    const data = (await response.json()) as { content?: string };
    return data.content?.trim() || legalFallback[slug];
  } catch {
    return legalFallback[slug];
  }
}

export async function getPublicBranding() {
  if (!API_URL) {
    return {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#7c3aed',
      accentColor: '#f97316',
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/site-settings/public/branding`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Branding unavailable');
    }
    return (await response.json()) as {
      logoUrl: string;
      faviconUrl: string;
      primaryColor: string;
      accentColor: string;
    };
  } catch {
    return {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#7c3aed',
      accentColor: '#f97316',
    };
  }
}
