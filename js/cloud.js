// הענן של התוצרים: Supabase, פרויקט cultura-GH, טבלה refua_outputs. אותו דפוס כמו באמירות (amirot_outputs).
// בלי התחברות: קריאה פתוחה, וכתיבה רק דרך refua_add_output, שבודקת כל שדה (גם: אין עובדה בלי מקור, ומילות שער הבטיחות) ומגבילה קצב.
// המפתח הוא המפתח הציבורי (publishable), שמיועד ללקוח. בלי רשת: התוצר נשמר במכשיר ונשלח שוב בכניסה הבאה.
// כל תוצר שנשמר מופיע מעצמו במגזין "חוט" (MaAmarim-GH), דרך ה-view mag_articles.
const URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
const KEY = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const PENDING = 'refua.outputs.pending';

const fromRow = (r) => ({ id: r.id, kind: r.kind, topic: r.topic, chain: r.topic, title: r.title, lead: r.lead, blocks: r.blocks, question: r.question, certainty: r.certainty || undefined, derivedFrom: r.derived_from, form: r.form || undefined, createdAt: r.created_at });
const toPayload = (o) => ({ kind: o.kind, topic: o.topic, title: o.title, lead: o.lead || '', blocks: o.blocks, question: o.question || '', certainty: o.certainty || '', derivedFrom: o.derivedFrom || '', form: o.form || '' });
const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING) || '[]'); } catch { return []; } };
const writePending = (xs) => { try { localStorage.setItem(PENDING, JSON.stringify(xs)); } catch { /* בלי אחסון */ } };

/** כל התוצרים שנוספו, מהחדש לישן. מה שעוד לא הגיע לענן מוצג מהמכשיר, ומסומן */
export async function loadOutputs() {
  const local = readPending().map((o) => ({ ...o, local: true }));
  try {
    const r = await fetch(`${URL}/rest/v1/refua_outputs?select=*&order=created_at.desc&limit=200`, { headers: H });
    if (!r.ok) return local;
    return [...local, ...(await r.json()).map(fromRow)];
  } catch { return local; }
}

/** הוספה לאפליקציה: קודם לענן. אם אין רשת, נשמר במכשיר */
export async function addOutput(o) {
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/refua_add_output`, { method: 'POST', headers: H, body: JSON.stringify({ p: toPayload(o) }) });
    if (r.ok) return { ok: true, out: fromRow(await r.json()) };
    const e = await r.json().catch(() => ({}));
    return { ok: false, error: e.message || 'השמירה נכשלה. אפשר לנסות שוב.' };
  } catch {
    const local = { ...o, id: 'local-' + Date.now(), local: true };
    writePending([...readPending(), local]);
    return { ok: false, error: 'אין רשת. התוצר נשמר במכשיר, ויישלח לענן בכניסה הבאה.', local };
  }
}

export async function flushPending() {
  const xs = readPending();
  if (!xs.length) return;
  writePending([]);
  for (const o of xs) await addOutput(o);
}
