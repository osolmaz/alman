import { serveAssetOr404, type PagesAssetContext } from "../../almanpedia/src/cloudflare/asset-response";

export const onRequest = (context: PagesAssetContext): Promise<Response> => serveAssetOr404(context);
