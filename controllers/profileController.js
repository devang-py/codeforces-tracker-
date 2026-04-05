const axios = require('axios');
const crypto = require('crypto');

const CF_BASE = 'https://codeforces.com/api';

function buildApiUrl(method, params = {}) {
  const apiKey = process.env.CF_API_KEY;
  const apiSecret = process.env.CF_API_SECRET;

  if (!apiKey || apiKey === 'your_codeforces_api_key_here') {
    const query = new URLSearchParams(params).toString();
    return `${CF_BASE}/${method}${query ? '?' + query : ''}`;
  }

  const rand = Math.floor(Math.random() * 900000) + 100000;
  const time = Math.floor(Date.now() / 1000);
  const allParams = { ...params, apiKey, time };
  const sortedKeys = Object.keys(allParams).sort();
  const paramStr = sortedKeys.map(k => `${k}=${allParams[k]}`).join('&');
  const hashStr = `${rand}/${method}?${paramStr}#${apiSecret}`;
  const apiSig = rand + crypto.createHash('sha512').update(hashStr).digest('hex');
  const finalParams = new URLSearchParams({ ...allParams, apiSig }).toString();
  return `${CF_BASE}/${method}?${finalParams}`;
}

async function cfFetch(method, params = {}) {
  const url = buildApiUrl(method, params);
  const res = await axios.get(url, { timeout: 10000 });
  if (res.data.status !== 'OK') {
    throw new Error(res.data.comment || 'Codeforces API error');
  }
  return res.data.result;
}

const RANK_COLORS = {
  newbie: '#808080',
  pupil: '#008000',
  specialist: '#03A89E',
  expert: '#0000FF',
  'candidate master': '#AA00AA',
  master: '#FF8C00',
  'international master': '#FF8C00',
  grandmaster: '#FF0000',
  'international grandmaster': '#FF0000',
  'legendary grandmaster': '#FF0000',
};

function getRankColor(rank) {
  if (!rank) return '#808080';
  return RANK_COLORS[rank.toLowerCase()] || '#808080';
}

exports.searchUser = (req, res) => {
  const handle = (req.body.handle || '').trim();
  if (!handle) {
    return res.redirect('/?error=Please+enter+a+Codeforces+handle');
  }
  res.redirect(`/profile/${encodeURIComponent(handle)}`);
};

exports.getProfile = async (req, res, next) => {
  const handle = req.params.handle;

  try {
    const [userResult, submissionsResult, ratingResult] = await Promise.allSettled([
      cfFetch('user.info', { handles: handle }),
      cfFetch('user.status', { handle, from: 1, count: 100 }),
      cfFetch('user.rating', { handle }),
    ]);

    if (userResult.status === 'rejected') {
      const errMsg = userResult.reason?.message || '';
      if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('illegal')) {
        return res.status(404).render('errors/invalid-user', {
          title: 'User Not Found',
          layout: 'layouts/error',
          handle,
        });
      }
      throw userResult.reason;
    }

    const user = userResult.value[0];
    const submissions = submissionsResult.status === 'fulfilled' ? submissionsResult.value : [];
    const ratingHistory = ratingResult.status === 'fulfilled' ? ratingResult.value : [];

    const totalSubmissions = submissions.length;
    const accepted = submissions.filter(s => s.verdict === 'OK');
    const totalSolved = new Set(accepted.map(s => `${s.problem.contestId}${s.problem.index}`)).size;

    const verdictMap = {};
    submissions.forEach(s => {
      verdictMap[s.verdict] = (verdictMap[s.verdict] || 0) + 1;
    });

    const langMap = {};
    accepted.forEach(s => {
      langMap[s.programmingLanguage] = (langMap[s.programmingLanguage] || 0) + 1;
    });
    const topLanguages = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const tagMap = {};
    accepted.forEach(s => {
      (s.problem.tags || []).forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 12);

    const ratingBuckets = {};
    accepted.forEach(s => {
      if (s.problem.rating) {
        const bucket = Math.floor(s.problem.rating / 500) * 500;
        const label = `${bucket}-${bucket + 499}`;
        ratingBuckets[label] = (ratingBuckets[label] || 0) + 1;
      }
    });
    const ratingDist = Object.entries(ratingBuckets).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    const recentSubmissions = submissions.slice(0, 5).map(s => ({
      id: s.id,
      problemName: `${s.problem.contestId}${s.problem.index} - ${s.problem.name}`,
      verdict: s.verdict,
      language: s.programmingLanguage,
      time: new Date(s.creationTimeSeconds * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      memoryBytes: s.memoryConsumedBytes,
      timeMs: s.timeConsumedMillis,
    }));

    const maxRating = ratingHistory.length
      ? Math.max(...ratingHistory.map(r => r.newRating))
      : user.maxRating || 0;
    const contestCount = ratingHistory.length;

    res.render('profile', {
      title: `${user.handle} — CF Tracker`,
      user,
      rankColor: getRankColor(user.rank),
      totalSubmissions,
      totalSolved,
      verdictMap,
      topLanguages,
      topTags,
      ratingDist,
      recentSubmissions,
      maxRating,
      contestCount,
      ratingHistory: ratingHistory.slice(-20),
    });
  } catch (err) {
    next(err);
  }
};
