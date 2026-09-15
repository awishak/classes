// What a game puts on the room screen: a slide payload for each view the game
// panel's Put on screen offers, read off the same scoring the panel shows.
// GameSlides.jsx draws them. Nothing here names a student.

import { scoreGame, spreadBuckets, norm } from "@ishak/decks";

const LIMIT_TYPED = 8;   // the most answers a free-form question shows on the wall

function questionRow(q, i, card, keys, accepts) {
  const row = { n: i + 1, text: q.text, pct: q.pct, answered: q.answered, reviews: q.reviews, typed: q.typed };
  if (!q.typed) {
    return { ...row, options: card?.config?.options || [], counts: q.counts, reviewBy: q.reviewBy, correct: q.correct };
  }
  // Free-form on the wall: each different answer once, with how many gave it.
  const groups = new Map();
  q.answers.forEach(a => {
    const k = norm(a.value);
    const g = groups.get(k) || { text: String(a.value).trim(), picked: 0, reviews: 0, right: false };
    g.picked += 1;
    if (a.review) g.reviews += 1;
    if (a.right) g.right = true;
    groups.set(k, g);
  });
  const list = [...groups.values()].sort((a, b) => Number(b.right) - Number(a.right) || b.picked - a.picked).slice(0, LIMIT_TYPED);
  return { ...row, groups: list };
}

/** view: { view: 'during' | 'spread' | 'questions' | 'question' | 'teams', cardId? } */
export function castFor(view, game, rosterCount = 0) {
  const { deck, cards = [], keys = {}, accepts = [], progress = [], teams = [] } = game;
  const score = scoreGame(game);
  const base = { type: "slide", title: deck.title, label: deck.title, deckId: deck.id };
  const teamGame = deck.teams && deck.teams !== "none";

  if (view.view === "during") {
    const endsAt = deck.closes_at ? Date.parse(deck.closes_at)
      : deck.time_limit_min && deck.opened_at ? Date.parse(deck.opened_at) + deck.time_limit_min * 60000 : null;
    return { ...base, template: "gameDuring", endsAt, submitted: progress.filter(p => p.completed_at).length, of: teamGame ? teams.length : rosterCount || null };
  }
  if (view.view === "spread") {
    return { ...base, template: "gameSpread", buckets: spreadBuckets(score.ranking.map(v => v.pct)) };
  }
  if (view.view === "teams") {
    const byId = Object.fromEntries(teams.map(t => [t.id, t.name]));
    return { ...base, template: "gameTeams", teams: score.ranking.filter(v => byId[v.viewerId]).map(v => ({ name: byId[v.viewerId], pct: v.pct })) };
  }
  const rows = score.questions.map((q, i) => questionRow(q, i, cards.find(c => c.id === q.cardId), keys, accepts));
  if (view.view === "question") {
    const i = score.questions.findIndex(q => q.cardId === view.cardId);
    return { ...base, template: "gameQuestion", ...(rows[i] || {}), title: deck.title, label: `${deck.title} · ${i + 1}` };
  }
  return { ...base, template: "gameQuestions", rows };
}
