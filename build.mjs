// Builds the Loop Ready interview bank.
// Reads content/<track>/*.md, validates every question, and writes:
//   dist/index.html   the page body published as the artifact
//   Loop-Ready.html   a standalone copy you can open by double-clicking
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TRACKS = ['swe', 'ai', 'devops'];
const SINGLE = new Set(['track', 'name', 'blurb', 'hook', 'tags']);
const MULTI = new Set(['brief', 'tips', 'say', 'deep', 'trap', 'pro']);

const SOURCES = [
  { title: 'PracHub: AI Engineer Interview Questions 2026 (RAG, agents, evals)', url: 'https://prachub.com/resources/ai-engineer-interview-questions-2026-rag-agents-evals-and-production-systems' },
  { title: 'TechInterview.org: ML Engineer Interview in the Post-LLM Era', url: 'https://www.techinterview.org/post/3233474925/ml-engineer-interview-post-llm-era/' },
  { title: 'TechInterview.org: The Live Coding Interview With AI Allowed (2026)', url: 'https://www.techinterview.org/post/3233475398/live-coding-interview-ai-allowed-2026/' },
  { title: 'Exponent: Google AI-assisted coding interview', url: 'https://www.tryexponent.com/blog/google-ai-coding-interview' },
  { title: 'Wiz Academy: 30 common software engineer interview questions for 2026', url: 'https://www.wiz.io/academy/cloud-careers/software-engineer-interview-questions' },
  { title: 'Underdog.io: Top software engineer interview questions startups use in 2026', url: 'https://underdog.io/blog/software-engineer-interview-questions' },
  { title: 'KORE1: DevOps engineer interview questions (2026)', url: 'https://www.kore1.com/devops-engineer-interview-questions/' },
  { title: 'Futurense: DevOps interview questions for experienced professionals (2026)', url: 'https://futurense.com/blog/devops-interview-questions-for-experienced-professionals' },
  { title: 'ExamCert: Site reliability engineer interview questions 2026', url: 'https://www.examcert.app/blog/site-reliability-engineer-interview-questions-2026/' },
  { title: 'DataCamp: MCP interview questions', url: 'https://www.datacamp.com/blog/mcp-interview-questions' },
  { title: 'Model Context Protocol spec 2026-07-28 changelog', url: 'https://modelcontextprotocol.io/specification/2026-07-28/changelog' },
  { title: 'OWASP Top 10:2025 introduction', url: 'https://owasp.org/Top10/2025/0x00_2025-Introduction/' },
  { title: 'Kubernetes blog: Ingress NGINX retirement', url: 'https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/' },
  { title: 'Kubernetes blog: v1.35 in-place pod resize goes GA', url: 'https://kubernetes.io/blog/2025/12/19/kubernetes-v1-35-in-place-pod-resize-ga' },
];

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function clean(s) {
  return s
    .replace(/[ \t]*—[ \t]*/g, ' - ')   // em dash -> spaced hyphen
    .replace(/–/g, '-')                   // en dash -> hyphen
    .replace(/[ \t]+$/gm, '')
    .replace(/^\n+|\n+$/g, '');
}

const warnings = [];
function warn(file, line, msg) { warnings.push(`${file}:${line}  ${msg}`); }

