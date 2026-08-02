/* Сборка питч-деки WhiteBox AI (RU) под National Founder Cup.

   Формат выступления: 3 минуты — примерно 90 секунд демо-видео и 90 секунд
   слайдов. Отсюда семь «говорящих» слайдов плюс слайд под видео: больше на
   такой хронометраж не читается.

   Все внешние цифры на слайдах помечены источником; всё, что является нашей
   моделью, помечено как модель. Выдуманных ссылок в деке нет. */

import PptxGenJS from "pptxgenjs";

const A = "D:\\WhiteBoxAI_5\\deck\\assets";
const TEX = "D:\\WhiteBoxAI_5\\whitebox-ai\\public\\textures";
const OUT = "D:\\WhiteBoxAI_5\\deck\\WhiteBoxAI-NFC-2026.pptx";

const C = {
  bg: "07080A",
  surface: "101217",
  surface2: "161A21",
  line: "242933",
  lineSoft: "1B1F27",
  hi: "F2F4F8",
  mid: "9AA3B2",
  lo: "5F6876",
  iris: "E8804F",
  irisDim: "6B3A22",
  pos: "4ADE80",
  warn: "F5B549",
};
const F = { display: "Bahnschrift SemiBold", sans: "Segoe UI", mono: "Consolas" };

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "W", width: 13.333, height: 7.5 });
pptx.layout = "W";
pptx.author = "WhiteBox AI";
pptx.company = "WhiteBox AI";
pptx.title = "WhiteBox AI — National Founder Cup 2026";

const W = 13.333;
const H = 7.5;
const M = 0.78; // поле

/* ── примитивы ──────────────────────────────────────────────────────────── */

function base(slide, { texture = "contour.jpeg", dim = 92 } = {}) {
  slide.background = { color: C.bg };
  slide.addImage({ path: `${TEX}\\${texture}`, x: 0, y: 0, w: W, h: H, transparency: dim });
}

function card(slide, { x, y, w, h, fill = C.surface, line = C.line, radius = 0.06 }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: line, width: 0.75 },
    rectRadius: radius,
  });
}

function mono(slide, text, { x, y, w, size = 9.5, color = C.lo, align = "left", bold = false }) {
  slide.addText(text, {
    x, y, w, h: 0.24,
    fontFace: F.mono, fontSize: size, color, align, bold,
    charSpacing: 1.2, valign: "middle", margin: 0,
  });
}

/* Шапка слайда: маленький куб, рубрика, номер. */
function chrome(slide, eyebrow, number) {
  slide.addImage({ path: `${A}\\cube-flat.png`, x: M, y: 0.46, w: 0.3, h: 0.3 });
  mono(slide, eyebrow, { x: M + 0.44, y: 0.49, w: 8, size: 10, color: C.mid });
  mono(slide, number, { x: W - M - 1.2, y: 0.49, w: 1.2, size: 10, color: C.lo, align: "right" });
  slide.addShape(pptx.ShapeType.line, {
    x: M, y: 0.92, w: W - M * 2, h: 0,
    line: { color: C.lineSoft, width: 1 },
  });
}

const TOP = 2.92; // единая верхняя граница контента под двухстрочным заголовком

function title(slide, text, { y = 1.2, size = 34, w = W - M * 2, color = C.hi } = {}) {
  slide.addText(text, {
    x: M, y, w, h: 1.5,
    fontFace: F.display, fontSize: size, color,
    valign: "top", margin: 0, lineSpacing: size * 1.16,
  });
}

function foot(slide, text) {
  slide.addText(text, {
    x: M, y: H - 0.72, w: W - M * 2, h: 0.4,
    fontFace: F.mono, fontSize: 8.5, color: C.lo,
    valign: "middle", margin: 0, lineSpacing: 12,
  });
}

/* Плитка с крупной цифрой. */
function stat(slide, { x, y, w, value, unit, label, source, accent = C.hi, h = 1.72 }) {
  card(slide, { x, y, w, h });
  slide.addText(
    [
      { text: value, options: { fontSize: 33, color: accent, fontFace: F.display } },
      ...(unit ? [{ text: " " + unit, options: { fontSize: 14, color: C.mid, fontFace: F.sans } }] : []),
    ],
    { x: x + 0.28, y: y + 0.22, w: w - 0.5, h: 0.6, valign: "middle", margin: 0 },
  );
  slide.addText(label, {
    x: x + 0.28, y: y + 0.82, w: w - 0.5, h: 0.5,
    fontFace: F.sans, fontSize: 11.5, color: C.mid, valign: "top", margin: 0, lineSpacing: 15,
  });
  if (source) mono(slide, source, { x: x + 0.28, y: y + h - 0.42, w: w - 0.5, size: 8, color: C.lo });
}

