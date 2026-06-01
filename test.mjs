import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TEST_URL || ('file://' + path.resolve('index.html'));

const log = (ok, msg) => console.log(`${ok ? '✅' : '❌'} ${msg}`);
let fails = 0;
const check = (cond, msg) => { if (!cond) fails++; log(cond, msg); return cond; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1000 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle0' });

// ── TITLE: preview carousel ──
check(await page.$('#preview-card'), 'title preview carousel present');
const pv1 = await page.$eval('#preview-card .pv-quote', e => e.textContent);
await wait(9600);
const pv2 = await page.$eval('#preview-card .pv-quote', e => e.textContent);
check(pv1 !== pv2, 'preview carousel rotates quotes');

// ── About the author (fixed) ──
check(await page.$('#about-fab'), 'About button fixed on screen');
await page.evaluate(()=>openAbout()); await wait(200);
const aboutText = await page.$eval('#about-modal', e => e.textContent);
check(/Reif Tauati/.test(aboutText) && /thegoodproject\.net/.test(aboutText), 'About modal shows Reif + link');
await page.evaluate(()=>closeAbout()); await wait(150);
check(await page.$eval('#about-modal', e => !e.classList.contains('open')), 'About modal closes');

// ── SETUP: 2 players ──
await page.evaluate(() => setCount(2)); await wait(150);
await page.$eval('#pn-0', (e,v) => e.value = v, 'Lehi'); await page.type('#pn-0', '');
await page.evaluate(() => { players[0].name = 'Lehi'; players[1].name = 'Nephi'; });
await page.evaluate(() => startQuest()); await wait(250);
await page.evaluate(() => endTour());

// helper: play a whole level by clicking correct answers; verify false-path on first gem
async function playLevel(ids, levelLabel, testFalsePath) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    await page.evaluate((id) => openCard(document.querySelector(`[data-id="${id}"]`)), id);
    await wait(160);
    if (testFalsePath && i === 0) {
      // tap a wrong answer → false-path hint should appear, gem stays locked
      await page.evaluate(() => [...document.querySelectorAll('.q-choice')].find(e => e.dataset.ok === '0').click());
      await wait(80);
      const fh = await page.$eval('#q-falsehint', e => e.classList.contains('show'));
      check(fh, `${levelLabel}: wrong answer shows false-path teaching`);
    }
    await page.evaluate(() => [...document.querySelectorAll('.q-choice')].find(e => e.dataset.ok === '1').click());
    await wait(140);
    const unlocked = await page.evaluate((id) => document.getElementById('slot-' + id)?.classList.contains('unlocked'), id);
    check(unlocked, `${levelLabel}: ${id} unlocked`);
    // share button present on the card
    if (i === 0) check(await page.$('.share-btn'), `${levelLabel}: per-card Share button present`);
    await page.evaluate(() => closeCard());
    await wait(50);
  }
}

// ── LEVEL 1 — Founding gems (in the document) ──
check(await page.$eval('#level-pill', e => /Founding Treasure/.test(e.textContent)), 'Level 1 pill: Founding Treasure');
await playLevel(['g8','g9','g1','g2','g3','g4','g5','g7'], 'L1', true);
await wait(1300);
check(await page.$eval('#level-complete', e => e.classList.contains('show')), 'L1 → level-complete screen');
check(await page.$eval('#lc-next', e => /Restoration Key/.test(e.textContent)), 'unlocks Quest 2: Restoration Key');
await page.evaluate(()=>document.getElementById('lc-btn').click()); await wait(350);

// ── LEVEL 2 — Restoration scrolls ──
check(await page.$eval('#level-pill', e => /Restoration Key/.test(e.textContent)), 'Level 2 pill: Restoration Key');
check((await page.$$('.record')).length === 8, 'Level 2 shows 8 record scrolls');
// verify a real scripture scroll renders the actual words
await page.evaluate(() => openCard(document.querySelector('[data-id="r1"]'))); await wait(200);
const scrollWords = await page.$eval('.p-scroll-words', e => e.textContent);
check(/moral agency/.test(scrollWords), 'scroll shows actual D&C 101:78 words');
const whyChain = await page.$eval('.p-why', e => e.textContent);
check(/Doctrine:/.test(whyChain) && /Temple:/.test(whyChain), 'why-it-matters chain renders');
// scripture source link points to churchofjesuschrist.org
const srcHref = await page.$eval('.p-source', a => a.href);
check(/churchofjesuschrist\.org\/study\/scriptures/.test(srcHref), 'scripture card links to churchofjesuschrist.org');
await page.evaluate(() => closeCard());
// Level 1 founding card links to the National Archives
await page.evaluate(() => { loadLevel(1); openCard(document.querySelector('[data-id="g1"]')); }); await wait(200);
check(await page.$eval('.p-source', a => /archives\.gov/.test(a.href)), 'founding card links to archives.gov');
await page.evaluate(() => { closeCard(); loadLevel(2); }); await wait(300);
await playLevel(['r1','r2','r3','r4','r5','r6','r7','r8'], 'L2', true);
await wait(1300);
check(await page.$eval('#lc-next', e => /Covenant Crown/.test(e.textContent)), 'unlocks Quest 3: Covenant Crown');
await page.evaluate(()=>document.getElementById('lc-btn').click()); await wait(350);