function parseTrack(track) {
  const dir = path.join(ROOT, 'content', track);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  const meta = { id: track, name: track, brief: '', tips: '' };
  const sections = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r/g, '').split('\n');
    let sec = null, q = null, target = null, inFence = false;
    const append = (line) => { target.obj[target.key] = (target.obj[target.key] ?? '') + line + '\n'; };
    lines.forEach((raw, idx) => {
      const ln = idx + 1;
      if (/^\s*```/.test(raw)) {
        if (!target) { warn(file, ln, 'code fence outside a field'); return; }
        inFence = !inFence; append(raw); return;
      }
      if (inFence) { append(raw); return; }
      const qm = raw.match(/^###\s*\[(\d)\]\s*(.+?)\s*$/);
      if (qm) {
        if (!sec) { warn(file, ln, 'question before any @section'); return; }
        q = { l: +qm[1], q: clean(qm[2]), tags: [], follow: [] };
        sec.qs.push(q); target = null; q._at = `${file}:${ln}`; return;
      }
      const dm = raw.match(/^@(\w+)\s*(.*)$/);
      if (dm) {
        const [, key, rest] = dm;
        if (key === 'section') {
          const [id, title] = rest.split('|').map(s => s.trim());
          sec = { id, title: clean(title || id), blurb: '', qs: [] };
          sections.push(sec); q = null; target = null; return;
        }
        if (key === 'follow') {
          if (!q) { warn(file, ln, '@follow outside a question'); return; }
          const f = { q: clean(rest), a: '' }; q.follow.push(f); target = { obj: f, key: 'a' }; return;
        }
        const owner = q || (sec && key === 'blurb' ? sec : null) || meta;
        if (SINGLE.has(key)) {
          target = null;
          if (key === 'tags') owner.tags = rest.split(',').map(s => s.trim()).filter(Boolean);
          else owner[key] = clean(rest);
          return;
        }
        if (MULTI.has(key)) {
          owner[key] = ''; target = { obj: owner, key };
          if (rest.trim()) append(rest);
          return;
        }
        warn(file, ln, `unknown directive @${key}`); return;
      }
      if (target) { append(raw); return; }
      if (raw.trim()) warn(file, ln, `stray text: ${raw.slice(0, 60)}`);
    });
    if (inFence) warn(file, lines.length, 'unclosed code fence');
  }
  // finalise
  const seen = new Set();
  for (const s of sections) {
    for (const q of s.qs) {
      for (const k of ['say', 'deep', 'trap', 'pro']) if (q[k] != null) q[k] = clean(q[k]);
      q.follow = q.follow.map(f => ({ q: f.q, a: clean(f.a) }));
      if (!q.say) warn(q._at, '', `missing @say: ${q.q}`);
      if (!q.hook) warn(q._at, '', `missing @hook: ${q.q}`);
      if (q.l < 1 || q.l > 3) warn(q._at, '', `bad level ${q.l}`);
      let id = track + '-' + hash(q.q);
      if (seen.has(id)) { warn(q._at, '', `duplicate question: ${q.q}`); id += '-' + seen.size; }
      seen.add(id); q.id = id;
      delete q._at;
      if (!q.follow.length) delete q.follow;
      if (!q.tags.length) delete q.tags;
    }
  }
  meta.brief = clean(meta.brief || ''); meta.tips = clean(meta.tips || '');
  return { ...meta, sections: sections.filter(s => s.qs.length) };
}

const data = {
  tracks: TRACKS.filter(t => fs.existsSync(path.join(ROOT, 'content', t))).map(parseTrack),
  sources: SOURCES,
  built: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
};

// report
let grand = 0;
for (const t of data.tracks) {
  const lv = { 1: 0, 2: 0, 3: 0 };
  let n = 0;
  console.log(`\n${t.name} (${t.id})`);
  for (const s of t.sections) {
    s.qs.forEach(q => { lv[q.l]++; });
    n += s.qs.length;
    console.log(`  ${String(s.qs.length).padStart(3)}  ${s.title}`);
  }
  grand += n;
  console.log(`  ---  ${n} questions  (F ${lv[1]} / I ${lv[2]} / A ${lv[3]})`);
}
console.log(`\nTotal: ${grand} questions`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); warnings.forEach(w => console.log('  ' + w)); }

const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const BS = String.fromCharCode(92); // backslash, kept out of string literals on purpose
const json = JSON.stringify(data).replace(/</g, BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
const tpl = fs.readFileSync(path.join(ROOT, 'app', 'template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/null')) throw new Error('template is missing the data placeholder');
const page = tpl.replace('/*__DATA__*/null', () => json);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), page);
fs.writeFileSync(path.join(ROOT, 'Loop-Ready.html'),
  '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + page + '\n</html>\n');
console.log(`\nWrote dist/index.html (${(page.length / 1024).toFixed(0)} KB) and Loop-Ready.html`);
