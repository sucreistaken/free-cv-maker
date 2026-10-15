// Regenerates the third-party-style CV PDFs in src/utils/pdf/__fixtures__/corpus/.
//
// Real users import PDFs made by LinkedIn, Word, Canva, Europass and LaTeX, not only by this
// app. Each style below renders the same fictional person (corpus/data.json) the way that
// kind of document is usually laid out, so the importer is tested against layouts it did
// not produce itself. Run with: node scripts/make-corpus-fixtures.mjs [style ...]
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = fileURLToPath(new URL('../src/utils/pdf/__fixtures__/corpus/', import.meta.url));
const data = JSON.parse(readFileSync(path.join(dir, 'data.json'), 'utf8'));
mkdirSync(dir, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const range = (e) => `${e.start} - ${e.end}`;
const dash = (e) => `${e.start} – ${e.end}`;
const levelEn = { native: 'Native', fluent: 'Fluent', beginner: 'Basic' };
const levelTr = { native: 'Ana Dil', fluent: 'İleri', beginner: 'Başlangıç' };
const bullets = (list, mark = '') => `<ul>${list.map((b) => `<li>${mark}${esc(b)}</li>`).join('')}</ul>`;

const page = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:A4;margin:0} *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#222}
ul{margin:3px 0 6px 0;padding-left:16px} li{margin:1px 0} h1,h2,h3,p{margin:0}
${css}</style></head><body>${body}</body></html>`;

// ── 1. LinkedIn profile export: narrow left rail, company first, dates with durations ──
function linkedin(d) {
  const side = `
    <div class="s"><b>Contact</b><p>${d.phone} (Mobile)</p><p>${d.email}</p><p>www.linkedin.com/${d.linkedin}</p><p>${d.github}</p><p>${d.website}</p></div>
    <div class="s"><b>Top Skills</b>${d.skills.flatMap((c) => c.items).slice(0, 4).map((i) => `<p>${i}</p>`).join('')}</div>
    <div class="s"><b>Languages</b>${d.languages.map((l) => `<p>${l.name} (${l.level === 'native' ? 'Native or Bilingual' : l.level === 'fluent' ? 'Full Professional' : 'Elementary'})</p>`).join('')}</div>
    <div class="s"><b>Certifications</b>${d.certifications.map((c) => `<p>${c.name}</p>`).join('')}</div>`;
  const main = `
    <h1>${d.name}</h1><p class="hl">${d.title} at ${d.experience[0].company}</p><p class="loc">${d.location}</p>
    <h2>Summary</h2><p>${d.summary}</p>
    <h2>Experience</h2>
    ${d.experience.map((e) => `<div class="j"><h3>${e.company}</h3><p class="t">${e.title}</p><p class="dt">${e.start.replace('Mar', 'March').replace('Jun', 'June').replace('Aug', 'August').replace('Feb', 'February').replace('May', 'May')} - ${e.end.replace('Feb', 'February').replace('May', 'May')}</p><p class="dt">${e.location}</p>${bullets(e.bullets)}</div>`).join('')}
    <h2>Education</h2>
    ${d.education.map((e) => `<div class="j"><h3>${e.institution}</h3><p class="t">${e.degree} · (${e.start} - ${e.end})</p></div>`).join('')}`;
  return page(
    `.w{display:flex}.r{width:190px;padding:40px 16px;font-size:9pt}.m{flex:1;padding:40px 36px 40px 20px}.s{margin-bottom:14px}.s b{display:block;color:#0a66c2;margin-bottom:3px}.s p{margin:2px 0}
     h1{font-size:22pt}.hl{font-size:11pt;margin:4px 0}.loc{color:#666}h2{font-size:13pt;border-bottom:1px solid #999;margin:16px 0 6px;padding-bottom:2px}h3{font-size:11pt}.t{font-weight:normal}.dt{color:#555;font-size:9pt}.j{margin-bottom:8px}`,
    `<div class="w"><div class="r">${side}</div><div class="m">${main}</div></div>`,
  );
}