// ── LEVEL 3 — Covenant crown (living prophets) ──
check(await page.$eval('#level-pill', e => /Covenant Crown/.test(e.textContent)), 'Level 3 pill: Covenant Crown');
check((await page.$$('.record')).length === 4, 'Level 3 shows 4 crowns');
await page.evaluate(() => openCard(document.querySelector('[data-id="c2"]'))); await wait(200);
const prophet = await page.$eval('.p-prophet', e => e.textContent);
check(/Dallin H\. Oaks/.test(prophet) && /essential to God/.test(prophet), 'Level 3 shows verified living-prophet quote (Oaks)');
await page.evaluate(() => closeCard());
await playLevel(['c1','c2','c3','c4'], 'L3', false);

// ── VICTORY ──
await wait(1600);
check(await page.$eval('#victory', e => e.classList.contains('show')), 'L3 → final victory');
const vtext = await page.$eval('#victory', e => e.textContent);
check(/completed all 3 quests/.test(vtext), 'finale says completed all 3 quests');
check(/America turns/.test(vtext) && /July 5, 2026/.test(vtext), 'America 250 + fast still present');
const roster = await page.$$eval('.v-pl', els => els.map(e => e.textContent));
check(roster.length === 2 && roster.join().includes('Lehi') && roster.join().includes('Nephi'), 'finale roster shows both players');
// total gems across all levels = 20
const total = await page.evaluate(() => players.reduce((s,p)=>s+p.gems,0));
check(total === 20, `players found all 20 across 3 levels (got ${total})`);
check(await page.$('.v-share'), 'finale Share button present');
check(await page.$eval('.v-photo', img => img.naturalWidth > 0), 'finale photo loaded');

// canvas share card actually renders a PNG blob
const cardOk = await page.evaluate(async () => {
  const blob = await makeShareCard({ emoji:'🏛️', title:'Test', quote:'Hello world', ref:'— ref', footer:'x' });
  return blob && blob.type === 'image/png' && blob.size > 1000;
});
check(cardOk, 'share card renders a real PNG image (canvas)');

// About has the Collaborate GitHub link
const aboutHtml = await page.$eval('#about-modal', e => e.innerHTML);
check(/Collaborate here/.test(aboutHtml) && /github\.com\/goodindustries/.test(aboutHtml), 'About shows Collaborate GitHub link');

await page.screenshot({ path: 'finale.png' });
log(true, 'saved finale.png');

// Play Again resets to level 1 setup
await page.evaluate(()=>restart()); await wait(300);
check(await page.$eval('#char-screen', e => e.style.display !== 'none'), 'Play Again → setup screen');

check(errors.length === 0, 'no JS/console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));

// ── MOBILE: panel must not be covered by the overlay backdrop (iOS stacking bug) ──
const mob = await browser.newPage();
await mob.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true });
await mob.goto(URL, { waitUntil: 'networkidle0' });
await mob.evaluate(() => { setCount(1); startQuest(); endTour(); });
await wait(300);
// Start button reachable with 4 players (scrollable start screen)
await mob.evaluate(() => restart());
await mob.evaluate(() => setCount(4)); await wait(150);
const startReachable = await mob.evaluate(() => {
  const btn = document.getElementById('start-btn'); btn.scrollIntoView();
  const r = btn.getBoundingClientRect();
  return r.top >= 0 && r.top < window.innerHeight && btn.style.display !== 'none';
});
check(startReachable, 'mobile: Start button reachable with 4 players');
await mob.evaluate(() => { startQuest(); endTour(); }); await wait(250);
await mob.evaluate(() => openCard(document.querySelector('[data-id="g8"]'))); await wait(400);
// the element at the panel's content must be the panel, NOT the overlay
const topEl = await mob.evaluate(() => {
  const panel = document.getElementById('side-panel');
  const r = panel.getBoundingClientRect();
  const t = document.elementFromPoint(r.x + r.width/2, r.y + 120);
  return t ? (t.closest('#side-panel') ? 'panel' : (t.id || t.className)) : 'none';
});
check(topEl === 'panel', `mobile: answer panel is on top, not greyed out (got "${topEl}")`);
// and a choice is actually tappable through to unlock
await mob.evaluate(() => [...document.querySelectorAll('.q-choice')].find(e => e.dataset.ok === '1').click());
await wait(150);
check(await mob.evaluate(() => document.getElementById('slot-g8')?.classList.contains('unlocked')), 'mobile: can tap an answer through the panel');
await mob.close();

// ── CHEAT CODE: #level2 jumps straight to Quest 2 ──
const cheatPage = await browser.newPage();
await cheatPage.goto(URL + '#level2', { waitUntil: 'networkidle0' });
await cheatPage.evaluate(() => { setCount(1); startQuest(); });
await wait(300);
check(await cheatPage.$eval('#level-pill', e => /Restoration Key/.test(e.textContent)), 'cheat #level2 jumps straight to Quest 2');
// and cheat(3) from console
await cheatPage.evaluate(() => cheat(3)); await wait(200);
check(await cheatPage.$eval('#level-pill', e => /Covenant Crown/.test(e.textContent)), 'cheat(3) console code jumps to Quest 3');
// cheat('win') jumps straight to the finale
await cheatPage.evaluate(() => cheat('win')); await wait(300);
check(await cheatPage.$eval('#victory', e => e.classList.contains('show')), "cheat('win') jumps to the finale");
await cheatPage.close();

await browser.close();
console.log('\n' + (fails === 0 ? '🎉 ALL CHECKS PASSED' : `⚠️  ${fails} CHECK(S) FAILED`));
process.exit(fails === 0 ? 0 : 1);