/* Нумерованный шаг. */
function step(slide, { x, y, w, n, head, body, h = 1.9 }) {
  card(slide, { x, y, w, h });
  mono(slide, n, { x: x + 0.28, y: y + 0.24, w: 1, size: 11, color: C.iris, bold: true });
  slide.addText(head, {
    x: x + 0.28, y: y + 0.54, w: w - 0.56, h: 0.62,
    fontFace: F.display, fontSize: 15, color: C.hi, valign: "top", margin: 0,
  });
  slide.addText(body, {
    x: x + 0.28, y: y + 1.24, w: w - 0.56, h: h - 1.34,
    fontFace: F.sans, fontSize: 11, color: C.mid, valign: "top", margin: 0, lineSpacing: 15,
  });
}

function bullets(slide, items, { x, y, w, size = 13, gap = 0.52, color = C.mid }) {
  items.forEach((item, index) => {
    slide.addShape(pptx.ShapeType.rect, {
      x, y: y + index * gap + 0.09, w: 0.055, h: 0.16,
      fill: { color: C.iris }, line: { color: C.iris, width: 0 },
    });
    slide.addText(item, {
      x: x + 0.2, y: y + index * gap - 0.04, w: w - 0.2, h: 0.46,
      fontFace: F.sans, fontSize: size, color, valign: "top", margin: 0, lineSpacing: size * 1.35,
    });
  });
}

/* Скриншот продукта в рамке. */
function shot(slide, file, { x, y, w }) {
  const h = (w * 1080) / 1920;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - 0.045, y: y - 0.045, w: w + 0.09, h: h + 0.09,
    fill: { color: C.surface2 }, line: { color: C.line, width: 0.75 }, rectRadius: 0.05,
  });
  slide.addImage({ path: `${A}\\${file}`, x, y, w, h });
  return h;
}