// ── 2. Europass-like: date column left, blue section bars ──
function europass(d) {
  const row = (l, r) => `<div class="row"><div class="l">${l}</div><div class="rt">${r}</div></div>`;
  const body = `
    <div class="hd"><h1>${d.name}</h1><p>${d.location} | ${d.phone} | ${d.email}</p><p>www.linkedin.com/${d.linkedin} | ${d.github}</p></div>
    <div class="bar">WORK EXPERIENCE</div>
    ${d.experience.map((e) => row(`${e.start} – ${e.end}`, `<b>${e.title}</b><p>${e.company}, ${e.location}</p>${bullets(e.bullets)}`)).join('')}
    <div class="bar">EDUCATION AND TRAINING</div>
    ${d.education.map((e) => row(`${e.start} – ${e.end}`, `<b>${e.degree}</b><p>${e.institution}</p>${e.gpa ? `<p>GPA: ${e.gpa}</p>` : ''}`)).join('')}
    <div class="bar">PERSONAL SKILLS</div>
    ${d.skills.map((c) => row(`${c.category}`, c.items.join(', '))).join('')}
    ${row('Mother tongue', d.languages.filter((l) => l.level === 'native').map((l) => l.name).join(', '))}
    ${row('Other languages', d.languages.filter((l) => l.level !== 'native').map((l) => `${l.name} (${levelEn[l.level]})`).join(', '))}
    <div class="bar">CERTIFICATIONS</div>
    ${d.certifications.map((c) => row(c.year, `<b>${c.name}</b><p>${c.issuer}</p>`)).join('')}`;
  return page(
    `.hd{padding:28px 40px 6px}h1{font-size:20pt;color:#0e4194}.bar{margin:16px 40px 6px;background:#0e4194;color:#fff;padding:3px 8px;font-weight:bold;font-size:10pt}
     .row{display:flex;margin:0 40px 8px}.l{width:130px;color:#333;padding-right:8px}.rt{flex:1}`,
    body,
  );
}

// ── 3. Word classic: centered header, underlined caps headings, right-aligned dates ──
function word(d) {
  const line = (l, r) => `<div class="ln"><b>${l}</b><span>${r}</span></div>`;
  return page(
    `.c{padding:36px 48px}h1{text-align:center;font-size:20pt}.ct{text-align:center;margin:4px 0 10px;font-size:9.5pt}
     h2{font-size:11pt;text-transform:uppercase;border-bottom:1.5px solid #000;margin:12px 0 5px;padding-bottom:1px}.ln{display:flex;justify-content:space-between}i{display:block;margin-bottom:1px}`,
    `<div class="c"><h1>${d.name}</h1><p class="ct">${d.location} | ${d.phone} | ${d.email} | linkedin.com/${d.linkedin} | ${d.github}</p>
     <h2>Professional Summary</h2><p>${d.summary}</p>
     <h2>Professional Experience</h2>
     ${d.experience.map((e) => `${line(`${e.company}, ${e.location}`, dash(e))}<i>${e.title}</i>${bullets(e.bullets)}`).join('')}
     <h2>Education</h2>
     ${d.education.map((e) => `${line(e.institution, `${e.start} – ${e.end}`)}<i>${e.degree}${e.gpa ? `, GPA: ${e.gpa}` : ''}</i>`).join('')}
     <h2>Skills</h2>${d.skills.map((c) => `<p><b>${c.category}:</b> ${c.items.join(', ')}</p>`).join('')}
     <h2>Languages</h2><p>${d.languages.map((l) => `${l.name} (${levelEn[l.level]})`).join(', ')}</p>
     <h2>Certifications</h2>${d.certifications.map((c) => `${line(c.name, c.year)}<i>${c.issuer}</i>`).join('')}</div>`,
  );
}

// ── 4. Canva-like: dark sidebar, name above the main column, dates above titles ──
function canva(d) {
  const side = `<h3>CONTACT</h3><p>${d.phone}</p><p>${d.email}</p><p>${d.location}</p><p>${d.website}</p><p>${d.github}</p>
    <h3>SKILLS</h3>${d.skills.flatMap((c) => c.items).map((i) => `<p>• ${i}</p>`).join('')}
    <h3>LANGUAGES</h3>${d.languages.map((l) => `<p>${l.name} - ${levelEn[l.level]}</p>`).join('')}`;
  const main = `<h1>${d.name.toUpperCase()}</h1><p class="ti">${d.title.toUpperCase()}</p>
    <h2>PROFILE</h2><p>${d.summary}</p>
    <h2>WORK EXPERIENCE</h2>
    ${d.experience.map((e) => `<p class="dt">${e.start} - ${e.end.toUpperCase()}</p><p><b>${e.title}</b></p><p class="co">${e.company} | ${e.location}</p>${bullets(e.bullets)}`).join('')}
    <h2>EDUCATION</h2>
    ${d.education.map((e) => `<p class="dt">${e.start} - ${e.end}</p><p><b>${e.degree}</b></p><p class="co">${e.institution}</p>`).join('')}
    <h2>CERTIFICATIONS</h2>${d.certifications.map((c) => `<p><b>${c.name}</b></p><p class="co">${c.issuer} | ${c.year}</p>`).join('')}`;
  return page(
    `.w{display:flex;min-height:297mm}.sd{width:230px;background:#2b3a4a;color:#fff;padding:40px 20px}.sd h3{margin:18px 0 6px;letter-spacing:1px;font-size:10pt}.sd p{margin:3px 0;font-size:9pt}
     .mn{flex:1;padding:40px 32px}h1{font-size:26pt;letter-spacing:2px}.ti{margin:2px 0 14px;letter-spacing:3px;color:#555}h2{font-size:12pt;border-bottom:2px solid #2b3a4a;margin:16px 0 6px;letter-spacing:1px}.dt{font-size:8.5pt;color:#777;margin-top:6px}.co{color:#555;font-style:italic}`,
    `<div class="w"><div class="sd">${side}</div><div class="mn">${main}</div></div>`,
  );
}

