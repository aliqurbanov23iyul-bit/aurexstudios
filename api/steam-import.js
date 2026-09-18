const { requireAdmin } = require('../server/auth');

const STEAM_API_BASE = 'https://store.steampowered.com/api/appdetails';

function extractAppId(input) {
  if (!input || typeof input !== 'string') return null;
  const value = input.trim();
  if (/^\d+$/.test(value)) return value;
  const match = value.match(/^https?:\/\/store\.steampowered\.com\/app\/(\d+)(?:\/|$)/i);
  return match ? match[1] : null;
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugify(str) {
  return String(str || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const appId = extractAppId(req.body?.steam_url || '');
  if (!appId) return res.status(400).json({ error: 'Steam linki düzgün deyil.' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(`${STEAM_API_BASE}?appids=${encodeURIComponent(appId)}&l=english`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AurexStudio/1.0' }
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Steam HTTP ${response.status}`);
    const raw = await response.json();
    const entry = raw?.[appId];
    if (!entry?.success || !entry?.data) return res.status(404).json({ error: 'Oyun tapılmadı.' });
    const d = entry.data;
    const screenshots = Array.isArray(d.screenshots) ? d.screenshots.filter(s => s?.path_full).map(s => ({ id: s.id, path_full: s.path_full })) : [];
    const movie = Array.isArray(d.movies) && d.movies.length ? (d.movies.find(m => m.highlight) || d.movies[0]) : null;
    const trailer = movie?.mp4?.max || movie?.mp4?.['480'] || movie?.webm?.max || '';
    const result = {
      steam_app_id: String(appId),
      steam_url: `https://store.steampowered.com/app/${appId}/`,
      slug: slugify(d.name || appId),
      title: d.name || '',
      short_description_en: d.short_description || '',
      short_description_az: '',
      description_en: stripHtml(d.about_the_game || d.detailed_description || ''),
      description_az: '',
      header_image: d.header_image || '',
      hero_image: screenshots[0]?.path_full || d.header_image || '',
      screenshots,
      trailer_url: trailer,
      genres: Array.isArray(d.genres) ? d.genres : [],
      categories: Array.isArray(d.categories) ? d.categories : [],
      platforms: d.platforms || {},
      developers: Array.isArray(d.developers) ? d.developers : [],
      publishers: Array.isArray(d.publishers) ? d.publishers : [],
      release_date: d.release_date?.date || '',
      website: d.website || '',
      _stats: {
        screenshots_count: screenshots.length,
        platforms_count: Object.values(d.platforms || {}).filter(Boolean).length,
        genres_count: Array.isArray(d.genres) ? d.genres.length : 0,
        has_trailer: !!trailer,
        has_release_date: !!d.release_date?.date
      }
    };
    return res.status(200).json({ ok: true, data: result });
  } catch (e) {
    console.error('steam-import:', e.message);
    return res.status(503).json({ error: 'Steam məlumatlarını hazırda əldə etmək mümkün deyil.' });
  }
};