/* ── 1 · титул ─────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s, { texture: "contour-hud.jpeg", dim: 88 });

  mono(s, "WBX-001 / ОБЛОЖКА", { x: M, y: 0.5, w: 6, size: 10, color: C.lo });
  mono(s, "NATIONAL FOUNDER CUP · 2026", { x: W - M - 6, y: 0.5, w: 6, size: 10, color: C.lo, align: "right" });

  s.addImage({ path: A + "\\cube.png", x: 8.5, y: 1.76, w: 3.5, h: 3.5 });

  mono(s, "ОБЪЯСНИМЫЙ ИИ ДЛЯ НАЙМА   ●   БЕЛЫЙ, НЕ ЧЁРНЫЙ", { x: M, y: 2.1, w: 7.4, size: 11.5, color: C.mid });

  s.addText([
    { text: "WHITEBOX", options: { fontFace: F.display, fontSize: 60, color: C.hi } },
    { text: " AI", options: { fontFace: F.sans, fontSize: 60, color: "B4BCC9" } },
  ], { x: M - 0.04, y: 2.48, w: 7.8, h: 1.06, valign: "middle", margin: 0 });

  s.addShape(pptx.ShapeType.rect, { x: M, y: 3.62, w: 5.1, h: 0.032, fill: { color: C.iris }, line: { width: 0 } });

  s.addText([
    { text: "Не очередной чёрный ящик, а ", options: { fontFace: F.sans, fontSize: 20, color: C.mid } },
    { text: "белый — в который видно.", options: { fontFace: F.display, fontSize: 20, color: C.hi } },
  ], { x: M, y: 3.86, w: 7.6, h: 0.5, valign: "middle", margin: 0 });

  s.addText("Каждый балл объяснён. Каждое решение — за человеком. Каждое действие в аудите.", {
    x: M, y: 4.42, w: 7.6, h: 0.4, fontFace: F.sans, fontSize: 13.5, italic: true, color: C.mid, valign: "middle", margin: 0,
  });

  const chips = ["ДРАЙВЕРЫ БАЛЛА", "ЦИТАТЫ-ДОКАЗАТЕЛЬСТВА", "РЕШЕНИЕ ЧЕЛОВЕКА", "АУДИТ-ЛОГ"];
  let cx = M;
  chips.forEach((text, i) => {
    const cw = 0.3 + text.length * 0.093;
    const on = i === 2;
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: 5.14, w: cw, h: 0.46, fill: { color: C.bg },
      line: { color: on ? C.iris : C.line, width: 0.75 }, rectRadius: 0.05,
    });
    s.addText(text, { x: cx, y: 5.14, w: cw, h: 0.46, fontFace: F.mono, fontSize: 9,
      color: on ? C.iris : C.mid, align: "center", valign: "middle", charSpacing: 0.8, margin: 0 });
    cx += cw + 0.16;
  });

  mono(s, "ЧЕЛОВЕК В КОНТУРЕ · ОБЯЗАТЕЛЬНО", { x: M, y: H - 0.92, w: 7, size: 10, color: C.lo });
  mono(s, "АЛМАТЫ, KZ · 2026", { x: W - M - 5, y: H - 0.92, w: 5, size: 10, color: C.lo, align: "right" });
}

/* ── 2 · проблема ───────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "ПРОБЛЕМА", "01");
  title(s, "Первичный отбор — самый дорогой\nручной этап найма");

  const w = (W - M * 2 - 0.44) / 3;
  stat(s, {
    x: M, y: TOP, w,
    value: "45", unit: "дней",
    label: "средний срок закрытия вакансии",
    source: "SHRM, данные 2025",
  });
  stat(s, {
    x: M + w + 0.22, y: TOP, w,
    value: "$4 129", label: "средняя стоимость одного найма",
    source: "SHRM Benchmarking Report",
  });
  stat(s, {
    x: M + (w + 0.22) * 2, y: TOP, w,
    value: "≈2 750 ₸", label: "час работы рекрутера в Казахстане",
    source: "расчёт от средней з/п РК, БНС, I кв. 2026",
  });

  bullets(s, [
    "Рекрутер вручную проводит одинаковые первичные интервью и сравнивает кандидатов «на глаз» — результат нельзя ни проверить, ни воспроизвести, ни защитить перед кандидатом.",
    "ИИ в найм уже приходит — но как чёрный ящик: балл без объяснения. Это риск предвзятости, юридический риск и потеря доверия кандидата.",
  ], { x: M, y: 5.16, w: W - M * 2, gap: 0.78 });

  foot(s, "Источники: SHRM Benchmarking Report (cost-per-hire, time-to-fill); Бюро национальной статистики РК, средняя з/п I кв. 2026 — 461 486 ₸ / 168 ч.");
}

/* ── 3 · решение ────────────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "РЕШЕНИЕ", "02");
  title(s, "ИИ структурирует информацию.\nРешение принимает человек.");

  const colW = 3.62;
  step(s, {
    x: M, y: TOP, w: colW, h: 2.62, n: "01",
    head: "HR описывает вакансию словами",
    body: "Обычный текст от руководителя → профиль, критерии оценки, план интервью и шкалы. Готово за минуту, всё редактируется.",
  });
  step(s, {
    x: M + colW + 0.24, y: TOP, w: colW, h: 2.62, n: "02",
    head: "Кандидат проходит интервью по коду",
    body: "Одинаковые вопросы для всех, запись и транскрипт с хеш-подписью. Есть текстовый режим — без потери в оценке.",
  });
  step(s, {
    x: M + (colW + 0.24) * 2, y: TOP, w: colW, h: 2.62, n: "03",
    head: "Рекрутер получает доказательства",
    body: "Балл по каждому критерию + цитата из ответа как обоснование + аудит-след. Финальное решение — только человек, с письменной причиной.",
  });

  foot(s, "Полный путь работает в продукте сегодня — он показан в демо на последнем слайде.");
}

/* ── 5 · экономика клиента ──────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "ЭКОНОМИКА КЛИЕНТА", "04");
  title(s, "Считаем на одном кандидате");

  const colW = 3.62;
  const y = TOP;

  card(s, { x: M, y, w: colW, h: 2.32 });
  mono(s, "СЕЙЧАС", { x: M + 0.28, y: y + 0.24, w: 2, size: 10, color: C.mid });
  s.addText("1 375 ₸", {
    x: M + 0.28, y: y + 0.62, w: colW - 0.56, h: 0.6,
    fontFace: F.sans, fontSize: 30, bold: true, color: C.hi, valign: "middle", margin: 0,
  });
  s.addText("30 минут рекрутера на первичное интервью, заметки и сравнение", {
    x: M + 0.28, y: y + 1.3, w: colW - 0.56, h: 0.9,
    fontFace: F.sans, fontSize: 11.5, color: C.mid, valign: "top", margin: 0, lineSpacing: 15,
  });

  card(s, { x: M + colW + 0.24, y, w: colW, h: 2.32 });
  mono(s, "С WHITEBOX", { x: M + colW + 0.52, y: y + 0.24, w: 2.4, size: 10, color: C.mid });
  s.addText("580 ₸", {
    x: M + colW + 0.52, y: y + 0.62, w: colW - 0.56, h: 0.6,
    fontFace: F.sans, fontSize: 30, bold: true, color: C.hi, valign: "middle", margin: 0,
  });
  s.addText("5 минут на проверку scorecard (230 ₸)\n+ 350 ₸ за прогон кандидата — это наша выручка", {
    x: M + colW + 0.52, y: y + 1.3, w: colW - 0.56, h: 0.9,
    fontFace: F.sans, fontSize: 11.5, color: C.mid, valign: "top", margin: 0, lineSpacing: 15,
  });

  card(s, { x: M + (colW + 0.24) * 2, y, w: colW, h: 2.32, fill: "12161F", line: C.irisDim });
  mono(s, "ЭКОНОМИЯ", { x: M + (colW + 0.24) * 2 + 0.28, y: y + 0.24, w: 2, size: 10, color: C.iris });
  s.addText(
    [
      { text: "795 ₸", options: { fontSize: 30, bold: true, color: C.pos, fontFace: F.sans } },
      { text: "  −58%", options: { fontSize: 15, color: C.pos, fontFace: F.sans } },
    ],
    { x: M + (colW + 0.24) * 2 + 0.28, y: y + 0.62, w: colW - 0.56, h: 0.6, valign: "middle", margin: 0 },
  );
  s.addText("на каждом кандидате — и сопоставимая, проверяемая оценка вместо впечатления", {
    x: M + (colW + 0.24) * 2 + 0.28, y: y + 1.3, w: colW - 0.56, h: 0.9,
    fontFace: F.sans, fontSize: 11.5, color: C.mid, valign: "top", margin: 0, lineSpacing: 15,
  });

  card(s, { x: M, y: 5.52, w: W - M * 2, h: 1.3, fill: C.surface2 });
  s.addText(
    [
      { text: "Компания на 3 000 человек, 5 000 кандидатов в год:   ", options: { fontSize: 15, color: C.mid, fontFace: F.sans } },
      { text: "≈4 млн ₸ экономии", options: { fontSize: 17, bold: true, color: C.hi, fontFace: F.sans } },
      { text: "   ·   ", options: { fontSize: 15, color: C.lo, fontFace: F.sans } },
      { text: "1,75 млн ₸ выручки нам", options: { fontSize: 17, bold: true, color: C.iris, fontFace: F.sans } },
    ],
    { x: M + 0.34, y: 5.76, w: W - M * 2 - 0.68, h: 0.5, valign: "middle", margin: 0 },
  );
  s.addText("Окупаемость для клиента — с первой закрытой вакансии. Экономия растёт линейно с объёмом найма.", {
    x: M + 0.34, y: 6.26, w: W - M * 2 - 0.68, h: 0.4,
    fontFace: F.sans, fontSize: 12, color: C.mid, valign: "middle", margin: 0,
  });

  foot(s, "Модель, а не факт: ставка часа рекрутера = средняя з/п по РК 461 486 ₸ (БНС, I кв. 2026) / 168 ч ≈ 2 750 ₸. Длительность этапов — наше допущение, проверяем на пилотах.");
}

/* ── 6 · монетизация и рынок ────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "МОНЕТИЗАЦИЯ И РЫНОК", "05");
  title(s, "Платят за пропускную способность,\nа не за лицензии");

  card(s, { x: M, y: TOP, w: 5.86, h: 2.82 });
  mono(s, "МОДЕЛЬ ВЫРУЧКИ", { x: M + 0.3, y: TOP + 0.24, w: 3, size: 10, color: C.mid });
  bullets(s, [
    "350 ₸ за прогон кандидата — растёт вместе с наймом клиента, платит только за пройденные интервью.",
    "Подписка на рабочее место рекрутера — доступ к воронке, сравнению и аналитике.",
    "Enterprise: SSO, хранение записей в РК, выгрузка аудит-логов, свои шкалы оценки.",
  ], { x: M + 0.3, y: TOP + 0.64, w: 5.26, size: 11.5, gap: 0.72 });

  card(s, { x: M + 6.1, y: TOP, w: 5.86, h: 2.82 });
  mono(s, "РЫНОК", { x: M + 6.4, y: TOP + 0.24, w: 3, size: 10, color: C.mid });

  const rows = [
    ["SAM · Казахстан", "≈2 000 средних юрлиц + крупный бизнес", "БНС, на 01.04.2026"],
    ["Расширение", "СНГ и рынки с русскоязычным наймом", "тот же продукт, та же боль"],
    ["SOM · 3 года", "120 клиентов × 2 млн ₸ = 240 млн ₸ ARR", "наша цель"],
  ];
  rows.forEach(([head, body, note], index) => {
    const y = TOP + 0.66 + index * 0.72;
    s.addText(head, {
      x: M + 6.4, y, w: 5.26, h: 0.28,
      fontFace: F.sans, fontSize: 12.5, bold: true, color: C.hi, valign: "middle", margin: 0,
    });
    s.addText(body, {
      x: M + 6.4, y: y + 0.28, w: 5.26, h: 0.28,
      fontFace: F.sans, fontSize: 12, color: C.mid, valign: "middle", margin: 0,
    });
    mono(s, note, { x: M + 6.4, y: y + 0.54, w: 5.26, size: 8, color: C.lo });
  });

  card(s, { x: M, y: 6.02, w: W - M * 2, h: 0.76, fill: C.surface2, line: C.irisDim });
  s.addText("Почему у нас купят: дешевле на кандидате, быстрее закрытие — и, в отличие от чёрного ящика, каждое решение можно объяснить кандидату и проверяющему.", {
    x: M + 0.34, y: 6.02, w: W - M * 2 - 0.68, h: 0.76,
    fontFace: F.sans, fontSize: 13, color: C.hi, valign: "middle", margin: 0,
  });

  foot(s, "SAM: средние юрлица — 0,1% активных субъектов МСБ (БНС, на 01.04.2026), плюс крупные предприятия. SOM — наша цель, не прогноз рынка.");
}

/* ── 7 · почему сейчас ──────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "ПОЧЕМУ СЕЙЧАС", "06");
  title(s, "Рынок идёт к объяснимости —\nмы построены по этому требованию");

  const w = (W - M * 2 - 0.44) / 3;
  stat(s, {
    x: M, y: TOP, w, h: 2.02,
    value: "Annex III", accent: C.iris,
    label: "ИИ в найме отнесён к «высокому риску» в EU AI Act: обязательны надзор человека, логирование и проверка на предвзятость",
    source: "EU AI Act, Annex III §4",
  });
  stat(s, {
    x: M + w + 0.22, y: TOP, w, h: 2.02,
    value: "дек. 2027", accent: C.warn,
    label: "срок вступления требований для высокого риска перенесён — у рынка появилось окно, чтобы подготовиться заранее",
    source: "Digital Omnibus, май 2026",
  });
  stat(s, {
    x: M + (w + 0.22) * 2, y: TOP, w, h: 2.02,
    value: "до 7%", accent: C.hi,
    label: "оборота — верхняя планка штрафов за нарушение; цена непрозрачного решения растёт",
    source: "EU AI Act, санкции",
  });

  bullets(s, [
    "Мы не докручиваем объяснимость поверх готовой модели — продукт с самого начала собран так: доказательство к каждому баллу, обязательное решение человека, аудит-след на хешах.",
    "Для Казахстана это ещё и вопрос доверия кандидата и защиты работодателя, а не только регуляторики.",
  ], { x: M, y: 5.28, w: W - M * 2, gap: 0.78 });

  foot(s, "Источник: текст EU AI Act (Annex III, раздел 4) и пакет Digital Omnibus (май 2026) о переносе сроков. Прямых требований такого рода в РК пока нет — мы закладываем стандарт заранее.");
}

/* ── 8 · статус и запрос ────────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "СТАТУС · ДОРОЖНАЯ КАРТА · ЗАПРОС", "07");
  title(s, "Продукт работает сегодня");

  const w = (W - M * 2 - 0.44) / 3;
  stat(s, {
    x: M, y: TOP, w, h: 1.86,
    value: "Работает", accent: C.pos,
    label: "полный путь: создание вакансии → интервью → оценка → решение с аудит-следом",
  });
  stat(s, {
    x: M + w + 0.22, y: TOP, w, h: 1.86,
    value: "1 минута", label: "от текста руководителя до опубликованной вакансии с критериями и планом интервью",
  });
  stat(s, {
    x: M + (w + 0.22) * 2, y: TOP, w, h: 1.86,
    value: "5 пилотов", accent: C.iris,
    label: "цель ближайшего квартала: платные пилоты в компаниях с массовым наймом",
  });

  card(s, { x: M, y: 5.06, w: 5.86, h: 1.68 });
  mono(s, "БЛИЖАЙШИЕ 6 МЕСЯЦЕВ", { x: M + 0.3, y: 5.3, w: 4, size: 10, color: C.mid });
  bullets(s, [
    "Пилоты и первые платящие клиенты в РК",
    "Интеграции с ATS и кадровыми системами",
    "Отраслевые шаблоны критериев оценки",
  ], { x: M + 0.3, y: 5.7, w: 5.26, size: 11.5, gap: 0.34 });

  card(s, { x: M + 6.1, y: 5.06, w: 5.86, h: 1.68, fill: C.surface2, line: C.irisDim });
  mono(s, "ЗАПРОС", { x: M + 6.4, y: 5.3, w: 4, size: 10, color: C.iris });
  s.addText("Доступ к HR-командам для пилотов и партнёрам по внедрению — нам нужны реальные воронки найма, чтобы подтвердить экономию на данных клиента.", {
    x: M + 6.4, y: 5.68, w: 5.26, h: 1.0,
    fontFace: F.sans, fontSize: 13, color: C.hi, valign: "top", margin: 0, lineSpacing: 18,
  });

  foot(s, "«5 пилотов» — цель, а не текущий факт.");
}

/* ── 9 · приложение: источники ──────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s);
  chrome(s, "ПРИЛОЖЕНИЕ · ИСТОЧНИКИ", "08");
  title(s, "Откуда цифры", { size: 28 });

  const src = [
    ["Средняя зарплата в РК, I кв. 2026 — 461 486 ₸ (медианная 331 527 ₸)", "Бюро национальной статистики РК · stat.gov.kz"],
    ["Стоимость найма $4 129 и срок закрытия ~45 дней", "SHRM Benchmarking Report · shrm.org"],
    ["Количество субъектов бизнеса РК, средние юрлица — 0,1% активных МСБ", "Бюро национальной статистики РК, на 01.04.2026 · stat.gov.kz"],
    ["ИИ в найме — высокий риск (Annex III §4), штрафы до 7% оборота", "EU AI Act"],
    ["Перенос срока по высокому риску на 02.12.2027", "Digital Omnibus, май 2026"],
  ];
  src.forEach(([claim, source], index) => {
    const y = 2.62 + index * 0.78;
    s.addShape(pptx.ShapeType.rect, {
      x: M, y: y + 0.08, w: 0.055, h: 0.16, fill: { color: C.iris }, line: { width: 0 },
    });
    s.addText(claim, {
      x: M + 0.22, y, w: W - M * 2 - 0.22, h: 0.3,
      fontFace: F.sans, fontSize: 13, color: C.hi, valign: "middle", margin: 0,
    });
    mono(s, source, { x: M + 0.22, y: y + 0.3, w: W - M * 2 - 0.22, size: 9, color: C.lo });
  });

  foot(s, "Расчёты, помеченные как «модель», построены на этих источниках и наших допущениях по длительности этапов — они проверяются на пилотах, а не заявляются как факт.");
}


/* ── демо · последний слайд ─────────────────────────────────────────────── */
{
  const s = pptx.addSlide();
  base(s, { texture: "contour-hud.jpeg", dim: 88 });
  chrome(s, "ДЕМО", "09");

  s.addImage({ path: A + "\\cube.png", x: 9.5, y: 4.3, w: 2.6, h: 2.6 });

  title(s, "Смотрите сами", { y: 2.2, size: 54 });

  s.addText("Вакансия → интервью → решение с доказательствами.\nЗапись реального прогона: 90 секунд.", {
    x: M, y: 3.62, w: 8.4, h: 1.2,
    fontFace: F.sans, fontSize: 19, color: C.mid, valign: "top", margin: 0, lineSpacing: 30,
  });

  s.addShape(pptx.ShapeType.rect, { x: M, y: 5.06, w: 3.4, h: 0.032, fill: { color: C.iris }, line: { width: 0 } });
  mono(s, "ВАКАНСИЮ ПИШЕТ МОДЕЛЬ · ИНТЕРВЬЮ И РАСШИФРОВКА НАСТОЯЩИЕ · ОЦЕНКА ИЗ ПРОДУКТА", {
    x: M, y: 5.34, w: 11, size: 10.5, color: C.lo,
  });
}

await pptx.writeFile({ fileName: OUT });
console.log("deck:", OUT);