// ── 5. Turkish Word CV: personal info table, Turkish headings, dates first ──
function trword(d) {
  return page(
    `.c{padding:36px 48px}h1{text-align:center;font-size:20pt;text-transform:uppercase}h2{font-size:11pt;background:#e8e8e8;padding:3px 6px;margin:12px 0 6px}
     table{border-collapse:collapse;width:100%}td{padding:2px 4px;vertical-align:top}.k{width:140px;font-weight:bold}.dt{width:150px;font-weight:bold}`,
    `<div class="c"><h1>${d.name}</h1>
     <h2>KİŞİSEL BİLGİLER</h2><table>
       <tr><td class="k">Adres</td><td>: ${d.location}</td></tr><tr><td class="k">Telefon</td><td>: ${d.phone}</td></tr><tr><td class="k">E-posta</td><td>: ${d.email}</td></tr>
       <tr><td class="k">LinkedIn</td><td>: linkedin.com/${d.linkedin}</td></tr><tr><td class="k">GitHub</td><td>: ${d.github}</td></tr></table>
     <h2>ÖZET</h2><p>${d.summary}</p>
     <h2>İŞ DENEYİMİ</h2><table>${d.experience.map((e) => `<tr><td class="dt">${e.start} - ${e.end}</td><td><b>${e.company}</b>, ${e.location}<br><i>${e.title}</i>${bullets(e.bullets)}</td></tr>`).join('')}</table>
     <h2>EĞİTİM</h2><table>${d.education.map((e) => `<tr><td class="dt">${e.start} - ${e.end}</td><td><b>${e.institution}</b><br>${e.degree}${e.gpa ? ` (Not Ortalaması: ${e.gpa})` : ''}</td></tr>`).join('')}</table>
     <h2>YETENEKLER</h2>${d.skills.map((c) => `<p><b>${c.category}:</b> ${c.items.join(', ')}</p>`).join('')}
     <h2>YABANCI DİLLER</h2><p>${d.languages.map((l) => `${l.name} (${levelTr[l.level]})`).join(', ')}</p>
     <h2>SERTİFİKALAR</h2>${d.certifications.map((c) => `<p><b>${c.name}</b> - ${c.issuer}, ${c.year}</p>`).join('')}</div>`,
  );
}

// ── 6. Harvard-like: mixed-case bold headings, serif, role line under company ──
function harvard(d) {
  const line = (l, r) => `<div class="ln"><b>${l}</b><span>${r}</span></div>`;
  return page(
    `body{font-family:'Times New Roman',serif;font-size:10.5pt}.c{padding:40px 56px}h1{text-align:center;font-size:18pt;font-weight:normal;letter-spacing:.5px}.ct{text-align:center;margin:3px 0 10px}
     h2{font-size:10.5pt;font-weight:bold;border-bottom:1px solid #000;margin:12px 0 4px}.ln{display:flex;justify-content:space-between}i{display:block}`,
    `<div class="c"><h1>${d.name}</h1><p class="ct">${d.location} • ${d.email} • ${d.phone}<br>linkedin.com/${d.linkedin} • ${d.github}</p>
     <h2>Experience</h2>${d.experience.map((e) => `${line(e.company, e.location)}<div class="ln"><i>${e.title}</i><span>${range(e)}</span></div>${bullets(e.bullets)}`).join('')}
     <h2>Education</h2>${d.education.map((e) => `${line(e.institution, `${e.start} – ${e.end}`)}<i>${e.degree}${e.gpa ? `; GPA: ${e.gpa}` : ''}</i>`).join('')}
     <h2>Skills &amp; Interests</h2>${d.skills.map((c) => `<p><b>${c.category}:</b> ${c.items.join(', ')}</p>`).join('')}<p><b>Languages:</b> ${d.languages.map((l) => `${l.name} (${levelEn[l.level]})`).join(', ')}</p>
     <h2>Certifications</h2>${d.certifications.map((c) => `<p>${c.name}, ${c.issuer}, ${c.year}</p>`).join('')}</div>`,
  );
}

