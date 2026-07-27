const API_ORIGIN = "https://api.cloudflare.com/client/v4";
const ZONE_NAME = "almanpedia.org";
const SHORTCUT_HOST = "de.almanpedia.org";
const CANONICAL_ORIGIN = "https://almanpedia.org";
const REDIRECT_PHASE = "http_request_dynamic_redirect";
const REDIRECT_REF = "almanpedia_de_shortcut";

interface CloudflareError {
  code?: number;
  message?: string;
}

interface CloudflareEnvelope<T> {
  success: boolean;
  errors?: CloudflareError[];
  result: T;
}

interface Zone {
  id: string;
  name: string;
}

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
}

interface RedirectRule {
  id?: string;
  ref?: string;
  description?: string;
  expression: string;
  action: "redirect";
  enabled: boolean;
  action_parameters: {
    from_value: {
      status_code: 301;
      target_url: { expression: string };
      preserve_query_string: true;
    };
  };
}

interface Ruleset {
  id: string;
  rules?: RedirectRule[];
}

interface ConfigureOptions {
  token: string;
  fetchImpl?: typeof fetch;
  log?: (message: string) => void;
}

const redirectRule = (): RedirectRule => ({
  ref: REDIRECT_REF,
  description: "Redirect the German Almanpedia shortcut to the canonical reader",
  expression: `(http.host eq "${SHORTCUT_HOST}")`,
  action: "redirect",
  enabled: true,
  action_parameters: {
    from_value: {
      status_code: 301,
      target_url: { expression: `concat("${CANONICAL_ORIGIN}", http.request.uri.path)` },
      preserve_query_string: true,
    },
  },
});

function sameRedirectRule(current: RedirectRule, desired: RedirectRule): boolean {
  return current.ref === desired.ref
    && current.description === desired.description
    && current.expression === desired.expression
    && current.action === desired.action
    && current.enabled === desired.enabled
    && current.action_parameters?.from_value?.status_code === 301
    && current.action_parameters?.from_value?.target_url?.expression === desired.action_parameters.from_value.target_url.expression
    && current.action_parameters?.from_value?.preserve_query_string === true;
}

export async function configureAlmanpediaShortcut({
  token,
  fetchImpl = fetch,
  log = console.log,
}: ConfigureOptions): Promise<void> {
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required");

  async function request<T>(
    path: string,
    { method = "GET", body, allowNotFound = false }: { method?: string; body?: unknown; allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    const response = await fetchImpl(`${API_ORIGIN}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (allowNotFound && response.status === 404) return null;

    let payload: CloudflareEnvelope<T> | null = null;
    try {
      payload = await response.json() as CloudflareEnvelope<T>;
    } catch {
      // The status below still identifies the failed request without exposing credentials.
    }
    if (!response.ok || !payload?.success) {
      const details = payload?.errors?.map((error) => error.message).filter(Boolean).join("; ");
      throw new Error(`Cloudflare API ${method} ${path} failed (HTTP ${response.status})${details ? `: ${details}` : ""}`);
    }
    return payload.result;
  }

  const zones = await request<Zone[]>(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
  const zone = zones?.find((candidate) => candidate.name === ZONE_NAME);
  if (!zone) throw new Error(`Cloudflare zone ${ZONE_NAME} was not found`);

  const records = await request<DnsRecord[]>(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(SHORTCUT_HOST)}`);
  const record = records?.[0];
  const desiredRecord = {
    type: "CNAME",
    name: SHORTCUT_HOST,
    content: ZONE_NAME,
    ttl: 1,
    proxied: true,
    comment: "German Wikipedia address shortcut for Almanpedia",
  };
  if (!record) {
    await request(`/zones/${zone.id}/dns_records`, { method: "POST", body: desiredRecord });
    log(`Created proxied DNS record for ${SHORTCUT_HOST}`);
  } else if (record.type !== "CNAME" || record.content !== ZONE_NAME || !record.proxied) {
    await request(`/zones/${zone.id}/dns_records/${record.id}`, { method: "PUT", body: desiredRecord });
    log(`Updated proxied DNS record for ${SHORTCUT_HOST}`);
  } else {
    log(`DNS record for ${SHORTCUT_HOST} is current`);
  }

  const desiredRule = redirectRule();
  const entrypoint = await request<Ruleset>(
    `/zones/${zone.id}/rulesets/phases/${REDIRECT_PHASE}/entrypoint`,
    { allowNotFound: true },
  );
  if (!entrypoint) {
    await request(`/zones/${zone.id}/rulesets`, {
      method: "POST",
      body: {
        name: "Almanpedia redirects",
        description: "Canonical redirects for Almanpedia",
        kind: "zone",
        phase: REDIRECT_PHASE,
        rules: [desiredRule],
      },
    });
    log(`Created redirect rule for ${SHORTCUT_HOST}`);
    return;
  }

  const currentRule = entrypoint.rules?.find((rule) => rule.ref === REDIRECT_REF);
  if (!currentRule) {
    await request(`/zones/${zone.id}/rulesets/${entrypoint.id}/rules`, { method: "POST", body: desiredRule });
    log(`Added redirect rule for ${SHORTCUT_HOST}`);
  } else if (!sameRedirectRule(currentRule, desiredRule)) {
    await request(`/zones/${zone.id}/rulesets/${entrypoint.id}/rules/${currentRule.id}`, {
      method: "PATCH",
      body: desiredRule,
    });
    log(`Updated redirect rule for ${SHORTCUT_HOST}`);
  } else {
    log(`Redirect rule for ${SHORTCUT_HOST} is current`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await configureAlmanpediaShortcut({ token: process.env.CLOUDFLARE_API_TOKEN ?? "" });
}
