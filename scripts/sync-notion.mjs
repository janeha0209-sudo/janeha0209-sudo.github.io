/**
 * Notion → site-data.json
 * GitHub Actions에서 실행됩니다. 토큰은 절대 이 파일에 적지 마세요 (Secrets 사용).
 *
 * 필요한 환경변수
 *   NOTION_TOKEN        : 노션 내부 통합(Integration) 토큰  (ntn_...)
 *   NOTION_DB_RESEARCH  : 연구실적 DB의 데이터소스 ID
 *   NOTION_DB_TEACHING  : 강의실적 DB의 데이터소스 ID
 *   NOTION_DB_PRESS     : 언론보도 DB의 데이터소스 ID
 *   NOTION_DB_SITE      : 홈 콘텐츠 DB의 데이터소스 ID
 */
import { writeFile, mkdir } from "node:fs/promises";

const TOKEN = process.env.NOTION_TOKEN;
const DB_RESEARCH = process.env.NOTION_DB_RESEARCH;
const DB_TEACHING = process.env.NOTION_DB_TEACHING;
const DB_PRESS    = process.env.NOTION_DB_PRESS;
const DB_SITE     = process.env.NOTION_DB_SITE;
const API = "https://api.notion.com/v1";
const HEADERS = {
  "Authorization": `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

/* ── 노션 속성값을 평범한 문자열/숫자로 변환 ── */
const txt = (p) => {
  if (!p) return "";
  switch (p.type) {
    case "title":
    case "rich_text":   return (p[p.type] || []).map(t => t.plain_text).join("").trim();
    case "select":      return p.select?.name || "";
    case "multi_select":return (p.multi_select || []).map(s => s.name);
    case "number":      return p.number ?? null;
    case "url":         return p.url || "";
    case "checkbox":    return p.checkbox;
    case "date":        return p.date?.start || "";
    default:            return "";
  }
};

async function queryDB(id) {
  if (!id) return [];
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`${API}/databases/${id}/query`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ page_size: 100, start_cursor: cursor })
    });
    if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
    const json = await res.json();
    rows.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return rows;
}

const pick = (props, ...names) => {
  for (const n of names) if (props[n] !== undefined) return txt(props[n]);
  return "";
};

function mapResearch(page) {
  const p = page.properties;
  return {
    title:   pick(p, "제목", "Title", "Name"),
    type:    pick(p, "유형", "Type"),          // 국제학술지 / 국내학술지 / 국제학회 / 국내학회 / 학위논문 / 수상 / 저서
    year:    pick(p, "연도", "Year"),
    detail:  pick(p, "상세", "Venue"),         // 저널명, 권(호), 페이지 · 학회명, 개최지
    authors: pick(p, "저자", "Authors"),
    link:    pick(p, "링크", "Link", "URL"),
    tags:    pick(p, "태그", "Tags") || [],
    show:    p["게시"] ? txt(p["게시"]) : true
  };
}

function mapTeaching(page) {
  const p = page.properties;
  return {
    course: pick(p, "교과목", "Course", "Title", "Name"),
    org:    pick(p, "기관", "Organization"),   // 제주관광대학교 / 대정여자고등학교 / ...
    term:   pick(p, "학기", "학년도", "Term"),  // 2026-1
    kind:   pick(p, "구분", "Kind"),           // 전공 / 교양 / 고교 / 평생교육 / 특강
    target: pick(p, "대상", "Target"),
    note:   pick(p, "비고", "Note"),
    tags:   pick(p, "태그", "Tags") || [],
    show:   p["게시"] ? txt(p["게시"]) : true
  };
}

function mapPress(page) {
  const p = page.properties;
  return {
    title:  pick(p, "제목", "Title", "Name"),
    outlet: pick(p, "매체", "Outlet"),
    year:   pick(p, "연도", "Year"),
    when:   pick(p, "시기", "When"),
    link:   pick(p, "링크", "Link", "URL"),
    show:   p["게시"] ? txt(p["게시"]) : true
  };
}

function mapSite(page) {
  const p = page.properties;
  return {
    key:    pick(p, "항목", "Key", "Name"),
    kind:   pick(p, "구분", "Kind"),
    order:  pick(p, "순서", "Order") || 0,
    ko:     pick(p, "한국어", "Korean"),
    en:     pick(p, "English", "영어"),
    period: pick(p, "기간", "Period"),
    desc:   pick(p, "설명", "Note"),
    link:   pick(p, "링크", "Link", "URL"),
    show:   p["게시"] ? txt(p["게시"]) : true
  };
}

const yr = (v) => parseInt(String(v).slice(0, 4)) || 0;

const [researchRaw, teachingRaw, pressRaw, siteRaw] = await Promise.all([
  queryDB(DB_RESEARCH),
  queryDB(DB_TEACHING),
  queryDB(DB_PRESS),
  queryDB(DB_SITE)
]);

const research = researchRaw.map(mapResearch)
  .filter(r => r.show !== false && r.title)
  .sort((a, b) => yr(b.year) - yr(a.year));

const teaching = teachingRaw.map(mapTeaching)
  .filter(r => r.show !== false && r.course)
  .sort((a, b) => String(b.term).localeCompare(String(a.term)));

const press = pressRaw.map(mapPress)
  .filter(r => r.show !== false && r.title)
  .sort((a, b) => yr(b.year) - yr(a.year));

const site = siteRaw.map(mapSite)
  .filter(r => r.key)
  .sort((a, b) => (a.order || 0) - (b.order || 0));

const count = (t) => research.filter(r => r.type === t).length;

const data = {
  updated: new Date().toISOString().slice(0, 10),
  counts: {
    intl:  count("국제학술지"),
    dom:   count("국내학술지"),
    conf:  research.filter(r => r.type?.includes("학회")).length,
    award: count("수상")
  },
  research,
  teaching,
  press,
  site
};

await mkdir("data", { recursive: true });
const body = JSON.stringify(data, null, 2);
await writeFile("data/site-data.json", body, "utf8");
// 페이지는 이 .js 파일을 <script>로 읽습니다 (로컬에서도 바로 열림)
await writeFile("data/site-data.js", `window.SITE_DATA = ${body};\n`, "utf8");
console.log(`✓ 연구 ${research.length} · 강의 ${teaching.length} · 보도 ${press.length} · 홈 콘텐츠 ${site.length}건 저장 완료`);