// ── 7. One-line entries: "Title | Company | Location | Dates", skills table ──
function inline(d) {
  return page(
    `.c{padding:36px 44px}h1{font-size:22pt;color:#1b5e20}h2{font-size:12pt;color:#1b5e20;margin:14px 0 4px}table{width:100%;border-collapse:collapse}td{padding:2px 6px 2px 0;vertical-align:top}.k{width:120px;font-weight:bold}`,
    `<div class="c"><h1>${d.name}</h1><p>${d.title}</p><p>${d.email} · ${d.phone} · ${d.location}</p><p>linkedin.com/${d.linkedin} · ${d.github} · ${d.website}</p>
     <h2>Summary</h2><p>${d.summary}</p>
     <h2>Experience</h2>${d.experience.map((e) => `<p><b>${e.title}</b> | ${e.company} | ${e.location} | ${e.start}–${e.end}</p>${bullets(e.bullets)}`).join('')}
     <h2>Education</h2>${d.education.map((e) => `<p><b>${e.degree}</b>, ${e.institution}, ${e.start}–${e.end}${e.gpa ? ` (GPA ${e.gpa})` : ''}</p>`).join('')}
     <h2>Technical Skills</h2><table>${d.skills.map((c) => `<tr><td class="k">${c.category}</td><td>${c.items.join(', ')}</td></tr>`).join('')}</table>
     <h2>Languages</h2><table>${d.languages.map((l) => `<tr><td class="k">${l.name}</td><td>${levelEn[l.level]}</td></tr>`).join('')}</table>
     <h2>Certifications</h2>${d.certifications.map((c) => `<p>${c.name} (${c.issuer}, ${c.year})</p>`).join('')}</div>`,
  );
}

// ── 8. Turkish two-column: right sidebar with skills and languages ──
function trside(d) {
  const main = `<h1>${d.name}</h1><p class="ti">${d.title}</p><h2>Profil</h2><p>${d.summary}</p>
    <h2>Deneyim</h2>${d.experience.map((e) => `<p><b>${e.title}</b></p><p class="co">${e.company}, ${e.location} | ${e.start} - ${e.end}</p>${bullets(e.bullets)}`).join('')}
    <h2>Eğitim</h2>${d.education.map((e) => `<p><b>${e.degree}</b></p><p class="co">${e.institution} | ${e.start} - ${e.end}</p>`).join('')}`;
  const side = `<h3>İletişim</h3><p>${d.email}</p><p>${d.phone}</p><p>${d.location}</p><p>linkedin.com/${d.linkedin}</p>
    <h3>Yetenekler</h3>${d.skills.flatMap((c) => c.items).map((i) => `<p>${i}</p>`).join('')}
    <h3>Diller</h3>${d.languages.map((l) => `<p>${l.name} (${levelTr[l.level]})</p>`).join('')}
    <h3>Sertifikalar</h3>${d.certifications.map((c) => `<p>${c.name}</p><p class="co">${c.issuer}, ${c.year}</p>`).join('')}`;
  return page(
    `.w{display:flex}.mn{flex:1;padding:40px 24px 40px 40px}.sd{width:210px;background:#f1f1f1;padding:40px 18px;min-height:297mm}h1{font-size:22pt}.ti{color:#555;margin-bottom:10px}h2{font-size:12pt;border-bottom:1px solid #333;margin:14px 0 5px}h3{font-size:10.5pt;margin:14px 0 5px}.sd p{margin:3px 0;font-size:9pt}.co{color:#555;font-size:9pt}`,
    `<div class="w"><div class="mn">${main}</div><div class="sd">${side}</div></div>`,
  );
}

const styles = {
  linkedin: [linkedin, 'en'],
  europass: [europass, 'en'],
  word: [word, 'en'],
  canva: [canva, 'en'],
  'tr-word': [trword, 'tr'],
  harvard: [harvard, 'en'],
  inline: [inline, 'en'],
  'tr-side': [trside, 'tr'],
};

const wanted = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [name, [build, lang]] of Object.entries(styles)) {
    if (wanted.length && !wanted.includes(name)) continue;
    const html = build(data[lang]);
    const context = await browser.newContext();
    const pg = await context.newPage();
    await pg.setContent(html, { waitUntil: 'load' });
    const out = path.join(dir, `${name}.pdf`);
    await pg.pdf({ path: out, format: 'A4', margin: { top: 0, right: 0, bottom: 0, left: 0 }, printBackground: true, preferCSSPageSize: true });
    console.log(`${name} -> ${out}`);
    await context.close();
  }
} finally {
  await browser.close();
}
