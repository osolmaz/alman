export type Route = { kind: "landing" } | { kind: "article"; title: string };

export function parseRoute(pathname: string): Route {
  if (pathname.startsWith("/wiki/")) {
    const raw = pathname.slice("/wiki/".length);
    if (raw) {
      try {
        return { kind: "article", title: decodeURIComponent(raw) };
      } catch {
        return { kind: "article", title: raw };
      }
    }
  }
  return { kind: "landing" };
}

export type RenderRoute = (route: Route) => void;

export function startRouter(render: RenderRoute): { navigate: (path: string) => void } {
  function navigate(path: string): void {
    history.pushState(null, "", path);
    render(parseRoute(new URL(path, window.location.href).pathname));
  }

  window.addEventListener("popstate", () => render(parseRoute(window.location.pathname)));

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

  render(parseRoute(window.location.pathname));
  return { navigate };
}
