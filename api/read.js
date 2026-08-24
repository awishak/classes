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

// Strip everything that is not prose, then take the paragraphs.
function paragraphs(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(nav|header|footer|aside|form|figure|figcaption)[\s\S]*?<\/\1>/gi, "");
  const article = body.match(/<article[\s\S]*?<\/article>/i);
  const source = article ? article[0] : body;
  return [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, " ")))
    .filter(t => t.length > 60 && !/^(advertisement|sign up|subscribe|share this)/i.test(t));
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
    if (!r.ok) return res.status(200).json({ ok: false, reason: "The site returned " + r.status + "." });

    const type = r.headers.get("content-type") || "";
    if (!type.includes("html")) return res.status(200).json({ ok: false, reason: "That link is not a web page." });

    const html = (await r.text()).slice(0, 1_500_000);

    // Some sites answer a server-side fetch with an empty 2xx rather than an
    // error. ESPN does exactly this. That is a block, not a paywall, and it is
    // worth saying which so nobody goes hunting for a subscription.
    if (html.trim().length < 500) {
      return res.status(200).json({ ok: false, reason: "That site blocks this kind of request. Use Page or Open it yourself." });
    }

    const title = meta(html, "og:title") || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const body = paragraphs(html);

    if (!title && !body.length) {
      return res.status(200).json({ ok: false, reason: "Nothing readable on that page — a paywall, or it builds itself in the browser." });
    }

    res.setHeader("cache-control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({
      ok: true,
      title,
      site: meta(html, "og:site_name"),
      image: meta(html, "og:image"),
      description: meta(html, "og:description"),
      paragraphs: body.slice(0, 40),
      truncated: body.length > 40,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "Could not reach that page." });
  }
}
