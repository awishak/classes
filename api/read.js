// Reader for the room screen.
//
// Most of the web refuses to be framed — ESPN, the Atlantic, WSJ all send
// X-Frame-Options, and a refused iframe renders as a silent black rectangle.
// So instead of projecting a URL and calling it casting the site, we fetch the
// page here and hand back the parts worth reading at the back of a classroom:
// the headline, the image, and the body. That reads better than the real page
// anyway, which is mostly navigation, ads, and a cookie banner.
//
// GET /api/read?url=https://...

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const decode = (s) => (s || "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&hellip;/g, "…")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/\s+/g, " ").trim();

function meta(html, prop) {
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*content=["\']([^"\']*)["\']', "i"),
    new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + prop + '["\']', "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]);
  }
  return "";
}

// A page title usually carries the site on the end: "Super Bowl - Wikipedia",
// "Something happened | The Athletic". The room wants the story, not the
// masthead, so the last piece goes when there is more than one and the last
// piece is short.
export function cleanTitle(title) {
  const t = (title || "").trim();
  const parts = t.split(/\s+(?:-|–|—|\|)\s+/);
  if (parts.length > 1 && parts[parts.length - 1].length <= 40 && parts.slice(0, -1).join(" ").length >= 4) {
    return parts.slice(0, -1).join(" - ").trim();
  }
  return t;
}

// Wikipedia leaves "[ a ]" and "[ 12 ]" where its footnotes were, and every
// site's markup leaves a space in front of the full stop once the tags are
// gone. Neither belongs on a wall.
export function cleanProse(t) {
  return (t || "")
    .replace(/\[\s*(?:[a-z]|\d{1,3}|citation needed|note \d+)\s*\]/gi, "")
    .replace(/\s+([.,;:!?%)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Whether a browser would let this page sit inside an iframe. Most of the web
// says no, in one of two headers, and an iframe that gets refused renders as
// a black rectangle with no error anyone can catch. Read the answer here, where
// the headers are, so the room screen can show a card and say why instead.
export function framableFrom(headers) {
  const xfo = (headers.get("x-frame-options") || "").trim().toLowerCase();
  if (xfo === "deny" || xfo === "sameorigin") return false;
  const csp = (headers.get("content-security-policy") || "").toLowerCase();
  if (/frame-ancestors\s+(?!\*)/.test(csp)) return false;
  return true;
}

// Strip everything that is not prose, then take the paragraphs.
function paragraphs(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(nav|header|footer|aside|form|figure|figcaption)[\s\S]*?<\/\1>/gi, "");
  const article = body.match(/<article[\s\S]*?<\/article>/i);
  const source = article ? article[0] : body;
  return [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => cleanProse(decode(m[1].replace(/<[^>]+>/g, " "))))
    .filter(t => t.length > 60 && !/^(advertisement|sign up|subscribe|share this)/i.test(t))
    // A hub page's menu comes through as one enormous paragraph of section
    // names. Prose does not shout: three or more words in capitals, four
    // letters or longer, is a menu.
    .filter(t => (t.match(/\b[A-Z]{4,}\b/g) || []).length < 3);
}

export default async function handler(req, res) {
  const url = req.query?.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Pass a http(s) url." });
  }

  try {
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    const framable = framableFrom(r.headers);
    const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
    if (!r.ok) return res.status(200).json({ ok: false, framable, site: host, reason: "The site returned " + r.status + "." });

    const type = r.headers.get("content-type") || "";
    if (!type.includes("html")) return res.status(200).json({ ok: false, framable, site: host, reason: "That link is not a web page." });

    const html = (await r.text()).slice(0, 1_500_000);

    // Some sites answer a server-side fetch with an empty 2xx rather than an
    // error. ESPN does exactly this. That is a block, not a paywall, and it is
    // worth saying which so nobody goes hunting for a subscription.
    if (html.trim().length < 500) {
      return res.status(200).json({ ok: false, framable, site: host, reason: "That site blocks this kind of request. Open the page yourself." });
    }

    const title = cleanTitle(meta(html, "og:title") || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ""));
    const body = paragraphs(html);

    if (!title && !body.length) {
      return res.status(200).json({ ok: false, framable, site: host, reason: "Nothing readable on that page. A paywall, or a page that builds itself in the browser." });
    }

    res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({
      ok: true,
      framable,
      title,
      site: meta(html, "og:site_name") || host,
      image: meta(html, "og:image"),
      description: meta(html, "og:description"),
      paragraphs: body.slice(0, 40),
      truncated: body.length > 40,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "Could not reach that page." });
  }
}
