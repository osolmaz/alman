export type Route = { kind: "landing" } | { kind: "article"; title: string; hash?: string };

function decodeHash(hash: string): string | undefined {
  if (!hash) return undefined;
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function parseRoute(pathname: string, hash = ""): Route {
  const decodedHash = decodeHash(hash);
  if (pathname.startsWith("/wiki/")) {
    const raw = pathname.slice("/wiki/".length);
    if (raw) {
      try {
        const title = decodeURIComponent(raw);
        return decodedHash ? { kind: "article", title, hash: decodedHash } : { kind: "article", title };
      } catch {
        return decodedHash ? { kind: "article", title: raw, hash: decodedHash } : { kind: "article", title: raw };
      }
    }
  }
  return { kind: "landing" };
}

export type RenderRoute = (route: Route) => void;

export function startRouter(render: RenderRoute): { navigate: (path: string) => void } {
  function navigate(path: string): void {
    const url = new URL(path, window.location.href);
    history.pushState(null, "", path);
    render(parseRoute(url.pathname, url.hash));
  }

  window.addEventListener("popstate", () => render(parseRoute(window.location.pathname, window.location.hash)));

  // Delegated interception keeps rewritten article links client-side.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const anchor = (event.target as Element | null)?.closest?.("a[data-internal], a[data-route]");
    const href = anchor?.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    navigate(href);
  });

  render(parseRoute(window.location.pathname, window.location.hash));
  return { navigate };
}
