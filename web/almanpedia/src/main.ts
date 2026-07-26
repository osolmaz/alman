import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles/base.css";
import "./styles/wiki-content.css";
import { startRouter } from "./router";
import { renderArticle, renderLanding, renderShell } from "./ui/views";

const root = document.getElementById("app");
if (!root) throw new Error("missing #app mount point");

let navigateFn: (path: string) => void = () => {};
const shell = renderShell(root, (path) => navigateFn(path));

const { navigate } = startRouter((route) => {
  window.scrollTo(0, 0);
  if (route.kind === "article") void renderArticle(shell, route.title);
  else renderLanding(shell);
});
navigateFn = navigate;
