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
  'who-stroke': { title: 'WHO, Stroke', type: 'הנחיה רשמית', year: 2025, note: '', url: 'https://www.who.int/news-room/fact-sheets/detail/stroke' },
  'who-dementia': { title: 'WHO, Dementia', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2021', url: 'https://www.who.int/news-room/fact-sheets/detail/dementia' },
  'who-depression': { title: 'WHO, Depressive disorder', type: 'הנחיה רשמית', year: 2025, note: '', url: 'https://www.who.int/news-room/fact-sheets/detail/depression' },
  'who-asthma': { title: 'WHO, Asthma', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2023', url: 'https://www.who.int/news-room/fact-sheets/detail/asthma' },
  'who-pneumonia': { title: 'WHO, Pneumonia in children', type: 'הנחיה רשמית', year: 2022, note: 'נתוני 2019', url: 'https://www.who.int/news-room/fact-sheets/detail/pneumonia' },
  'who-lung-cancer': { title: 'WHO, Lung cancer', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2022', url: 'https://www.who.int/news-room/fact-sheets/detail/lung-cancer' },
  'who-tb': { title: 'WHO, Tuberculosis', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/tuberculosis' },
  'who-diarrhoea': { title: 'WHO, Diarrhoeal disease', type: 'הנחיה רשמית', year: 2024, note: '', url: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease' },
  'who-hepb': { title: 'WHO, Hepatitis B', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/hepatitis-b' },
  'who-diabetes': { title: 'WHO, Diabetes', type: 'הנחיה רשמית', year: 2024, note: 'נתוני 2022', url: 'https://www.who.int/news-room/fact-sheets/detail/diabetes' },
  'who-oa': { title: 'WHO, Osteoarthritis', type: 'הנחיה רשמית', year: 2023, note: 'נתוני 2019', url: 'https://www.who.int/news-room/fact-sheets/detail/osteoarthritis' },
  'who-lbp': { title: 'WHO, Low back pain', type: 'הנחיה רשמית', year: 2023, note: 'נתוני 2020', url: 'https://www.who.int/news-room/fact-sheets/detail/low-back-pain' },
  'who-hiv': { title: 'WHO, HIV and AIDS', type: 'הנחיה רשמית', year: 2026, note: 'נתוני 2025', url: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids' },
  'who-crc': { title: 'WHO, Colorectal cancer', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2022', url: 'https://www.who.int/news-room/fact-sheets/detail/colorectal-cancer' },
  'nhs-asthma': { title: 'NHS, Asthma attack', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/asthma/asthma-attack/' },
  'nhs-pneumonia': { title: 'NHS, Pneumonia', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/pneumonia/' },
  'nhs-lung-cancer': { title: 'NHS, Lung cancer: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/lung-cancer/symptoms/' },
  'nhs-diabetes': { title: 'NHS, Diabetes', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/diabetes/' },
  'nhs-back-pain': { title: 'NHS, Back pain', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/back-pain/' },
  'nhs-pep': { title: 'NHS, Post-exposure prophylaxis (PEP)', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/post-exposure-prophylaxis/' },
  'who-breast': { title: 'WHO, Breast cancer', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/breast-cancer' },
  'who-cancer': { title: 'WHO, Cancer', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/cancer' },
  'who-cervical': { title: 'WHO, Cervical cancer', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/cervical-cancer' },
  'who-obesity': { title: 'WHO, Obesity and overweight', type: 'הנחיה רשמית', year: 2025, note: 'נתוני 2024', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight' },
  'nhs-prostate': { title: 'NHS, Prostate cancer', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/prostate-cancer/' },
  'nhs-prostate-symptoms': { title: 'NHS, Prostate cancer: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/prostate-cancer/symptoms/' },
  'nhs-breast': { title: 'NHS, Symptoms of breast cancer in women', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/breast-cancer-in-women/symptoms-of-breast-cancer-in-women/' },
  'nhs-cervical': { title: 'NHS, Cervical cancer: symptoms', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.nhs.uk/conditions/cervical-cancer/symptoms/' },
  'who-smallpox': { title: 'WHO, Smallpox', type: 'מידע רשמי', year: 2024, note: '', url: 'https://www.who.int/health-topics/smallpox' },
  'bavli-shabbat-31a': { title: 'תלמוד בבלי, מסכת שבת לא, ע"א', type: 'מסורת', year: 500, note: 'הלל הזקן', url: 'https://www.sefaria.org.il/Shabbat.31a' },
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
  {
    id: 'reproductive',
    name_he: 'מערכת הרבייה והשד',
    short_he: 'מערכת הרבייה',
    name_en: 'Reproductive system and breast',
    insight: '==בשד ובאגן: שלושה מהסרטנים השכיחים.==',
    city: 'מערך ההתחדשות של העיר: דור אחד מכין את הבא.',
    role: { layer: 'known', text_he: 'מערכת הרבייה יוצרת **תאי רבייה** ו**הורמוני מין**. **השד** הוא בלוטה שמייצרת חלב.', evidence: 'גבוהה', source_id: 'guyton-2020' },
    failure: [
      { layer: 'known', text_he: '**סרטן השד** הוא הסרטן השכיח בנשים ב-**164** מתוך **186** מדינות.', evidence: 'גבוהה', source_id: 'who-breast' },
      { layer: 'known', text_he: 'כמעט כל מקרי **סרטן צוואר הרחם** נגרמים מנגיף **HPV**, ויש נגדו חיסון.', evidence: 'גבוהה', source_id: 'who-cervical' },
    ],
    action: { urgency: 'doctor', sign_he: 'גוש או נפיחות בשד, בחזה או בבית השחי, או שינוי בעור או בפטמה', go_he: 'פנייה לרופא', source_id: 'nhs-breast', question_he: 'אילו בדיקות סקר מתאימות לגילי?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: '**שתיית אלכוהול** היא גורם סיכון מוכר לסרטן השד.', evidence: 'גבוהה', source_id: 'who-breast', next_he: 'אלכוהול', link: { app: 'nutrition', topic: 'alcohol' } },
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
    context_he: 'הופיעו בתכשירים ובתערובות צמחיות, לעיתים בזיהוי שגוי של צמח אחר.',
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

// ---------- Stage 4: twenty diseases, one source for all ----------
// Leading causes of death and disability (WHO). Cardio's three live in DEEP and are referenced here.
// No body weight anywhere: not as a risk factor, not as a symptom (SAFETY.md, section 1).
const MORE_DISEASES = [
  { id: 'stroke', system: 'nervous', name_he: 'שבץ', name_en: 'Stroke', insight: '==כל דקה חשובה: שבץ הוא מצב חירום.==',
    items: [
      { layer: 'known', text_he: 'שבץ קורה כש**זרימת הדם למוח נקטעת**: בגלל קריש שחוסם כלי דם, או כלי דם שנקרע.', evidence: 'גבוהה', source_id: 'who-stroke' },
      { layer: 'known', text_he: 'גורם הסיכון המוביל: **יתר לחץ דם**. רוב הנטל נובע מגורמי סיכון שאפשר לשנות.', evidence: 'גבוהה', source_id: 'who-stroke' },
      { layer: 'said', text_he: '**היפוקרטס** (Hippocrates) תיאר "אפופלקסיה": אדם שנופל לפתע, כמו מוכה.', tradition: 'רפואה יוונית', source_id: 'porter-1997' },
    ],
    action: { urgency: 'emergency', sign_he: 'פנים שמוטות, חולשה ביד או קושי בדיבור', go_he: 'מד"א **101**, מיד', source_id: 'nhs-stroke', question_he: 'מה לחץ הדם שלי, ומה הוא אומר על הסיכון לשבץ?' } },
  { id: 'dementia', system: 'nervous', name_he: 'דמנציה', name_en: 'Dementia', insight: '==**57** מיליון אנשים, ואלצהיימר ברוב המקרים.==',
    items: [
      { layer: 'known', text_he: 'ב-**2021** חיו בעולם **57** מיליון אנשים עם דמנציה. היא סיבת המוות ה**חמישית** בעולם.', evidence: 'גבוהה', source_id: 'who-dementia' },
      { layer: 'known', text_he: '**אלצהיימר** היא הצורה השכיחה, ואולי **60%** עד **70%** מהמקרים. יתר לחץ דם, סוכרת, עישון ושתייה מרובה מעלים את הסיכון.', evidence: 'גבוהה', source_id: 'who-dementia' },
      { layer: 'believed', text_he: 'דמנציה היא חלק טבעי ובלתי נמנע מהזקנה.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'שכחה שמחמירה ומשבשת את היום-יום, או בלבול חדש', go_he: 'פנייה לרופא המשפחה', source_id: 'who-dementia', question_he: 'האם השינויים בזיכרון דורשים בירור?' } },
  { id: 'depression', system: 'nervous', name_he: 'דיכאון', name_en: 'Depression', insight: '==שכיח, יש לו טיפול, ואינו חולשת אופי.==',
    items: [
      { layer: 'known', text_he: 'כ-**5.2%** מהמבוגרים בעולם חיים עם דיכאון.', evidence: 'גבוהה', source_id: 'who-depression' },
      { layer: 'known', text_he: 'יש **טיפול יעיל** לדיכאון קל, בינוני וחמור. דיכאון עלול להוביל ל**התאבדות**.', evidence: 'גבוהה', source_id: 'who-depression' },
      { layer: 'said', text_he: '**היפוקרטס** קרא לעצבות ממושכת "מלנכוליה": עודף של **מרה שחורה**.', tradition: 'רפואה יוונית', source_id: 'porter-1997' },
      { layer: 'believed', text_he: 'דיכאון הוא חולשה של אופי, ואפשר פשוט "להתגבר".', status: 'לא אוששה' },
    ],
    action: { urgency: 'emergency', sign_he: 'מחשבות על פגיעה עצמית או על מוות', go_he: 'ער"ן **1201**. בסכנה מיידית: מד"א **101**', source_id: 'who-depression', question_he: 'אילו דרכי טיפול מתאימות לי?' } },
  { id: 'copd', system: 'respiratory', name_he: 'מחלת ריאות חסימתית כרונית', name_en: 'COPD', insight: '==סיבת המוות השלישית, ונשימה שנסגרת לאט.==',
    items: [
      { layer: 'known', text_he: 'היא סיבת המוות ה**שלישית** בעולם: **3.4** מיליון מקרי מוות ב-**2023**.', evidence: 'גבוהה', source_id: 'who-copd' },
    ],
    action: { urgency: 'emergency', sign_he: 'קוצר נשימה פתאומי או קשה', go_he: 'מד"א **101**, מיד', source_id: 'nhs-breath', question_he: 'האם בדיקת תפקודי ריאות רלוונטית לי?' },
    bridge: { kind: 'city', layer: 'known', text_he: '**זיהום אוויר** הוא גורם סיכון מוכר למחלות נשימה.', evidence: 'גבוהה', source_id: 'who-aqg-2021', next_he: 'איכות האוויר ברחוב שלי', link: { app: 'city', topic: 'air-quality' } } },
  { id: 'asthma', system: 'respiratory', name_he: 'אסתמה', name_en: 'Asthma', insight: '==**363** מיליון אנשים, ואפשר לשלוט בתסמינים.==',
    items: [
      { layer: 'known', text_he: 'ב-**2023** חיו עם אסתמה כ-**363** מיליון אנשים. היא אינה נרפאת, אבל אפשר לשלוט בה.', evidence: 'גבוהה', source_id: 'who-asthma' },
      { layer: 'known', text_he: 'גורמים מעוררים: **אבק**, **עשן**, **אבקת צמחים**, פרוות בעלי חיים, ובשמים חזקים.', evidence: 'גבוהה', source_id: 'who-asthma' },
      { layer: 'believed', text_he: 'אסתמה עוברת תמיד עם הגיל.', status: 'לא אוששה' },
    ],
    action: { urgency: 'emergency', sign_he: 'התקף שלא נרגע, או קושי לומר משפט שלם', go_he: 'מד"א **101**, מיד', source_id: 'nhs-asthma', question_he: 'מה הגורמים המעוררים אצלי, ואיך מזהים התקף?' } },
  { id: 'pneumonia', system: 'respiratory', name_he: 'דלקת ריאות', name_en: 'Pneumonia', insight: '==נאדיות הריאה מתמלאות במוגלה ובנוזל.==',
    items: [
      { layer: 'known', text_he: 'בדלקת ריאות **הנאדיות מתמלאות במוגלה ובנוזל**, והנשימה כואבת ומוגבלת.', evidence: 'גבוהה', source_id: 'who-pneumonia' },
      { layer: 'known', text_he: 'ב-**2019** מתו ממנה **740,180** ילדים מתחת לגיל **5**. **חיסונים** הם הדרך היעילה ביותר למנוע אותה.', evidence: 'גבוהה', source_id: 'who-pneumonia' },
    ],
    action: { urgency: 'emergency', sign_he: 'קושי קשה בנשימה, שפתיים כחלחלות או בלבול', go_he: 'מד"א **101**, מיד', source_id: 'nhs-pneumonia', question_he: 'אילו חיסונים מתאימים לי ולמשפחה שלי?' } },
  { id: 'lung-cancer', system: 'respiratory', name_he: 'סרטן ריאה', name_en: 'Lung cancer', insight: '==הסרטן הקטלני בעולם, ורובו מעישון.==',
    items: [
      { layer: 'known', text_he: 'הגורם המוביל למקרי סרטן ולמוות מסרטן בעולם: **2.5** מיליון מקרים חדשים ו-**1.8** מיליון מקרי מוות ב-**2022**.', evidence: 'גבוהה', source_id: 'who-lung-cancer' },
      { layer: 'known', text_he: '**60%** עד **70%** מהמקרים מיוחסים ל**עישון**. גם זיהום אוויר וגז **ראדון** מעלים את הסיכון.', evidence: 'גבוהה', source_id: 'who-lung-cancer' },
    ],
    action: { urgency: 'doctor', sign_he: 'שיעול שנמשך יותר משלושה שבועות, או דם בשיעול', go_he: 'פנייה לרופא', source_id: 'nhs-lung-cancer', question_he: 'האם אני בסיכון שמצדיק בירור ריאות?' } },
  { id: 'tuberculosis', system: 'respiratory', name_he: 'שחפת', name_en: 'Tuberculosis', insight: '==עוברת באוויר, וניתנת למניעה ולריפוי.==',
    items: [
      { layer: 'known', text_he: 'ב-**2024** חלו בשחפת **10.7** מיליון אנשים, ו-**1.23** מיליון מתו ממנה.', evidence: 'גבוהה', source_id: 'who-tb' },
      { layer: 'known', text_he: 'היא **עוברת באוויר** כשחולה משתעל או מתעטש. היא **ניתנת למניעה ולריפוי**.', evidence: 'גבוהה', source_id: 'who-tb' },
      { layer: 'said', text_he: 'במאה ה-**19** כונתה "צרכת", ונקשרה ברומנטיקה במשוררים ובאמנים.', tradition: 'תרבות אירופית', source_id: 'porter-1997' },
    ],
    action: { urgency: 'doctor', sign_he: 'שיעול ממושך, לפעמים עם דם, חום והזעות לילה', go_he: 'פנייה לרופא', source_id: 'who-tb', question_he: 'האם כדאי לבדוק שחפת אחרי חשיפה?' } },
  { id: 'colorectal-cancer', system: 'digestive', name_he: 'סרטן המעי הגס', name_en: 'Colorectal cancer', insight: '==בדיקת סקר מגלה מוקדם, ומצילה חיים.==',
    items: [
      { layer: 'known', text_he: 'הסרטן ה**שלישי** בשכיחותו וה**שני** בתמותה מסרטן. ב-**2022**: **1.9** מיליון מקרים חדשים.', evidence: 'גבוהה', source_id: 'who-crc' },
      { layer: 'known', text_he: '**בדיקת סקר** סדירה היא הדרך היעילה לגילוי מוקדם, ומפחיתה תחלואה ותמותה.', evidence: 'גבוהה', source_id: 'who-crc' },
    ],
    action: { urgency: 'doctor', sign_he: 'דם בצואה, צואה שחורה, או שינוי מתמשך ביציאות', go_he: 'פנייה לרופא', source_id: 'nhs-bowel', question_he: 'האם אני בגיל או בסיכון שמתאים לבדיקת סקר?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: 'תזונה עשירה ב**סיבים תזונתיים** נקשרה בסיכון נמוך יותר לסרטן המעי הגס.', evidence: 'בינונית', source_id: 'reynolds-2019', next_he: 'סיבים תזונתיים', link: { app: 'nutrition', topic: 'fiber' } } },
  { id: 'diarrhoeal', system: 'digestive', name_he: 'מחלות שלשול', name_en: 'Diarrhoeal disease', insight: '==מים נקיים ותברואה מונעים את רובן.==',
    items: [
      { layer: 'known', text_he: 'סיבת המוות ה**שלישית** בילדים מתחת לגיל **5**: כ-**443,832** ילדים בשנה.', evidence: 'גבוהה', source_id: 'who-diarrhoea' },
      { layer: 'known', text_he: 'אפשר למנוע אותן ב**מי שתייה בטוחים**, **תברואה** ו**היגיינה**.', evidence: 'גבוהה', source_id: 'who-diarrhoea' },
    ],
    action: { urgency: 'doctor', sign_he: 'סימני התייבשות, דם בצואה, או תינוק שאינו שותה', go_he: 'פנייה לרופא. בתינוק: מיד', source_id: 'who-diarrhoea', question_he: 'איך מזהים התייבשות אצל ילד?' },
    bridge: { kind: 'city', layer: 'known', text_he: '**ג׳ון סנואו** (John Snow) מיפה ב-**1854** מקרי כולרה ב**לונדון** (London), ומצא אותם סביב משאבת מים אחת.', evidence: 'גבוהה', source_id: 'snow-1855', next_he: 'מים ותברואה בעיר', link: { app: 'city', topic: 'water' } } },
  { id: 'hepatitis', system: 'digestive', name_he: 'דלקת כבד נגיפית B', name_en: 'Hepatitis B', insight: '==**240** מיליון נשאים, ויש חיסון.==',
    items: [
      { layer: 'known', text_he: 'ב-**2024** חיו **240** מיליון אנשים עם הפטיטיס B כרונית, ו-**1.1** מיליון מתו ממנה.', evidence: 'גבוהה', source_id: 'who-hepb' },
      { layer: 'known', text_he: 'יש **חיסון בטוח ויעיל**. בלי טיפול, הזיהום הכרוני מעלה סיכון ל**שחמת** ול**סרטן כבד**.', evidence: 'גבוהה', source_id: 'who-hepb' },
    ],
    action: { urgency: 'doctor', sign_he: 'הצהבה של העור או העיניים, ושתן כהה', go_he: 'פנייה לרופא', source_id: 'who-hepb', question_he: 'האם קיבלתי חיסון להפטיטיס B?' } },
  { id: 'diabetes', system: 'digestive', name_he: 'סוכרת', name_en: 'Diabetes', insight: '==**14%** מהמבוגרים, ויותר מ-**95%** מסוג 2.==',
    items: [
      { layer: 'known', text_he: 'ב-**2022** חיו עם סוכרת **14%** מהמבוגרים בעולם, פי שניים מ-**1990**.', evidence: 'גבוהה', source_id: 'who-diabetes' },
      { layer: 'known', text_he: 'סוכרת מופיעה כש**הלבלב** לא מייצר מספיק **אינסולין**, או כשהגוף לא מנצל אותו היטב. יותר מ-**95%** מהחולים הם מסוג 2.', evidence: 'גבוהה', source_id: 'who-diabetes' },
      { layer: 'known', text_he: 'סיבוכים: **עיוורון**, **אי ספיקת כליות**, התקפי לב, שבץ וקטיעת גפיים.', evidence: 'גבוהה', source_id: 'who-diabetes' },
      { layer: 'said', text_he: 'השם הלטיני **mellitus** פירושו "מתוק כדבש": רופאים זיהו שתן מתוק כבר לפני מאות שנים.', tradition: 'היסטוריה של הרפואה', source_id: 'porter-1997' },
    ],
    action: { urgency: 'doctor', sign_he: 'צמא רב, השתנה תכופה, עייפות או ראייה מטושטשת', go_he: 'פנייה לרופא, לבדיקת סוכר', source_id: 'nhs-diabetes', question_he: 'האם כדאי לי לבדוק רמת סוכר בדם?' } },
  { id: 'osteoporosis', system: 'skeletal', name_he: 'אוסטאופורוזיס', name_en: 'Osteoporosis', insight: '==עצם שנחלשת בשקט, עד השבר.==',
    items: [
      { layer: 'known', text_he: '**אוסטאופורוזיס** מחלישה את העצם, עד שבר בנפילה קלה.', evidence: 'גבוהה', source_id: 'iof' },
      { layer: 'known', text_he: 'העצם **נבנית ומתפרקת כל החיים**. כשהפירוק גובר על הבנייה, היא נחלשת.', evidence: 'גבוהה', source_id: 'gray-2020' },
    ],
    action: { urgency: 'doctor', sign_he: 'נפילה עם כאב חד, נפיחות או עיוות באיבר', go_he: 'מוקד רפואי או מיון', source_id: 'nhs-fracture', question_he: 'האם בדיקת צפיפות עצם רלוונטית לי?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: '**סידן** הוא חומר הבניין העיקרי של העצם.', evidence: 'גבוהה', source_id: 'guyton-2020', next_he: 'סידן במזון', link: { app: 'nutrition', topic: 'calcium' } } },
  { id: 'osteoarthritis', system: 'skeletal', name_he: 'שחיקת מפרקים', name_en: 'Osteoarthritis', insight: '==**528** מיליון אנשים, והברך בראש.==',
    items: [
      { layer: 'known', text_he: 'ב-**2019** חיו כ-**528** מיליון אנשים עם שחיקת מפרקים. **הברך** הכי שכיחה, אחריה הירך וכף היד.', evidence: 'גבוהה', source_id: 'who-oa' },
      { layer: 'known', text_he: 'גורמי סיכון: **פציעה במפרק** או עומס חוזר, **גיל**, תורשה, וסוכרת.', evidence: 'גבוהה', source_id: 'who-oa' },
    ],
    action: { urgency: 'doctor', sign_he: 'כאב ונוקשות במפרק שמגבילים את היום-יום', go_he: 'פנייה לרופא המשפחה', source_id: 'who-oa', question_he: 'איזו פעילות מתאימה למפרקים שלי?' } },
  { id: 'low-back-pain', system: 'skeletal', name_he: 'כאב גב תחתון', name_en: 'Low back pain', insight: '==הסיבה המובילה לנכות בעולם.==',
    items: [
      { layer: 'known', text_he: 'ב-**2020** סבלו מכאב גב תחתון **619** מיליון אנשים. זו **הסיבה המובילה לנכות** בעולם.', evidence: 'גבוהה', source_id: 'who-lbp' },
      { layer: 'known', text_he: 'בכ-**90%** מהמקרים אין לכאב סיבה ספציפית אחת.', evidence: 'גבוהה', source_id: 'who-lbp' },
      { layer: 'believed', text_he: 'כאב גב מעיד תמיד על בעיה חמורה בעמוד השדרה.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'כאב גב עם חולשה או תחושה מופחתת ברגליים, או שינוי בשליטה על שתן וצואה', go_he: 'מיון, מיד', source_id: 'nhs-back-pain', question_he: 'מה יכול לעזור לי לחזור לתנועה?' } },
  { id: 'hiv', system: 'immune', name_he: 'HIV', name_en: 'HIV', insight: '==אין ריפוי, ויש חיים ארוכים עם טיפול.==',
    items: [
      { layer: 'known', text_he: 'בסוף **2025** חיו בעולם כ-**41** מיליון אנשים עם HIV.', evidence: 'גבוהה', source_id: 'who-hiv' },
      { layer: 'known', text_he: 'אין ריפוי, אבל עם אבחון וטיפול HIV הפך ל**מצב כרוני שאפשר לנהל**. הנגיף עובר בנוזלי גוף: **דם**, **זרע**, **הפרשות נרתיק** ו**חלב אם**.', evidence: 'גבוהה', source_id: 'who-hiv' },
      { layer: 'believed', text_he: 'HIV עובר במגע יומיומי, כמו חיבוק או כלים משותפים.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'חשיפה אפשרית לנגיף', go_he: 'פנייה **באותו יום** לרופא או למיון', source_id: 'nhs-pep', question_he: 'איך ומתי נבדקים ל-HIV?' } },
  { id: 'allergy', system: 'immune', name_he: 'אלרגיה ואנפילקסיס', name_en: 'Allergy and anaphylaxis', insight: '==מערכת ההגנה מגיבה למה שלא מזיק.==',
    items: [
      { layer: 'known', text_he: '**אלרגיה** היא תגובה של מערכת החיסון לחומר לא מזיק, כמו אבקה או מזון.', evidence: 'גבוהה', source_id: 'janeway-2022' },
      { layer: 'known', text_he: '**אנפילקסיס** היא תגובה אלרגית קשה ומהירה, ומצב חירום.', evidence: 'גבוהה', source_id: 'nhs-anaphylaxis' },
    ],
    action: { urgency: 'emergency', sign_he: 'התנפחות בפנים או בגרון, או קושי בנשימה אחרי מזון או עקיצה', go_he: 'מד"א **101**, מיד', source_id: 'nhs-anaphylaxis', question_he: 'האם יש לי אלרגיה שכדאי לברר?' } },
];

export const DISEASES = [...DEEP.cardio.diseases.map((d) => ({ ...d, system: 'cardio' })), ...MORE_DISEASES];

// ---------- Stage 4b: cancer as a group, and obesity (Anat, 02.11.2026) ----------
// Obesity is taught at population level only: no body measurements, no targets, no counting.
const STAGE4B = [
  { id: 'breast-cancer', system: 'reproductive', name_he: 'סרטן השד', name_en: 'Breast cancer', insight: '==שכיח בנשים, ולרוב בלי גורם סיכון מיוחד.==',
    items: [
      { layer: 'known', text_he: 'ב-**2024** אובחנו בעולם **2.4** מיליון נשים עם סרטן השד.', evidence: 'גבוהה', source_id: 'who-breast' },
      { layer: 'known', text_he: 'כ-**80%** ממקרי סרטן השד מופיעים בנשים **בלי גורם סיכון מיוחד** מלבד מין וגיל.', evidence: 'גבוהה', source_id: 'who-breast' },
      { layer: 'known', text_he: '**גילוי וטיפול מוקדמים** מפחיתים תמותה.', evidence: 'גבוהה', source_id: 'who-breast' },
      { layer: 'known', text_he: 'גורמים שמעלים את הסיכון: **גיל**, היסטוריה משפחתית, **השמנה**, **שתיית אלכוהול** ועישון. גורם סיכון אינו סיבה, ואינו אשמה.', evidence: 'גבוהה', source_id: 'who-breast' },
    ],
    action: { urgency: 'doctor', sign_he: 'גוש או נפיחות בשד, בחזה או בבית השחי, או שינוי בעור או בפטמה', go_he: 'פנייה לרופא', source_id: 'nhs-breast', question_he: 'מתי מתאימה לי בדיקת ממוגרפיה?' },
    bridge: { kind: 'nutrition', layer: 'known', text_he: '**שתיית אלכוהול** היא גורם סיכון מוכר לסרטן השד.', evidence: 'גבוהה', source_id: 'who-breast', next_he: 'אלכוהול', link: { app: 'nutrition', topic: 'alcohol' } } },
  { id: 'prostate-cancer', system: 'reproductive', name_he: 'סרטן הערמונית', name_en: 'Prostate cancer', insight: '==הרביעי בשכיחותו, ובגילוי מוקדם לרוב בר-ריפוי.==',
    items: [
      { layer: 'known', text_he: 'ב-**2024**: כ-**1.5** מיליון מקרים חדשים. הסרטן ה**רביעי** בשכיחותו בעולם.', evidence: 'גבוהה', source_id: 'who-cancer' },
      { layer: 'known', text_he: 'מופיע לרוב בגברים מעל גיל **50**. בגילוי מוקדם, לעיתים קרובות אפשר לרפא אותו.', evidence: 'גבוהה', source_id: 'nhs-prostate' },
      { layer: 'known', text_he: 'שינויים בהטלת שתן נובעים לעיתים קרובות מ**הגדלה שפירה** של הערמונית, שהיא שכיחה ואינה סרטן.', evidence: 'גבוהה', source_id: 'nhs-prostate-symptoms' },
    ],
    action: { urgency: 'doctor', sign_he: 'קושי להתחיל להטיל שתן, זרם חלש, או צורך תכוף, גם בלילה', go_he: 'פנייה לרופא', source_id: 'nhs-prostate-symptoms', question_he: 'האם בדיקת ערמונית רלוונטית לגיל ולמשפחה שלי?' } },
  { id: 'cervical-cancer', system: 'reproductive', name_he: 'סרטן צוואר הרחם', name_en: 'Cervical cancer', insight: '==כמעט כולו מנגיף, ויש חיסון.==',
    items: [
      { layer: 'known', text_he: 'הסרטן ה**חמישי** בשכיחותו בנשים: **604,000** מקרים חדשים ב-**2024**.', evidence: 'גבוהה', source_id: 'who-cervical' },
      { layer: 'known', text_he: 'כמעט כל המקרים נגרמים מזיהום בזנים מסוימים של נגיף **HPV**.', evidence: 'גבוהה', source_id: 'who-cervical' },
      { layer: 'known', text_he: '**חיסון HPV** מומלץ לבנות בגילי **9** עד **14**. **בדיקת סקר** מגיל **30**, כל **5** עד **10** שנים.', evidence: 'גבוהה', source_id: 'who-cervical' },
    ],
    action: { urgency: 'doctor', sign_he: 'דימום חריג מהנרתיק: בזמן יחסי מין או אחריהם, בין וסתות, או אחרי גיל המעבר', go_he: 'פנייה לרופא', source_id: 'nhs-cervical', question_he: 'מתי בדיקת הסקר הבאה שלי?' } },
  { id: 'obesity', system: 'digestive', name_he: 'השמנה', name_en: 'Obesity', insight: '==מחלה כרונית, שהסביבה שותפה לה.==',
    items: [
      { layer: 'known', text_he: 'השמנה היא **מחלה כרונית**, שנוצרת ממפגש של גורמים **סביבתיים**, **נפשיים וחברתיים**, ו**ביולוגיים**.', evidence: 'גבוהה', source_id: 'who-obesity' },
      { layer: 'known', text_he: 'ב-**2024** חיו עם השמנה כ-**1.1** מיליארד אנשים: בערך **אחד מכל שבעה**.', evidence: 'גבוהה', source_id: 'who-obesity' },
      { layer: 'known', text_he: 'השמנה תורמת ל**סוכרת מסוג 2**, ל**מחלות לב** ולכמה **סוגי סרטן**, ביניהם סרטן השד.', evidence: 'גבוהה', source_id: 'who-obesity' },
      { layer: 'known', text_he: 'סביבה ש**מגבילה גישה למזון בריא** ול**תנועה** מגדילה את הסיכון. לכן זו אחריות של החברה, לא רק של היחיד.', evidence: 'גבוהה', source_id: 'who-obesity' },
      { layer: 'believed', text_he: 'השמנה היא רק עניין של כוח רצון.', status: 'לא אוששה' },
    ],
    action: { urgency: 'doctor', sign_he: 'שינוי בגוף שמדאיג, או מחשבות מכאיבות על אוכל ועל הגוף', go_he: 'פנייה לרופא המשפחה. במצוקה: ער"ן **1201**', source_id: 'who-obesity', question_he: 'איזו דרך מתאימה לבריאות שלי, לאורך זמן?' },
    bridge: { kind: 'city', layer: 'known', text_he: 'WHO קורא לפעולה ב**תכנון עירוני**, במערכות המזון ובמדיניות. עיר שמזמינה הליכה ומזון טרי היא חלק מהטיפול באוכלוסייה.', evidence: 'גבוהה', source_id: 'who-obesity', next_he: 'עיר שמזמינה תנועה', link: { app: 'city', topic: 'active-city' } } },
];
DISEASES.push(...STAGE4B);

// Groups cut across systems. Cancer: overview first, then its cards.
export const GROUPS = {
  cancer: {
    name_he: 'סרטן',
    ids: ['breast-cancer', 'lung-cancer', 'colorectal-cancer', 'prostate-cancer', 'cervical-cancer'],
    insight: '==כמעט **10** מיליון מקרי מוות, ו-**38%** אפשר למנוע.==',
    items: [
      { layer: 'known', text_he: 'סרטן הוא סיבת מוות מובילה בעולם: כמעט **10** מיליון מקרי מוות ב-**2024**, בערך **אחד מכל שישה**.', evidence: 'גבוהה', source_id: 'who-cancer' },
      { layer: 'known', text_he: 'השכיחים ב-**2024**: **ריאה**, **שד**, **מעי גס** ו**ערמונית**.', evidence: 'גבוהה', source_id: 'who-cancer' },
      { layer: 'known', text_he: 'כ-**38%** ממקרי הסרטן אפשר למנוע כבר היום, בהימנעות מגורמי סיכון כמו **עישון** ו**אלכוהול**.', evidence: 'גבוהה', source_id: 'who-cancer' },
    ],
  },
};

// ---------- Stage 5: a timeline of medicine on a map, and four traditions ----------
// Places: Hebrew name bold, Latin name small (anat-design-language 2.3). Ordered by year: a numbered chain.
export const TIMELINE = [
  { id: 'hippocrates', cc: 'gr', year: -400, year_he: 'כ-400 לפנה"ס', person_he: 'היפוקרטס', person_en: 'Hippocrates', place_he: 'קוס', place_en: 'Kos', lat: 36.89, lon: 27.29,
    layer: 'said', text_he: 'מחלה היא תופעה טבעית, ולא עונש של האלים. הבריאות היא **איזון של ארבע ליחות**.', tradition: 'רפואה יוונית', source_id: 'porter-1997', system: 'immune' },
  { id: 'galen', cc: 'it', year: 170, year_he: 'כ-170', person_he: 'גלנוס', person_en: 'Galen', place_he: 'רומא', place_en: 'Rome', lat: 41.9, lon: 12.5,
    layer: 'said', text_he: 'הדם נוצר **בכבד** מן המזון, ונצרך באיברים. התורה הזאת החזיקה כ-1,400 שנה.', tradition: 'רפואה יוונית-רומית', source_id: 'porter-1997', system: 'cardio' },
  { id: 'avicenna', cc: 'ir', year: 1025, year_he: '1025', person_he: 'אבן סינא', person_en: 'Avicenna (Ibn Sina)', place_he: 'המדאן', place_en: 'Hamadan', lat: 34.8, lon: 48.5,
    layer: 'known', text_he: '**הקאנון ברפואה** שלו היה ספר לימוד מרכזי באוניברסיטאות של אירופה במשך מאות שנים.', evidence: 'גבוהה', source_id: 'porter-1997' },
  { id: 'rambam', cc: 'eg', year: 1180, year_he: 'כ-1180', person_he: 'הרמב"ם', person_en: 'Maimonides', place_he: 'פוסטאט', place_en: 'Fustat (Cairo)', lat: 30.0, lon: 31.23,
    layer: 'said', text_he: '„לא יאכל אדם אלא כשהוא רעב, ולא ישתה אלא כשהוא צמא”: הבריאות כדרך חיים מאוזנת.', tradition: 'הרמב"ם', source_id: 'rambam-deot', system: 'digestive' },
  { id: 'vesalius', cc: 'it', image: 'vesalius-fabrica', year: 1543, year_he: '1543', person_he: 'וסאליוס', person_en: 'Andreas Vesalius', place_he: 'פדובה', place_en: 'Padua', lat: 45.41, lon: 11.88,
    layer: 'known', text_he: 'אטלס אנטומי מנתיחה של **גוף האדם**, שתיקן טעויות של גלנוס. ההשראה של האפליקציה הזו.', evidence: 'גבוהה', source_id: 'vesalius-1543', system: 'skeletal' },
  { id: 'harvey', cc: 'gb', image: 'harvey-veins', year: 1628, year_he: '1628', person_he: 'הארווי', person_en: 'William Harvey', place_he: 'לונדון', place_en: 'London', lat: 51.51, lon: -0.13,
    layer: 'known', text_he: 'הדם **מסתובב במעגל**: הלב מזרים בשעה יותר דם ממה שהגוף יכול לייצר.', evidence: 'גבוהה', source_id: 'harvey-1628', system: 'cardio', deep: true },
  { id: 'jenner', cc: 'gb', year: 1796, year_he: '1796', person_he: 'ג׳נר', person_en: 'Edward Jenner', place_he: 'ברקלי', place_en: 'Berkeley', lat: 51.69, lon: -2.46,
    layer: 'known', text_he: 'החיסון הראשון: חשיפה ל**אבעבועות הבקר** הגנה מפני **אבעבועות שחורות**.', evidence: 'גבוהה', source_id: 'porter-1997', system: 'immune' },
  { id: 'semmelweis', cc: 'at', year: 1847, year_he: '1847', person_he: 'זמלווייס', person_en: 'Ignaz Semmelweis', place_he: 'וינה', place_en: 'Vienna', lat: 48.21, lon: 16.37,
    layer: 'known', text_he: '**שטיפת ידיים** של רופאים הורידה את התמותה מקדחת לידה. עמיתיו דחו אותו.', evidence: 'גבוהה', source_id: 'porter-1997', system: 'immune' },
  { id: 'snow', cc: 'gb', image: 'snow-cholera-map', year: 1854, year_he: '1854', person_he: 'ג׳ון סנואו', person_en: 'John Snow', place_he: 'לונדון', place_en: 'London', lat: 51.51, lon: -0.14,
    layer: 'known', text_he: 'מפה של מקרי **כולרה** הובילה למשאבת מים אחת. ידית המשאבה הוסרה, והאפידמיולוגיה נולדה.', evidence: 'גבוהה', source_id: 'snow-1855', disease: 'diarrhoeal' },
  { id: 'koch', cc: 'de', year: 1882, year_he: '1882', person_he: 'קוך', person_en: 'Robert Koch', place_he: 'ברלין', place_en: 'Berlin', lat: 52.52, lon: 13.4,
    layer: 'known', text_he: 'זיהוי **החיידק שגורם לשחפת**. תורת החיידקים מחליפה את תורת המיאזמה.', evidence: 'גבוהה', source_id: 'porter-1997', disease: 'tuberculosis' },
  { id: 'rontgen', cc: 'de', year: 1895, year_he: '1895', person_he: 'רנטגן', person_en: 'Wilhelm Röntgen', place_he: 'וירצבורג', place_en: 'Würzburg', lat: 49.79, lon: 9.95,
    layer: 'known', text_he: 'קרני **X**: לראשונה רואים את השלד בתוך גוף חי.', evidence: 'גבוהה', source_id: 'porter-1997', system: 'skeletal' },
  { id: 'fleming', cc: 'gb', year: 1928, year_he: '1928', person_he: 'פלמינג', person_en: 'Alexander Fleming', place_he: 'לונדון', place_en: 'London', lat: 51.52, lon: -0.17,
    layer: 'known', text_he: 'גילוי **הפניצילין**, האנטיביוטיקה הראשונה, מעובש בצלחת מעבדה.', evidence: 'גבוהה', source_id: 'porter-1997', disease: 'pneumonia' },
  { id: 'who', cc: 'ch', year: 1948, year_he: '1948', person_he: 'ארגון הבריאות העולמי', person_en: 'WHO', place_he: 'ז׳נבה', place_en: 'Geneva', lat: 46.2, lon: 6.14,
    layer: 'known', text_he: 'בריאות מוגדרת כ**רווחה גופנית, נפשית וחברתית**, ולא רק היעדר מחלה.', evidence: 'גבוהה', source_id: 'who-constitution' },
  { id: 'smallpox', cc: 'ch', year: 1980, year_he: '1980', person_he: 'ארגון הבריאות העולמי', person_en: 'WHO', place_he: 'ז׳נבה', place_en: 'Geneva', lat: 46.22, lon: 6.16,
    layer: 'known', text_he: '**אבעבועות שחורות הוכרזו כמוכחדות**: המחלה הראשונה שהאנושות מחקה, בזכות חיסון.', evidence: 'גבוהה', source_id: 'who-smallpox', system: 'immune' },
  { id: 'weizmann', cc: 'il', year: 2016, year_he: '2016', person_he: 'סנדר, פוקס ומילוא', person_en: 'Sender, Fuchs & Milo', place_he: 'רחובות', place_en: 'Rehovot', lat: 31.9, lon: 34.81,
    layer: 'known', text_he: 'ב**מכון ויצמן** ספרו מחדש: בגוף כ-**38** טריליון חיידקים, בערך כמספר תאי הגוף.', evidence: 'גבוהה', source_id: 'sender-2016', system: 'digestive' },
];

// Four traditions, the same three fields each (fixed format: compare, then see what is unique).
export const TRADITIONS = [
  { id: 'greek', flags: ['gr'], name_he: 'יוונית', era_he: 'מהמאה ה-5 לפנה"ס', layer: 'said', tradition: 'רפואה יוונית', source_id: 'porter-1997',
    disease_he: 'הפרה של **איזון ארבע הליחות**: דם, ליחה, מרה צהובה ומרה שחורה.',
    look_he: 'התבוננות בחולה, בדופק ובהפרשות, ומעקב אחרי מהלך המחלה.',
    act_he: 'החזרת האיזון: תזונה, מנוחה, אוויר, ולעיתים הקזת דם.' },
  { id: 'rambam', flags: ['es', 'eg'], name_he: 'הרמב"ם', era_he: 'המאה ה-12', layer: 'said', tradition: 'הרמב"ם', source_id: 'rambam-deot',
    disease_he: '„היות הגוף בריא ושלם” הוא חלק מ**דרך חיים נכונה**, ולא רק עניין רפואי.',
    look_he: 'הרגלים: מתי אוכלים, כמה ישנים, איך מתנועעים.',
    act_he: 'שמירת הבריאות לפני ריפוי: סדר יום, אכילה בזמן רעב, ותנועה.' },
  { id: 'chinese', flags: ['cn'], name_he: 'סינית', era_he: 'אלפי שנים', layer: 'said', tradition: 'רפואה סינית', source_id: 'porter-1997',
    disease_he: 'חוסר איזון של **צ׳י** ושל **יין ויאנג** בגוף.',
    look_he: '**בדיקת הדופק** ובדיקת הלשון.',
    act_he: 'דיקור, תכשירי צמחים, וטאי צ׳י.',
    warn_he: 'ידוע: חלק מתכשירי הצמחים הסיניים נמצאו מזוהמים במתכות כבדות ובחומרים רעילים.', warn_source: 'nccih-tcm' },
  { id: 'modern', flags: ['gb', 'de', 'at', 'ch'], name_he: 'מודרנית', era_he: 'מהמאה ה-19', layer: 'known', evidence: 'גבוהה', source_id: 'porter-1997',
    disease_he: 'מנגנון שאפשר למדוד: **חיידק**, נגיף, תא שהשתבש, או כלי דם שנחסם.',
    look_he: 'בדיקות, הדמיה, ו**ניסויים מבוקרים** שבודקים מה עובד.',
    act_he: 'מניעה, חיסון, תרופה או ניתוח, לפי ראיות. ובריאות כרווחה, לפי WHO.' },
];

// ---------- Stage 6: the live bridge to the nutrition app (Tzuna-GH) ----------
// Food ids map to Tzuna's own ids; topics open its search. Routing there: #/foods?id= or #/foods?q=
export const NUTRITION_APP = {
  name_he: 'מזון, גוף ונפש',
  url: 'https://tzuna-gh.vercel.app/',
  foods: { 'olive-oil': 'olive', turmeric: 'turmeric' },
  topics: { fiber: 'סיבים', calcium: 'סידן', sodium: 'מלח', alcohol: 'אלכוהול', 'mediterranean-diet': 'ים תיכונית' },
};
export function nutritionHref(link) {
  if (!link || link.app !== 'nutrition') return null;
  const N = NUTRITION_APP;
  if (link.food_id && N.foods[link.food_id]) return `${N.url}#/foods?id=${encodeURIComponent(N.foods[link.food_id])}`;
  if (link.topic && N.topics[link.topic]) return `${N.url}#/foods?q=${encodeURIComponent(N.topics[link.topic])}`;
  return null;
}

// ---------- Home: the whole teaching on one foot ----------
export const HOME = {
  hillel_he: 'דעלך סני לחברך לא תעביד, זו היא כל התורה כולה, ואידך פירושה הוא, זיל גמור.',
  hillel_tr: 'מה ששנוא עליך, אל תעשה לחברך. זו כל התורה כולה, והשאר פירוש. לך ולמד.',
  hillel_source: 'bavli-shabbat-31a',
  one_foot: '==הגוף: עיר של רשתות, וכל רשת היא גילוי.==',
  one_foot_more: 'לכל מערכת: מבנה, תפקוד, וסיפור הגילוי שלה.\nלכל משפט: ידוע, נאמר, או רק מאמינים.\nכל השאר פירוש: זיל גמור.',
  // Seven insights for someone who studies systems. Each one is born in a screen of the app, and leads back to it.
  lines: [
    { text_he: '**הצורה היא התשובה:** ארבעה חללים וארבעה מסתמים, כדי שהדם יזרום לכיוון אחד.', source_id: 'guyton-2020', go: { v: 'deep', s: 'cardio', t: 'organs' }, go_he: 'הלב, לעומק' },
    { text_he: '**הגוף הוא עיר של רשתות:** אספקה, תקשורת, אוורור ופינוי, שבע מערכות.', go: { v: 'system', s: 'nervous' }, go_he: 'מפת הגוף' },
    { text_he: '**אנחנו מערכת אקולוגית:** בגוף חיידקים כמספר התאים שלו.', source_id: 'sender-2016', go: { v: 'system', s: 'digestive' }, go_he: 'מערכת העיכול' },
    { text_he: '**החומר זורם, הצורה נשארת:** העצם נבנית ומתפרקת כל החיים.', source_id: 'gray-2020', go: { v: 'system', s: 'skeletal' }, go_he: 'השלד' },
    { text_he: '**גילוי מתחיל בשאלה מוזרה:** הארווי שאל כמה דם יוצא מהלב בשעה.', source_id: 'harvey-1628', go: { v: 'history', e: 5 }, go_he: 'הארווי, 1628' },
    { text_he: '**מסורת היא השערה שמחכה לבדיקה:** חלקן אוששו, חלקן הופרכו.', go: { v: 'history', h: 'traditions' }, go_he: 'ארבע מסורות' },
    { text_he: '**מה שנשבר מלמד איך זה עובד:** כל מחלה היא חלון אל המערכת שלה.', go: { v: 'diseases' }, go_he: '24 מחלות' },
  ],
  haiku: ['על רגל אחת', 'שבע רשתות בעיר', 'שאלה ביד'],
  haiku_note: 'הגוף כעיר, והידע כשאלה שמביאים לרופא.',
};

// ---------- Discovery layer: wonder, image, flag, open question (Anat, 02.11.2026) ----------
// The app is a cabinet of wonders and a research atlas, not a warning campaign.
// Three depth levels on every page: glance (wonder), understand (mechanism), depth (discovery and open question).

// Historical plates, public domain on Wikimedia Commons, kept in img/ (credit on every use).
export const IMAGES = {
  'vesalius-fabrica': { src: 'img/vesalius-fabrica.jpg', title_he: 'לוח מתוך "על מבנה גוף האדם"', by_he: 'אנדראס וסאליוס', by_en: 'Andreas Vesalius', year: 1543, page: 'https://commons.wikimedia.org/wiki/File:Vesalius_Fabrica_p190.jpg' },
  'harvey-veins': { src: 'img/harvey-veins.jpg', title_he: 'הניסוי בווריד החסום: הדם זורם רק לכיוון הלב', by_he: 'ויליאם הארווי', by_en: 'William Harvey', year: 1628, page: 'https://commons.wikimedia.org/wiki/File:William_Harvey_(1578-1657)_Venenbild.jpg' },
  'snow-cholera-map': { src: 'img/snow-cholera-map.jpg', title_he: 'מפת הכולרה של רחוב ברוד', by_he: 'ג׳ון סנואו', by_en: 'John Snow', year: 1854, page: 'https://commons.wikimedia.org/wiki/File:Snow-cholera-map-1.jpg' },
};

// Glance level for each system: one number that makes you stop, and the question still open.
export const WONDERS = {
  nervous: { big: '86', unit_he: 'מיליארד', line_he: 'תאי עצב במוח אחד', source_id: 'azevedo-2009', open_q_he: 'איך נוצרת תודעה מתוך רשת של תאים?' },
  respiratory: { big: '½', unit_he: 'ליטר', line_he: 'אוויר נכנס בכל נשימה רגילה', source_id: 'guyton-2020', open_q_he: 'איך הריאה מבחינה, בכל נשימה, בין אוויר לבין חיידק?' },
  cardio: { big: '5', unit_he: 'ליטר בדקה', line_he: 'דם שהלב מזרים, במנוחה', source_id: 'guyton-2020', image: 'harvey-veins', open_q_he: 'איך שומר הלב על קצב, פעימה אחרי פעימה, עשרות שנים?' },
  digestive: { big: '38', unit_he: 'טריליון', line_he: 'חיידקים בגוף, בערך כמספר התאים', source_id: 'sender-2016', open_q_he: 'מה בדיוק עושים בשבילנו החיידקים שבמעי?' },
  skeletal: { big: '206', unit_he: 'עצמות', line_he: 'בשלד של אדם בוגר, שנבנה ומתפרק כל החיים', source_id: 'gray-2020', image: 'vesalius-fabrica', open_q_he: 'איך יודעת העצם היכן להתחזק, לפי העומס שהיא נושאת?' },
  immune: { big: '3.5–5', unit_he: 'מיליון', line_he: 'חיים בשנה, בזכות הזיכרון שחיסונים מלמדים', source_id: 'who-immunization', open_q_he: 'איך זוכרת מערכת החיסון פולש במשך עשרות שנים?' },
  reproductive: { big: 'HPV', unit_he: '', line_he: 'נגיף אחד, ונגדו חיסון שמונע סרטן', source_id: 'who-cervical', open_q_he: 'למה רוב מקרי סרטן השד מופיעים בלי גורם סיכון מזוהה?' },
};

// Flags of today's countries (flag-icons, MIT), for every culture and place.
export const COUNTRIES = {
  gr: 'יוון', it: 'איטליה', ir: 'איראן', eg: 'מצרים', es: 'ספרד', gb: 'בריטניה', at: 'אוסטריה',
  de: 'גרמניה', ch: 'שווייץ', il: 'ישראל', cn: 'סין',
};
export const FLAG_URL = (cc) => `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${cc}.svg`;

// ---------- The real body in 3D (BodyParts3D, CC BY 4.0, © DBCLS) ----------
// One model per system in models/<id>.glb, and models/body.glb with all seven, light, for context.
// Each part: Hebrew name, the English term, one structural line (Gray's Anatomy, layer known), and a tissue colour.
// Tissue colours are the anatomical convention (arteries red, veins blue). The ink look keeps the DNA palette.
export const MODEL_CREDIT = { he: 'מודלים: BodyParts3D, © The Database Center for Life Science, ברישיון CC BY 4.0. מפושטים ומקובצים למבנים.', url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html' };
const P = (id, he, en, tissue, text_he) => ({ id, he, en, tissue, layer: 'known', text_he, source_id: 'gray-2020' });
export const ANATOMY3D = {
  cardio: {
    focus: ['lv', 'rv', 'la', 'ra', 'pulmtrunk', 'svc'],
    parts: [
      P('lv', 'החדר השמאלי', 'Left ventricle', '#7d1f1d', 'שולח דם עשיר בחמצן לכל הגוף, דרך אבי העורקים. הדופן שלו היא העבה ביותר בלב.'),
      P('rv', 'החדר הימני', 'Right ventricle', '#8c2a25', 'שולח דם דל בחמצן אל הריאות, דרך גזע עורק הריאה.'),
      P('la', 'העלייה השמאלית', 'Left atrium', '#9a3a33', 'מקבלת דם עשיר בחמצן מהריאות, ומעבירה אותו לחדר השמאלי.'),
      P('ra', 'העלייה הימנית', 'Right atrium', '#7e3b45', 'מקבלת דם דל בחמצן מהגוף, דרך הוורידים הנבובים, ומעבירה אותו לחדר הימני.'),
      P('mitral', 'המסתם המיטרלי', 'Mitral valve, anterior leaflet', '#e8d6bb', 'בין העלייה השמאלית לחדר השמאלי. במודל מופיע העלה הקדמי שלו.'),
      P('tricuspid', 'המסתם התלת־צניפי', 'Tricuspid valve', '#ead9c0', 'בין העלייה הימנית לחדר הימני. שלושה עלים.'),
      P('aorticv', 'מסתם אבי העורקים', 'Aortic valve', '#f0e2c9', 'ביציאה מהחדר השמאלי אל אבי העורקים. שלוש כיסות, שנסגרות כשהחדר נרפה.'),
      P('pulmv', 'מסתם עורק הריאה', 'Pulmonary valve', '#eedcc4', 'ביציאה מהחדר הימני אל עורק הריאה. שלוש כיסות.'),
      P('coronary', 'העורקים הכליליים', 'Coronary arteries', '#d11a22', 'מזינים את שריר הלב עצמו. יוצאים מאבי העורקים, ממש מעל המסתם שלו.'),
      P('cveins', 'ורידי הלב', 'Cardiac veins', '#2a4795', 'מחזירים דם משריר הלב. רובם נאספים לסינוס הכלילי, שנפתח לעלייה הימנית.'),
      P('aorta', 'אבי העורקים', 'Aorta', '#b5181c', 'העורק הגדול בגוף. עולה מהחדר השמאלי, מתקשת, ויורדת לאורך עמוד השדרה אל הבטן.'),
      P('pulmtrunk', 'גזע עורק הריאה', 'Pulmonary trunk', '#2f4d9e', 'מוביל דם דל בחמצן מהחדר הימני, ומתפצל לשתי הריאות.'),
      P('svc', 'הווריד הנבוב העליון', 'Superior vena cava', '#2a4795', 'מחזיר דם מהראש, מהצוואר ומהזרועות אל העלייה הימנית.'),
      P('arteries', 'רשת העורקים', 'Systemic arteries', '#c0262b', 'העורקים מובילים דם מהלב אל כל רקמה. במודל: מאות ענפים, מהצוואר ועד כף הרגל.'),
      P('veins', 'רשת הוורידים', 'Systemic veins', '#34539f', 'הוורידים מחזירים את הדם אל הלב. הווריד הנבוב התחתון אוסף את הדם מחצי הגוף התחתון.'),
    ],
  },
  respiratory: {
    focus: ['trachea', 'airways', 'pulmart', 'pulmvein'],
    gap_he: 'הריאות מוצגות כעץ: סימפונות, עורקים וורידים. רקמת הריאה עצמה לא קיימת במודל.',
    parts: [
      P('trachea', 'קנה הנשימה', 'Trachea', '#e3c9b6', 'צינור שטבעות סחוס מחזיקות אותו פתוח. מתפצל לשני סימפונות ראשיים.'),
      P('airways', 'עץ הסימפונות', 'Bronchial tree', '#ead7c6', 'האוויר עובר בענפים שהולכים וצרים, עד שקיקי האוויר.'),
      P('pulmart', 'עורקי הריאה', 'Pulmonary arteries', '#2f4d9e', 'מביאים דם דל בחמצן מהלב אל הריאה, בצמוד לסימפונות.'),
      P('pulmvein', 'ורידי הריאה', 'Pulmonary veins', '#b5181c', 'מחזירים דם עשיר בחמצן מהריאה אל העלייה השמאלית.'),
      P('diaphragm', 'הסרעפת', 'Diaphragm', '#8c2a25', 'שריר כיפתי בין החזה לבטן. כשהוא מתכווץ ויורד, אוויר נכנס לריאות.'),
    ],
  },
  nervous: {
    focus: ['cerebrum_r', 'cerebrum_l', 'cerebellum', 'brainstem'],
    parts: [
      P('cerebrum_r', 'ההמיספרה הימנית', 'Right cerebral hemisphere', '#e3c4b8', 'חצי המוח הגדול. הקפלים מגדילים את שטח הקליפה, שבה רוב תאי העצב של החשיבה.'),
      P('cerebrum_l', 'ההמיספרה השמאלית', 'Left cerebral hemisphere', '#dcbcae', 'אצל רוב האנשים, אזורי השפה נמצאים בחצי הזה.'),
      P('cerebellum', 'המוח הקטן', 'Cerebellum', '#cfa596', 'מתאם תנועה, יציבה ואיזון.'),
      P('brainstem', 'גזע המוח', 'Brainstem', '#e8d2c4', 'המוח התיכון, הגשר והמוח המוארך. מחבר את המוח לחוט השדרה, ומווסת נשימה וקצב לב.'),
      P('diencephalon', 'המוח הביניים', 'Diencephalon', '#d8bcae', 'התלמוס וההיפותלמוס. תחנת ממסר לחושים, ומרכז לוויסות הגוף.'),
      P('cord', 'חוט השדרה', 'Spinal cord', '#f0e0c8', 'הכביש הראשי בין המוח לגוף, בתוך עמוד השדרה.'),
      P('eyes', 'גלגלי העיניים', 'Eyeballs', '#f4f1ea', 'הרשתית שבעין היא חלק ממערכת העצבים המרכזית.'),
    ],
  },
  digestive: {
    focus: ['stomach', 'liver', 'pancreas', 'small', 'large'],
    parts: [
      P('esophagus', 'הוושט', 'Esophagus', '#c7746a', 'צינור שריר שמוביל מזון מהלוע אל הקיבה.'),
      P('stomach', 'הקיבה', 'Stomach', '#d08a7c', 'שק שרירי שמערבל מזון עם חומצה ואנזימים.'),
      P('liver', 'הכבד', 'Liver', '#6e2a20', 'האיבר הפנימי הגדול בגוף. במודל רואים גם את כלי הדם ואת צינורות המרה שבתוכו.'),
      P('gallbladder', 'כיס המרה', 'Gallbladder', '#5b7f3a', 'אוגר מרה שהכבד מייצר, ומשחרר אותה אל המעי הדק.'),
      P('pancreas', 'הלבלב', 'Pancreas', '#e3b48a', 'מפריש אנזימי עיכול אל המעי, והורמונים כמו אינסולין אל הדם.'),
      P('small', 'המעי הדק', 'Small intestine', '#d99a86', 'התריסריון, המעי הריק והמעי העקום. כאן נספג רוב המזון.'),
      P('large', 'המעי הגס', 'Large intestine', '#c98a72', 'סופג מים ומלחים, ומסתיים בחלחולת.'),
    ],
  },
  skeletal: {
    focus: ['skull', 'spine', 'thorax', 'pelvis', 'arms', 'legs'],
    gap_he: 'השרירים לא כלולים במודל הזה.',
    parts: [
      P('skull', 'הגולגולת', 'Skull and mandible', '#ece4d2', 'עצמות הראש והפנים, והלסת התחתונה. מגינה על המוח.'),
      P('spine', 'עמוד השדרה', 'Vertebral column', '#e6dcc6', 'חוליות ודיסקים, מהצוואר ועד העצה. נושא את הגוף ומגן על חוט השדרה.'),
      P('thorax', 'בית החזה', 'Rib cage and sternum', '#ebe3d1', 'צלעות ועצם החזה. כלוב שזז עם כל נשימה.'),
      P('pelvis', 'עצמות האגן', 'Hip bones', '#e4d9c2', 'מחברות את עמוד השדרה לרגליים, ותומכות באיברי הבטן התחתונה.'),
      P('arms', 'עצמות הידיים', 'Bones of the upper limbs', '#ede6d6', 'מעצם הבריח ועצם השכמה ועד אצבעות היד.'),
      P('legs', 'עצמות הרגליים', 'Bones of the lower limbs', '#e9e0cc', 'מעצם הירך, העצם הארוכה בגוף, ועד אצבעות הרגל.'),
    ],
  },
  immune: {
    focus: ['thymus'],
    gap_he: 'במקור אין טחול ואין בלוטות לימפה. לכן מוצג רק התימוס, במקומו מאחורי עצם החזה.',
    parts: [
      P('thymus', 'התימוס', 'Thymus', '#e6c3a0', 'בלוטה מאחורי עצם החזה. בה מבשילים תאי T. גדולה בילדות, ומצטמקת עם הגיל.'),
    ],
  },
  reproductive: {
    focus: ['prostate', 'bladder'],
    gap_he: 'המקור נבנה מגוף של גבר. השד, הרחם והשחלות לא קיימים בו, ולכן לא מוצגים כאן. בשקפים ובכרטיסים הם מופיעים.',
    parts: [
      P('prostate', 'הערמונית', 'Prostate', '#c48a7a', 'בלוטה מתחת לשלפוחית השתן, אצל גברים. מפרישה חלק מנוזל הזרע.'),
      P('bladder', 'שלפוחית השתן', 'Urinary bladder', '#e0b8a0', 'לא חלק ממערכת הרבייה, אלא שכנה קרובה. מוצגת כנקודת ציון.'),
    ],
  },
};
