import { expect, test } from "vitest";
import { configureAlmanpediaShortcut } from "../../scripts/configure-almanpedia-shortcut";

interface PlannedResponse {
  status?: number;
  result?: unknown;
  success?: boolean;
}

function plannedFetch(plans: PlannedResponse[]) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const plan = plans.shift();
    if (!plan) throw new Error(`unexpected Cloudflare request: ${String(input)}`);
    return new Response(JSON.stringify({
      success: plan.success ?? (plan.status ?? 200) < 400,
      errors: [],
      result: plan.result ?? null,
    }), { status: plan.status ?? 200, headers: { "Content-Type": "application/json" } });
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch, remaining: () => plans.length };
}

test("shortcut configuration creates proxied DNS and a path-preserving redirect", async () => {
  const mock = plannedFetch([
    { result: [{ id: "zone-1", name: "almanpedia.org" }] },
    { result: [] },
    { result: { id: "dns-1" } },
    { status: 404, success: false },
    { result: { id: "ruleset-1" } },
  ]);

  await configureAlmanpediaShortcut({ token: "test-token", fetchImpl: mock.fetchImpl, log: () => {} });

  expect(mock.remaining()).toBe(0);
  expect(mock.calls.every((call) => new Headers(call.init?.headers).get("Authorization") === "Bearer test-token")).toBe(true);
  const dnsBody = JSON.parse(String(mock.calls[2]?.init?.body));
  expect(dnsBody).toMatchObject({
    type: "CNAME",
    name: "de.almanpedia.org",
    content: "almanpedia.org",
    proxied: true,
  });
  const rulesetBody = JSON.parse(String(mock.calls[4]?.init?.body));
  expect(rulesetBody.phase).toBe("http_request_dynamic_redirect");
  expect(rulesetBody.rules[0]).toMatchObject({
    ref: "almanpedia_de_shortcut",
    expression: '(http.host eq "de.almanpedia.org")',
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: { expression: 'concat("https://almanpedia.org", http.request.uri.path)' },
        preserve_query_string: true,
      },
    },
  });
});

test("shortcut configuration updates an existing rule without replacing the ruleset", async () => {
  const mock = plannedFetch([
    { result: [{ id: "zone-1", name: "almanpedia.org" }] },
    { result: [{ id: "dns-1", name: "de.almanpedia.org", type: "CNAME", content: "almanpedia.org", proxied: true }] },
    { result: { id: "ruleset-1", rules: [{
      id: "rule-1",
      ref: "almanpedia_de_shortcut",
      description: "Old redirect",
      expression: '(http.host eq "de.almanpedia.org")',
      action: "redirect",
      enabled: true,
      action_parameters: {
        from_value: {
          status_code: 302,
          target_url: { expression: 'concat("https://old.example", http.request.uri.path)' },
          preserve_query_string: true,
        },
      },
    }] } },
    { result: { id: "rule-1" } },
  ]);

  await configureAlmanpediaShortcut({ token: "test-token", fetchImpl: mock.fetchImpl, log: () => {} });

  expect(mock.calls[3]?.url.endsWith("/zones/zone-1/rulesets/ruleset-1/rules/rule-1")).toBe(true);
  expect(mock.calls[3]?.init?.method).toBe("PATCH");
  const ruleBody = JSON.parse(String(mock.calls[3]?.init?.body));
  expect(ruleBody.action_parameters.from_value).toMatchObject({
    status_code: 301,
    target_url: { expression: 'concat("https://almanpedia.org", http.request.uri.path)' },
    preserve_query_string: true,
  });
});

test("shortcut configuration leaves current Cloudflare resources unchanged", async () => {
  const currentRule = {
    id: "rule-1",
    ref: "almanpedia_de_shortcut",
    description: "Redirect the German Almanpedia shortcut to the canonical reader",
    expression: '(http.host eq "de.almanpedia.org")',
    action: "redirect",
    enabled: true,
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: { expression: 'concat("https://almanpedia.org", http.request.uri.path)' },
        preserve_query_string: true,
      },
    },
  };
  const mock = plannedFetch([
    { result: [{ id: "zone-1", name: "almanpedia.org" }] },
    { result: [{ id: "dns-1", name: "de.almanpedia.org", type: "CNAME", content: "almanpedia.org", proxied: true }] },
    { result: { id: "ruleset-1", rules: [currentRule] } },
  ]);
  const logs: string[] = [];

  await configureAlmanpediaShortcut({ token: "test-token", fetchImpl: mock.fetchImpl, log: (message) => logs.push(message) });

  expect(mock.remaining()).toBe(0);
  expect(mock.calls).toHaveLength(3);
  expect(logs).toEqual([
    "DNS record for de.almanpedia.org is current",
    "Redirect rule for de.almanpedia.org is current",
  ]);
});
