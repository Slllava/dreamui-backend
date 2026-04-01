import { defineEndpoint } from '@directus/extensions-sdk';

type ResendEmailListItem = {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string | null;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  last_event: string | null;
  scheduled_at: string | null;
};

type ResendEmailDetail = ResendEmailListItem & {
  object: 'email';
  html: string | null;
  text: string | null;
  tags?: Array<{ name: string; value: string }>;
};

type ResendListResponse = {
  object: 'list';
  has_more: boolean;
  data: ResendEmailListItem[];
};

const DEFAULT_BASE_URL = 'https://api.resend.com';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function getApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function getBaseUrl(): string {
  return process.env.RESEND_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getDefaultLimit(): number {
  const value = Number(process.env.RESEND_DEFAULT_LIMIT ?? DEFAULT_LIMIT);

  if (Number.isNaN(value)) return DEFAULT_LIMIT;

  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

function parseLimit(input: unknown): number {
  const fallback = getDefaultLimit();
  const value = Number(input ?? fallback);

  if (Number.isNaN(value)) return fallback;

  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

function ensureAuthenticated(req: any, res: any): boolean {
  if (req.accountability) return true;

  res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be signed in to access Resend activity.',
  });

  return false;
}

function ensureConfigured(res: any): string | null {
  const apiKey = getApiKey();

  if (apiKey) return apiKey;

  res.status(503).json({
    error: 'Resend is not configured',
    message: 'Set RESEND_API_KEY on the Directus server to enable this module.',
  });

  return null;
}

async function proxyResend<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; body: any }> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'Resend is not configured',
        message: 'Set RESEND_API_KEY on the Directus server to enable this module.',
      },
    };
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let parsed: unknown = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { message: text || 'Unexpected response from Resend.' };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: parsed,
    };
  }

  return {
    ok: true,
    data: parsed as T,
  };
}

export default defineEndpoint((router) => {
  router.get('/status', (req, res) => {
    if (!ensureAuthenticated(req, res)) return;

    res.json({
      configured: Boolean(getApiKey()),
      baseUrl: getBaseUrl(),
      defaultLimit: getDefaultLimit(),
      docsUrl: 'https://resend.com/docs/api-reference/emails/list-emails',
      env: {
        apiKey: Boolean(process.env.RESEND_API_KEY),
        baseUrl: Boolean(process.env.RESEND_BASE_URL),
        defaultLimit: Boolean(process.env.RESEND_DEFAULT_LIMIT),
      },
    });
  });

  router.get('/emails', async (req, res) => {
    if (!ensureAuthenticated(req, res)) return;
    if (!ensureConfigured(res)) return;

    const { after, before } = req.query;

    if (after && before) {
      res.status(400).json({
        error: 'Invalid pagination',
        message: 'Use either "after" or "before", not both.',
      });
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(parseLimit(req.query.limit)));

    if (typeof after === 'string' && after.length > 0) searchParams.set('after', after);
    if (typeof before === 'string' && before.length > 0) searchParams.set('before', before);

    const response = await proxyResend<ResendListResponse>(`/emails?${searchParams.toString()}`);

    if (!response.ok) {
      res.status(response.status).json(response.body);
      return;
    }

    res.json({
      ...response.data,
      query: {
        limit: parseLimit(req.query.limit),
        after: typeof after === 'string' ? after : null,
        before: typeof before === 'string' ? before : null,
      },
    });
  });

  router.get('/emails/:id', async (req, res) => {
    if (!ensureAuthenticated(req, res)) return;
    if (!ensureConfigured(res)) return;

    const id = String(req.params.id || '').trim();

    if (!id) {
      res.status(400).json({
        error: 'Missing email id',
        message: 'A Resend email id is required.',
      });
      return;
    }

    const response = await proxyResend<ResendEmailDetail>(`/emails/${encodeURIComponent(id)}`);

    if (!response.ok) {
      res.status(response.status).json(response.body);
      return;
    }

    res.json(response.data);
  });
});
