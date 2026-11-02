// Single source of truth for the body map. Every view is derived from here.
// Rules (docs/DATA_MODEL.md, docs/SAFETY.md):
//   known    -> must have evidence + source_id (from SOURCES)
//   said     -> must have tradition + source_id
//   believed -> must have status ("לא נבדק" / "לא אוששה")
//   no dosage, calorie, weight or "effect size" fields.
// Rich text: **bold**, ==insight==. Numbers are bolded by the renderer.

export const SOURCES = {
  'guyton-2020': { title: 'Guyton and Hall, Textbook of Medical Physiology', type: 'ספר יסוד', year: 2020, note: 'מהדורה 14', url: 'https://shop.elsevier.com/books/guyton-and-hall-textbook-of-medical-physiology/hall/978-0-323-59712-8' },
  'gray-2020': { title: "Gray's Anatomy", type: 'ספר יסוד', year: 2020, note: 'מהדורה 42', url: 'https://shop.elsevier.com/books/grays-anatomy/standring/978-0-7020-7705-0' },
  'janeway-2022': { title: "Janeway's Immunobiology", type: 'ספר יסוד', year: 2022, note: 'מהדורה 10', url: 'https://wwnorton.com/books/9780393884890' },
  'azevedo-2009': { title: 'Azevedo et al., J Comp Neurol', type: 'מחקר', year: 2009, note: 'ספירת תאי עצב במוח האדם', url: 'https://doi.org/10.1002/cne.21974' },
  'sender-2016': { title: 'Sender, Fuchs & Milo, PLoS Biology', type: 'מחקר', year: 2016, note: 'מכון ויצמן (Weizmann Institute)', url: 'https://doi.org/10.1371/journal.pbio.1002533' },
  'who-ghe-2023': { title: 'WHO, The top 10 causes of death', type: 'הנחיה רשמית', year: 2026, note: 'אומדנים לשנת 2023', url: 'https://www.who.int/news-room/fact-sheets/detail/the-top-10-causes-of-death' },
  'who-copd': { title: 'WHO, Chronic obstructive pulmonary disease', type: 'הנחיה רשמית', year: 2026, note: 'אומדנים לשנת 2023', url: 'https://www.who.int/news-room/fact-sheets/detail/chronic-obstructive-pulmonary-disease-(copd)' },
  'who-aqg-2021': { title: 'WHO Global Air Quality Guidelines', type: 'הנחיה רשמית', year: 2021, note: '', url: 'https://www.who.int/publications/i/item/9789240034228' },
  'who-immunization': { title: 'WHO, Vaccines and immunization', type: 'הנחיה רשמית', year: 2024, note: '', url: 'https://www.who.int/health-topics/vaccines-and-immunization' },
  'who-alcohol-2023': { title: 'WHO, No level of alcohol consumption is safe for our health', type: 'הודעה רשמית', year: 2023, note: '', url: 'https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health' },
  'who-constitution': { title: 'WHO, Constitution', type: 'מסמך יסוד', year: 1948, note: '', url: 'https://www.who.int/about/governance/constitution' },
  'iarc-globocan-2022': { title: 'IARC, GLOBOCAN', type: 'מאגר רשמי', year: 2022, note: '', url: 'https://gco.iarc.who.int/' },
  'iof': { title: 'International Osteoporosis Foundation', type: 'ארגון מקצועי', year: 2024, note: '', url: 'https://www.osteoporosis.foundation/' },
  'predimed-2018': { title: 'PREDIMED, NEJM', type: 'ניסוי מבוקר', year: 2018, note: 'פרסום מחודש', url: 'https://doi.org/10.1056/NEJMoa1800389' },
  'smiles-2017': { title: 'SMILES, BMC Medicine', type: 'ניסוי מבוקר', year: 2017, note: 'מדגם קטן, ללא סמיות מלאה', url: 'https://doi.org/10.1186/s12916-017-0791-y' },
  'reynolds-2019': { title: 'Reynolds et al., The Lancet', type: 'סקירה ומטה-אנליזה', year: 2019, note: 'מחקרי תצפית', url: 'https://doi.org/10.1016/S0140-6736(18)31809-9' },
  'deweber-2011': { title: 'deWeber et al., J Am Board Fam Med', type: 'מחקר', year: 2011, note: '', url: 'https://doi.org/10.3122/jabfm.2011.02.100156' },
  'nhs-stroke': { title: 'NHS, Stroke: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/stroke/symptoms/' },
  'nhs-breath': { title: 'NHS, Shortness of breath', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/symptoms/shortness-of-breath/' },
  'nhs-heart-attack': { title: 'NHS, Heart attack: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/heart-attack/symptoms/' },
  'nhs-bowel': { title: 'NHS, Bowel cancer: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/bowel-cancer/symptoms/' },
  'nhs-fracture': { title: 'NHS, Broken bones', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/broken-or-dislocated-bones/' },
  'nhs-anaphylaxis': { title: 'NHS, Anaphylaxis', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/anaphylaxis/' },
  'porter-1997': { title: 'Roy Porter, The Greatest Benefit to Mankind', type: 'היסטוריה של הרפואה', year: 1997, note: '', url: 'https://wwnorton.com/books/the-greatest-benefit-to-mankind/' },
  'vesalius-1543': { title: 'Andreas Vesalius, De humani corporis fabrica', type: 'מקור היסטורי', year: 1543, note: '', url: 'https://www.nlm.nih.gov/exhibition/historicalanatomies/vesalius_home.html' },
  'snow-1855': { title: 'John Snow, On the Mode of Communication of Cholera', type: 'מקור היסטורי', year: 1855, note: '', url: 'https://archive.org/details/b28985266' },
  'livertox-germander': { title: 'LiverTox, Germander (Teucrium)', type: 'מאגר רשמי, NIH', year: 2024, note: '', url: 'https://www.ncbi.nlm.nih.gov/books/NBK548282/' },
  'livertox-turmeric': { title: 'LiverTox, Turmeric', type: 'מאגר רשמי, NIH', year: 2021, note: '', url: 'https://www.ncbi.nlm.nih.gov/books/NBK548561/' },
  'ghassa-2024': { title: 'Ghassa et al., Annals of Medicine & Surgery', type: 'תיאור מקרה', year: 2024, note: 'מקרה יחיד', url: 'https://doi.org/10.1097/MS9.0000000000001760' },
  'iarc-82': { title: 'IARC Monographs, vol. 82', type: 'סיווג רשמי', year: 2002, note: 'תכשירים צמחיים עם אריסטולוכיה', url: 'https://publications.iarc.who.int/' },
  'debelle-2008': { title: 'Debelle, Vanherweghem & Nortier, Kidney International', type: 'סקירה', year: 2008, note: 'כרך 74, עמ׳ 158-169', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Aristolochic+acid+nephropathy+a+worldwide+problem' },
  'saper-2008': { title: 'Saper et al., JAMA', type: 'מחקר', year: 2008, note: '193 תכשירים שנבדקו', url: 'https://pubmed.ncbi.nlm.nih.gov/18728265/' },
  'harvey-1628': { title: 'William Harvey, De Motu Cordis', type: 'מקור היסטורי', year: 1628, note: 'פרק 8, תרגום Willis, 1847', url: 'https://en.wikisource.org/wiki/The_Works_of_William_Harvey/An_Anatomical_Disquisition_on_the_Motion_of_the_Heart_and_Blood_in_Animals/Chapter_8' },
  'who-cvd': { title: 'WHO, Cardiovascular diseases', type: 'הנחיה רשמית', year: 2025, note: '', url: 'https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)' },
  'who-hypertension': { title: 'WHO, Hypertension', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/hypertension' },
  'nhs-heart-failure': { title: 'NHS, Heart failure: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/heart-failure/symptoms/' },
  'dash-2001': { title: 'DASH-Sodium, NEJM', type: 'ניסוי מבוקר', year: 2001, note: '', url: 'https://doi.org/10.1056/NEJM200101043440101' },
  'nccih-tcm': { title: 'NCCIH, Traditional Chinese Medicine', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nccih.nih.gov/health/traditional-chinese-medicine-what-you-need-to-know' },
  'rambam-deot': { title: 'רמב"ם, משנה תורה, הלכות דעות ד', type: 'מסורת', year: 1180, note: 'הלכה ב', url: 'https://www.sefaria.org.il/Mishneh_Torah,_Human_Dispositions.4' },
};

// Each system: role (הכרה), failure (הבנה), action (שימוש), bridge (חיבור).
// bridge.link is the contract with the nutrition app: { app: 'nutrition', food_id | topic }.
export const SYSTEMS = [
  {
    id: 'nervous',
    name_he: 'מערכת העצבים',
    name_en: 'Nervous system',
    insight: '==**86** מיליארד תאים, ושבץ קוטע את הרשת.==',
    city: 'רשת התקשורת של העיר: אותות עוברים בה מהר, לכל הכיוונים.',
    role: { layer: 'known', text_he: 'במוח האדם כ-**86** מיליארד **תאי עצב**.', evidence: 'גבוהה', source_id: 'azevedo-2009' },
    failure: [
      { layer: 'known', text_he: '**שבץ** הוא סיבת המוות השנייה בעולם.', evidence: 'גבוהה', source_id: 'who-ghe-2023' },
      { layer: 'said', text_he: '**אריסטו** (Aristotle) ראה בלב את מקום המחשבה, ובמוח איבר שמקרר את הדם.', tradition: 'פילוסופיה יוונית', source_id: 'porter-1997' },
      { layer: 'believed', text_he: 'משתמשים רק ב-**10%** מהמוח.', status: 'לא אוששה' },
    ],
    action: { urgency: 'emergency', sign_he: 'פנים שמוטות, חולשה ביד או קושי בדיבור', go_he: 'מד"א **101**, מיד', source_id: 'nhs-stroke', question_he: 'מה גורמי הסיכון לשבץ אצלי, ואיך בודקים אותם?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: 'בניסוי **SMILES**, שיפור התזונה לווה בשיפור בתסמיני דיכאון.', evidence: 'ראשונית', source_id: 'smiles-2017', next_he: 'תזונה ים-תיכונית', link: { app: 'nutrition', topic: 'mediterranean-diet' } },
  },
  {
    id: 'respiratory',
    name_he: 'מערכת הנשימה',
    name_en: 'Respiratory system',
    insight: '==חצי ליטר בכל נשימה, ואוויר העיר נכנס איתו.==',
    city: 'מערכת האוורור של העיר: אוויר נכנס, מתחלף ויוצא.',
    role: { layer: 'known', text_he: 'בנשימה רגילה במנוחה נכנס כ**חצי ליטר** אוויר.', evidence: 'גבוהה', source_id: 'guyton-2020' },
    failure: [
      { layer: 'known', text_he: '**מחלת ריאות חסימתית כרונית** היא סיבת המוות השלישית בעולם: **3.4** מיליון מקרי מוות ב-**2023**.', evidence: 'גבוהה', source_id: 'who-copd' },
      { layer: 'said', text_he: '**אריסטו** סבר שהנשימה נועדה לקרר את חום הלב.', tradition: 'פילוסופיה יוונית', source_id: 'porter-1997' },
    ],
    action: { urgency: 'emergency', sign_he: 'קוצר נשימה פתאומי או קשה', go_he: 'מד"א **101**, מיד', source_id: 'nhs-breath', question_he: 'האם בדיקת תפקודי ריאות רלוונטית לי?' },
    bridge: { kind: 'city', layer: 'known', text_he: '**זיהום אוויר** הוא גורם סיכון מוכר למחלות נשימה.', evidence: 'גבוהה', source_id: 'who-aqg-2021', next_he: 'איכות האוויר ברחוב שלי', link: { app: 'city', topic: 'air-quality' } },
  },
  {
    id: 'cardio',
    name_he: 'הלב וכלי הדם',
    name_en: 'Cardiovascular system',
    insight: '==**5** ליטר בדקה, וסיבת המוות המובילה.==',
    city: 'רשת הכבישים: אספקה לכל בית, ופינוי בחזרה.',
    role: { layer: 'known', text_he: 'במנוחה הלב מזרים כ-**5** ליטר דם בדקה.', evidence: 'גבוהה', source_id: 'guyton-2020' },
    failure: [
      { layer: 'known', text_he: '**מחלת לב איסכמית** היא סיבת המוות המובילה בעולם: **16%** מכלל מקרי המוות.', evidence: 'גבוהה', source_id: 'who-ghe-2023' },
      { layer: 'said', text_he: '**גלנוס** (Galen) לימד שהדם נוצר בכבד ונצרך באיברים. ההנחה החזיקה עד **הארווי** (William Harvey), ב-**1628**.', tradition: 'רפואה יוונית-רומית', source_id: 'porter-1997' },
      { layer: 'believed', text_he: 'כוס יין ביום שומרת על הלב.', status: 'לא אוששה' },
    ],
    action: { urgency: 'emergency', sign_he: 'כאב או לחץ בחזה, שמתפשט ליד, ללסת או לגב', go_he: 'מד"א **101**, מיד', source_id: 'nhs-heart-attack', question_he: 'מה לחץ הדם שלי, ומה הוא אומר?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: 'בתזונה ים-תיכונית עשירה ב**שמן זית** נמצא שיעור נמוך יותר של אירועי לב.', evidence: 'בינונית', source_id: 'predimed-2018', next_he: 'שמן זית', link: { app: 'nutrition', food_id: 'olive-oil' } },
  },
  {
    id: 'digestive',
    name_he: 'מערכת העיכול',
    name_en: 'Digestive system',
    insight: '==בגוף יש חיידקים כמספר תאיו.==',
    city: 'הנמל והשוק: סחורה נכנסת, ממוינת ומחולקת. כמו **נמל אשדוד** (Ashdod Port).',
    role: { layer: 'known', text_he: 'בגוף חיים כ-**38** טריליון **חיידקים**, רובם במעי הגס. בערך כמספר תאי הגוף.', evidence: 'גבוהה', source_id: 'sender-2016' },
    failure: [
      { layer: 'known', text_he: '**סרטן המעי הגס** הוא השלישי בשכיחותו בעולם.', evidence: 'גבוהה', source_id: 'iarc-globocan-2022' },
      { layer: 'said', text_he: '„לא יאכל אדם אלא כשהוא רעב, ולא ישתה אלא כשהוא צמא”.', tradition: 'הרמב"ם', source_id: 'rambam-deot' },
      { layer: 'believed', text_he: 'מסטיק שנבלע נשאר בקיבה שבע שנים.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'דם בצואה, צואה שחורה, או שינוי מתמשך ביציאות', go_he: 'פנייה לרופא', source_id: 'nhs-bowel', question_he: 'האם אני בגיל או בסיכון שמתאים לבדיקת סקר למעי הגס?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: 'תזונה עשירה ב**סיבים תזונתיים** נקשרה בסיכון נמוך יותר לסרטן המעי הגס.', evidence: 'בינונית', source_id: 'reynolds-2019', next_he: 'סיבים תזונתיים', link: { app: 'nutrition', topic: 'fiber' } },
  },
  {
    id: 'skeletal',
    name_he: 'השלד והשרירים',
    name_en: 'Musculoskeletal system',
    insight: '==**206** עצמות, שמתחדשות כל החיים.==',
    city: 'שלד הבניין: קורות ועמודים שנושאים הכול, ומתחדשים בלי הפסקה.',
    role: { layer: 'known', text_he: 'בשלד של אדם בוגר **206** עצמות. העצם נבנית ומתפרקת כל הזמן.', evidence: 'גבוהה', source_id: 'gray-2020' },
    failure: [
      { layer: 'known', text_he: '**אוסטאופורוזיס** מחלישה את העצם, עד שבר בנפילה קלה.', evidence: 'גבוהה', source_id: 'iof' },
      { layer: 'said', text_he: '**גלנוס** תיאר לסת תחתונה משתי עצמות, לפי ניתוח בעלי חיים. **וסאליוס** (Andreas Vesalius) הראה ב-**1543** שבאדם זו עצם אחת.', tradition: 'רפואה יוונית-רומית', source_id: 'vesalius-1543' },
      { layer: 'believed', text_he: 'פיצוח מפרקי האצבעות גורם לדלקת מפרקים.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'נפילה עם כאב חד, נפיחות או עיוות באיבר', go_he: 'מוקד רפואי או מיון', source_id: 'nhs-fracture', question_he: 'האם בדיקת צפיפות עצם רלוונטית לי?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: '**סידן** הוא חומר הבניין העיקרי של העצם.', evidence: 'גבוהה', source_id: 'guyton-2020', next_he: 'סידן במזון', link: { app: 'nutrition', topic: 'calcium' } },
  },
  {
    id: 'immune',
    name_he: 'מערכת החיסון',
    name_en: 'Immune system',
    insight: '==זיכרון של פולשים הוא הבסיס לכל חיסון.==',
    city: 'מערך הביטחון והתברואה: מזהה, מסמן ומפנה.',
    role: { layer: 'known', text_he: 'מערכת החיסון **זוכרת** פולש שפגשה. על הזיכרון הזה נשען כל חיסון, שמונע **3.5** עד **5** מיליון מקרי מוות בשנה.', evidence: 'גבוהה', source_id: 'who-immunization' },
    failure: [
      { layer: 'known', text_he: '**אלרגיה** היא תגובה של מערכת החיסון לחומר לא מזיק, כמו אבקה או מזון.', evidence: 'גבוהה', source_id: 'janeway-2022' },
      { layer: 'said', text_he: 'תורת ה**מיאזמה**: מחלות נגרמות מ„אוויר רע”. היא שלטה עד המאה ה-**19**.', tradition: 'רפואה אירופית', source_id: 'porter-1997' },
    ],
    action: { urgency: 'emergency', sign_he: 'התנפחות בפנים או בגרון, או קושי בנשימה אחרי מזון או עקיצה', go_he: 'מד"א **101**, מיד', source_id: 'nhs-anaphylaxis', question_he: 'האם יש לי אלרגיה שכדאי לברר?' },
    bridge: { kind: 'city', layer: 'known', text_he: '**ג׳ון סנואו** (John Snow) מיפה ב-**1854** מקרי כולרה ב**לונדון** (London), ומצא אותם סביב משאבת מים אחת.', evidence: 'גבוהה', source_id: 'snow-1855', next_he: 'מפה אחת הולידה את האפידמיולוגיה', link: { app: 'city', topic: 'water' } },
  },
];

export const LAYERS = {
  known: { he: 'ידוע', def: 'ממצא מחקרי, עם מקור ועוצמת ראיה.' },
  said: { he: 'נאמר', def: 'מה שמסורת אמרה, עם מקור והקשר.' },
  believed: { he: 'מאמינים', def: 'טענה שלא נבדקה או לא אוששה.' },
};

export const EMERGENCY = [
  { he: 'מד"א', en: 'Magen David Adom', num: '101' },
  { he: 'ער"ן, עזרה נפשית ראשונה', en: 'ERAN', num: '1201' },
  { he: 'המרכז הארצי למידע בהרעלות', en: 'Israel Poison Information Center', num: '04-7771900' },
];

// ---------- Stage 1: safety layer ----------

// Red list (docs/SAFETY.md, section 4). Never shown in a regular gallery.
// organs: used only to connect the local safety profile to entries.
export const REDLIST = [
  {
    id: 'teucrium-polium',
    name_he: 'ג׳עדה',
    name_la: 'Teucrium polium',
    risk_he: '**פגיעה בכבד**, מתועדת בצמחי הסוג. דווח מקרה של **חמצת קטוטית סוכרתית** אצל מטופלת שהפסיקה אינסולין ושתתה את הצמח במקומו.',
    context_he: 'נפוצה ברפואה העממית בישראל ובמזרח התיכון, בעיקר כתה.',
    organs: ['liver'],
    sources: ['livertox-germander', 'ghassa-2024'],
    last_reviewed: '2026-11-02',
  },
  {
    id: 'aristolochia',
    name_he: 'צמחים מהסוג ספלול',
    name_la: 'Aristolochia',
    risk_he: '**נזק לכליות** (נפרופתיה) ו**סרטן בדרכי השתן**. תכשירים צמחיים שמכילים אריסטולוכיה מסווגים כמסרטנים לאדם.',
    context_he: 'הופיעו בתכשירים צמחיים ובתערובות לירידה במשקל, לעיתים בזיהוי שגוי של צמח אחר.',
    organs: ['kidney'],
    sources: ['iarc-82', 'debelle-2008'],
    last_reviewed: '2026-11-02',
  },
  {
    id: 'rasa-shastra',
    name_he: 'תכשירים איורוודיים עם מתכות',
    name_la: 'Rasa shastra',
    risk_he: '**עופרת, כספית או ארסן.** ב-**20.7%** מהתכשירים שנבדקו ברכישה ברשת נמצאו מתכות.',
    context_he: 'בתכשירי rasa shastra מוסיפים מתכות בכוונה, כחלק מהמסורת.',
    organs: [],
    sources: ['saper-2008'],
    last_reviewed: '2026-11-02',
  },
  {
    id: 'turmeric-supplements',
    name_he: 'תוספי כורכום מרוכזים',
    name_la: 'Curcuma longa, curcumin',
    risk_he: '**פגיעה בכבד.** רוב המקרים המתועדים בתוספים מרוכזים, שנבנו לספיגה גבוהה.',
    context_he: 'כורכום כתבלין במזון אינו ברשימה. ההבדל הוא הריכוז.',
    organs: ['liver'],
    sources: ['livertox-turmeric'],
    last_reviewed: '2026-11-02',
    bridge: { app: 'nutrition', food_id: 'turmeric' },
  },
];

export const REDLIST_ACTION = {
  sign_he: 'צהבת, שתן כהה, כאב בבטן העליונה או ירידה בכמות השתן, אחרי שימוש בצמח או בתוסף',
  go_he: 'פנייה לרופא, עם התכשיר ביד',
  rule_he: 'לפני כל צמח או תוסף: בדיקת אינטראקציה עם תרופות אצל **רוקח**. אין להפסיק תרופה בלי רופא.',
  source_id: 'livertox-germander',
};

// Emergency keywords (docs/SAFETY.md, sections 2 and 3). Order = priority.
// calls: ids from EMERGENCY_NUMBERS. plants:false = stop any plant talk on this screen.
export const EMERGENCY_NUMBERS = {
  mda: { he: 'מד"א', num: '101' },
  eran: { he: 'ער"ן, עזרה נפשית ראשונה', num: '1201' },
  poison: { he: 'המרכז הארצי למידע בהרעלות', num: '04-7771900' },
};

export const KEYWORDS = [
  {
    id: 'suicide',
    terms: ['מחשבות אובדניות', 'אובדנות', 'להתאבד', 'התאבדות', 'לא רוצה לחיות', 'רוצה למות', 'לשים קץ', 'לפגוע בעצמי'],
    title_he: 'לא צריך לעבור את זה לבד',
    do_he: ['ער"ן: שיחה עכשיו, בלי לחכות, **1201**.', 'בסכנה מיידית: מד"א **101**.'],
    calls: ['eran', 'mda'],
  },
  {
    id: 'child-swallow',
    terms: ['בליעה אצל ילד', 'ילד בלע', 'ילדה בלעה', 'תינוק בלע', 'תינוקת בלעה', 'בלע סוללה', 'בלעה סוללה', 'בלע תרופה', 'בלעה תרופה', 'בלע כדור'],
    title_he: 'בליעה אצל ילד',
    do_he: ['מתקשרים עכשיו: מד"א **101**, או המרכז הארצי למידע בהרעלות.', 'לא משרים להקיא.', 'שומרים את האריזה של מה שנבלע.'],
    calls: ['mda', 'poison'],
  },
  {
    id: 'poison',
    terms: ['הרעלה', 'הורעל', 'הורעלה', 'חשד להרעלה', 'רעל', 'הרעלת'],
    title_he: 'חשד להרעלה',
    do_he: ['המרכז הארצי למידע בהרעלות, כל שעות היממה.', 'קושי בנשימה, איבוד הכרה או פרכוס: מד"א **101**.', 'לא משרים להקיא.'],
    calls: ['poison', 'mda'],
  },
  {
    id: 'med-stop',
    terms: ['הפסקתי תרופה', 'הפסקתי לקחת', 'הפסקתי את התרופה', 'הפסקתי טיפול', 'הפסקתי אינסולין', 'במקום תרופה', 'במקום אינסולין', 'במקום הכדורים'],
    title_he: 'הפסקת תרופה: פונים לרופא',
    do_he: ['פונים לרופא שרשם את התרופה, או לרופא המשפחה, **עוד היום**.', 'הרגשה רעה, חולשה או בלבול: מד"א **101**.', 'כאן לא ממשיכים בשיחה על צמחים.'],
    calls: ['mda'],
    plants: false,
  },
  { id: 'chest', terms: ['כאב בחזה', 'כאבים בחזה', 'לחץ בחזה', 'התקף לב'], title_he: 'כאב או לחץ בחזה', do_he: ['מתקשרים למד"א **101** עכשיו.'], calls: ['mda'], system: 'cardio' },
  { id: 'breath', terms: ['קוצר נשימה', 'קשיי נשימה', 'קושי בנשימה', 'לא מצליח לנשום', 'לא מצליחה לנשום', 'נחנק', 'נחנקת'], title_he: 'קושי בנשימה', do_he: ['מתקשרים למד"א **101** עכשיו.'], calls: ['mda'], system: 'respiratory' },
  { id: 'swelling', terms: ['התנפחות', 'נפיחות בפנים', 'נפיחות בגרון', 'נפיחות בשפתיים', 'אנפילקסיס', 'תגובה אלרגית'], title_he: 'התנפחות בפנים או בגרון', do_he: ['מתקשרים למד"א **101** עכשיו.'], calls: ['mda'], system: 'immune' },
  { id: 'stroke', terms: ['שבץ', 'פנים שמוטות', 'חולשה ביד', 'קושי בדיבור'], title_he: 'סימני שבץ', do_he: ['מתקשרים למד"א **101** עכשיו.', 'רושמים את השעה שבה הסימנים התחילו.'], calls: ['mda'], system: 'nervous' },
];

// Local safety profile (docs/SAFETY.md, section 5). Stored only on the device.
export const PROFILE_ITEMS = [
  { id: 'pregnancy', he: 'הריון', special: true },
  { id: 'nursing', he: 'הנקה', special: true },
  { id: 'child', he: 'מדובר בילד או בילדה', special: true },
  { id: 'older', he: 'גיל מבוגר', special: true },
  { id: 'kidney', he: 'מחלת כליות', special: true, organ: 'kidney' },
  { id: 'liver', he: 'מחלת כבד', special: true, organ: 'liver' },
  { id: 'meds', he: 'תרופות קבועות' },
  { id: 'allergy', he: 'אלרגיה ידועה' },
];

// ---------- Stage 2: one system in depth (pilot: cardio) ----------
// Same layer rules as SYSTEMS. Steps form a numbered chain on the circulation diagram.
export const DEEP = {
  cardio: {
    title_he: 'מחזור הדם',
    insight: '==בעורק הריאה זורם דם דל בחמצן.==',
    insight_note: 'עורק מוגדר לפי הכיוון, מהלב החוצה. לא לפי החמצן.',
    steps: [
      { seg: 'cava', name_he: 'חזרה מהגוף', layer: 'known', text_he: 'דם דל בחמצן חוזר מהגוף דרך **הוורידים הנבובים** אל **העלייה הימנית**.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'poor' },
      { seg: 'ra-rv', name_he: 'עלייה לחדר, ימין', layer: 'known', text_he: 'הדם עובר דרך **המסתם התלת-צניפי** אל **החדר הימני**.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'poor' },
      { seg: 'pa', name_he: 'אל הריאות', layer: 'known', text_he: 'החדר הימני דוחף את הדם ב**עורק הריאה** אל הריאות.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'poor' },
      { seg: 'lungs', name_he: 'בריאות', layer: 'known', text_he: 'בנימי הריאה הדם **קולט חמצן** ופולט **פחמן דו-חמצני**.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'swap' },
      { seg: 'pv', name_he: 'חזרה ללב', layer: 'known', text_he: 'דם עשיר בחמצן חוזר ב**ורידי הריאה** אל **העלייה השמאלית**.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'rich' },
      { seg: 'la-lv', name_he: 'עלייה לחדר, שמאל', layer: 'known', text_he: 'הדם עובר דרך **המסתם הדו-צניפי** אל **החדר השמאלי**, בעל הדופן העבה בלב.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'rich' },
      { seg: 'aorta', name_he: 'אל הגוף', layer: 'known', text_he: 'החדר השמאלי דוחף את הדם ל**אאורטה**, העורק הגדול בגוף.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'rich' },
      { seg: 'body', name_he: 'ברקמות', layer: 'known', text_he: 'בנימי הגוף הדם **מוסר חמצן** לתאים, ואוסף מהם **פחמן דו-חמצני**.', evidence: 'גבוהה', source_id: 'guyton-2020', oxy: 'swap' },
    ],
    organs: [
      { name_he: 'הלב', layer: 'known', text_he: '**ארבעה** חללים ו**ארבעה** מסתמים. המסתמים מכוונים את הזרימה לכיוון אחד.', evidence: 'גבוהה', source_id: 'guyton-2020' },
      { name_he: 'הקצב', layer: 'known', text_he: 'במנוחה בערך **70** פעימות בדקה: יותר מ-**100,000** פעימות ביממה.', evidence: 'גבוהה', source_id: 'guyton-2020' },
      { name_he: 'עורקים וורידים', layer: 'known', text_he: '**עורקים** מובילים דם מהלב. **ורידים** מחזירים אותו אליו.', evidence: 'גבוהה', source_id: 'gray-2020' },
      { name_he: 'נימים', layer: 'known', text_he: 'דופן הנימים בעובי של **שכבת תאים אחת**. שם עוברים חמצן ופסולת בין הדם לתאים.', evidence: 'גבוהה', source_id: 'guyton-2020' },
      { name_he: 'הגילוי', layer: 'known', text_he: '**הארווי** חישב שהלב מזרים בשעה יותר דם ממה שהגוף יכול לייצר. מכאן הסיק: הדם חוזר, במעגל.', evidence: 'גבוהה', source_id: 'harvey-1628' },
      { name_he: 'לפני הארווי', layer: 'said', text_he: '**גלנוס** (Galen) לימד שהדם נוצר בכבד מן המזון, ונצרך באיברים.', tradition: 'רפואה יוונית-רומית', source_id: 'porter-1997' },
    ],
    diseases: [
      {
        id: 'ischemic',
        name_he: 'מחלת לב איסכמית',
        name_en: 'Ischaemic heart disease',
        insight: '==עורק חסום, ושריר הלב נשאר בלי חמצן.==',
        items: [
          { layer: 'known', text_he: 'התקף לב נגרם בעיקר מ**חסימה** שמונעת זרימת דם אל הלב.', evidence: 'גבוהה', source_id: 'who-cvd' },
          { layer: 'known', text_he: 'גורמי הסיכון ההתנהגותיים העיקריים: **תזונה לא בריאה**, **חוסר פעילות גופנית**, **עישון** ו**שתיית אלכוהול מזיקה**.', evidence: 'גבוהה', source_id: 'who-cvd' },
          { layer: 'said', text_he: '**ויליאם הברדן** (William Heberden) תיאר ב-**1768** כאב בחזה שמופיע בהליכה ונרגע במנוחה, וקרא לו אנגינה פקטוריס.', tradition: 'רפואה אנגלית', source_id: 'porter-1997' },
          { layer: 'believed', text_he: 'התקף לב מתחיל תמיד בכאב חד ביד שמאל.', status: 'לא אוששה' },
        ],
        action: { urgency: 'emergency', sign_he: 'כאב או לחץ בחזה, שמתפשט ליד, ללסת או לגב', go_he: 'מד"א **101**, מיד', source_id: 'nhs-heart-attack', question_he: 'מה גורמי הסיכון שלי ללב, ואיך בודקים אותם?' },
        bridge: { kind: 'nutrition', layer: 'known', text_he: 'בתזונה ים-תיכונית עשירה ב**שמן זית** נמצא שיעור נמוך יותר של אירועי לב.', evidence: 'בינונית', source_id: 'predimed-2018', next_he: 'שמן זית', link: { app: 'nutrition', food_id: 'olive-oil' } },
      },
      {
        id: 'hypertension',
        name_he: 'יתר לחץ דם',
        name_en: 'Hypertension',
        insight: '==**1.4** מיליארד מבוגרים, ורובם לא מרגישים דבר.==',
        items: [
          { layer: 'known', text_he: 'ב-**2024** חיו בעולם **1.4** מיליארד מבוגרים עם יתר לחץ דם. **44%** מהם לא ידעו על כך.', evidence: 'גבוהה', source_id: 'who-hypertension' },
          { layer: 'known', text_he: 'לרוב האנשים עם יתר לחץ דם **אין תסמינים**. רק מדידה מגלה אותו.', evidence: 'גבוהה', source_id: 'who-hypertension' },
          { layer: 'said', text_he: 'ברפואה הסינית **בדיקת הדופק** היא כלי מרכזי להערכת מצב הגוף.', tradition: 'רפואה סינית', source_id: 'nccih-tcm' },
          { layer: 'believed', text_he: 'כאב ראש הוא סימן אמין ללחץ דם גבוה.', status: 'לא אוששה' },
        ],
        action: { urgency: 'doctor', sign_he: 'אין סימן אמין. הדרך היחידה לדעת: מדידה', go_he: 'מדידה אצל רופא המשפחה או באחות', source_id: 'who-hypertension', question_he: 'מה לחץ הדם שלי, ומתי כדאי למדוד שוב?' },
        bridge: { kind: 'nutrition', layer: 'known', text_he: 'בניסוי **DASH-Sodium**, הפחתת **נתרן** במזון לוותה בירידה בלחץ הדם.', evidence: 'גבוהה', source_id: 'dash-2001', next_he: 'מלח ונתרן', link: { app: 'nutrition', topic: 'sodium' } },
      },
      {
        id: 'heart-failure',
        name_he: 'אי ספיקת לב',
        name_en: 'Heart failure',
        insight: '==הלב פועם, אבל לא מספיק.==',
        items: [
          { layer: 'known', text_he: 'הלב **לא מזרים מספיק דם** לצורכי הגוף. נוזלים מצטברים בריאות ובגפיים.', evidence: 'גבוהה', source_id: 'guyton-2020' },
          { layer: 'known', text_he: 'תסמינים מוכרים: **קוצר נשימה** בפעילות יומיומית או בשכיבה, **עייפות**, ו**נפיחות** בכפות הרגליים ובקרסוליים.', evidence: 'גבוהה', source_id: 'nhs-heart-failure' },
          { layer: 'believed', text_he: 'אי ספיקת לב פירושה שהלב הפסיק לפעום.', status: 'לא אוששה' },
        ],
        action: { urgency: 'emergency', sign_he: 'קושי קשה בנשימה, שפתיים או עור כחלחלים, או התעלפות', go_he: 'מד"א **101**, מיד', source_id: 'nhs-heart-failure', question_he: 'קוצר נשימה בשכיבה ונפיחות בקרסוליים: האם זה דורש בירור?' },
      },
    ],
    museum: {
      quote_he: 'התחלתי לחשוב שמא יש תנועה, כביכול, במעגל.',
      quote_en: 'I began to think whether there might not be a motion, as it were, in a circle.',
      quote_source: 'harvey-1628',
      quote_by_he: 'ויליאם הארווי (William Harvey), על תנועת הלב, 1628',
      haiku: ['דם יוצא לעיר', 'שב דרך הוורידים', 'סוגר מעגל'],
      haiku_note: 'הארווי ראה מעגל, במקום שבו אחרים ראו נהר שנגמר.',
    },
  },
};
