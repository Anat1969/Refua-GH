// Lab dictionary for "התיק שלי" (lab/records.html).
// Public knowledge only: what each test measures, where in the body, and a source.
// No reference ranges here (docs/SAFETY.md, section 9): a range is shown only as printed in the user's own report.
// Personal values never enter this file or the repository.

export const LAB_SOURCES = {
  'mlp-cbc': { title: 'MedlinePlus, Complete Blood Count (CBC)', year: 2024, url: 'https://medlineplus.gov/lab-tests/complete-blood-count-cbc/' },
  'mlp-diff': { title: 'MedlinePlus, Blood Differential', year: 2024, url: 'https://medlineplus.gov/lab-tests/blood-differential/' },
  'mlp-cmp': { title: 'MedlinePlus, Comprehensive Metabolic Panel (CMP)', year: 2024, url: 'https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/' },
  'mlp-liver': { title: 'MedlinePlus, Liver Function Tests', year: 2024, url: 'https://medlineplus.gov/lab-tests/liver-function-tests/' },
  'mlp-ldh': { title: 'MedlinePlus, Lactate Dehydrogenase (LDH) Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/lactate-dehydrogenase-ldh-test/' },
  'mlp-pt': { title: 'MedlinePlus, Prothrombin Time Test and INR', year: 2024, url: 'https://medlineplus.gov/lab-tests/prothrombin-time-test-and-inr-ptinr/' },
  'mlp-ptt': { title: 'MedlinePlus, Partial Thromboplastin Time (PTT) Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/partial-thromboplastin-time-ptt-test/' },
  'mlp-glucose': { title: 'MedlinePlus, Blood Glucose Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/blood-glucose-test/' },
  'mlp-a1c': { title: 'MedlinePlus, Hemoglobin A1C (HbA1c) Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/' },
  'mlp-lipid': { title: 'MedlinePlus, Cholesterol Levels', year: 2024, url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/' },
  'mlp-thyroid': { title: 'MedlinePlus, TSH (Thyroid-stimulating hormone) Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/tsh-thyroid-stimulating-hormone-test/' },
  'mlp-ferritin': { title: 'MedlinePlus, Ferritin Blood Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/ferritin-blood-test/' },
  'mlp-b12': { title: 'MedlinePlus, Vitamin B Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/vitamin-b-test/' },
  'mlp-vitd': { title: 'MedlinePlus, Vitamin D Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/vitamin-d-test/' },
  'mlp-crp': { title: 'MedlinePlus, C-Reactive Protein (CRP) Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/' },
  'mlp-calcium': { title: 'MedlinePlus, Calcium Blood Test', year: 2024, url: 'https://medlineplus.gov/lab-tests/calcium-blood-test/' },
};

// Groups: a network of the body-as-city (CLAUDE.md), and where it shows in the 3D body.
// sys + hl: the atlas system and the parts that light up (ANATOMY3D ids). from: where the thing in the tube comes from.
// does: what it does in the body. moves: what is known to move the value, from the source of each test.
// There is no "how to fix" field on purpose (docs/SAFETY.md, section 9): a value is a gauge; the cause is found with the doctor.
const MARROW = { sys: 'skeletal', hl: ['pelvis', 'spine', 'thorax'], where: 'מח העצם: באגן, בחוליות ובצלעות' };
const LIVER = { sys: 'digestive', hl: ['liver'], where: 'הכבד' };
export const LAB_GROUPS = [
  { id: 'blood', he: 'תאי הדם', city: 'אוכלוסיית העיר', ...MARROW,
    from: 'מח העצם מייצר כ-2 מיליון תאים אדומים בכל שנייה.', does: 'נושאים חמצן מהריאות לכל תא בגוף, ומחזירים פחמן דו־חמצני.',
    moves: ['ברזל, B12 וחומצה פולית', 'דימום, גם וסת', 'הריון', 'גובה מעל פני הים', 'מחלה כרונית', 'טיפולים אונקולוגיים'] },
  { id: 'defense', he: 'תאי ההגנה', city: 'כוחות הביטחון', ...MARROW,
    from: 'נוצרים במח העצם, ויוצאים לדם ולרקמות.', does: 'מגינים מחיידקים, מנגיפים ומטפילים, ומפנים תאים פגועים.',
    moves: ['זיהום', 'מאמץ ולחץ', 'סטרואידים', 'טיפולים אונקולוגיים', 'אלרגיה'] },
  { id: 'clot', he: 'קרישה', city: 'צוות התיקונים בכבישים', ...MARROW,
    from: 'הטסיות הן שברים של תאי ענק במח העצם.', does: 'סוגרות פצע ראשונות: נצמדות לדופן הפגועה ויוצרות פקק.',
    moves: ['זיהום ודלקת', 'דימום', 'מחסור בברזל', 'טיפולים אונקולוגיים', 'תרופות מסוימות'] },
  { id: 'liver', he: 'הכבד', city: 'מפעל העיבוד', ...LIVER,
    from: 'תאי הכבד.', does: 'מפרק רעלים ותרופות, מייצר חלבונים, חלבוני קרישה ומרה.',
    moves: ['אלכוהול', 'תרופות ותוספים, גם פרצטמול', 'כבד שומני', 'דלקת נגיפית', 'מאמץ גופני חזק לפני הבדיקה'] },
  { id: 'kidney', he: 'הכליות והמלחים', city: 'מתקן הסינון', sys: 'urinary', hl: ['kidneys'], where: 'הכליות',
    from: 'פסולת ומלחים שהכליות מסננות מהדם.', does: 'הכליות מסננות כ-180 ליטר נוזל ביום, ומחזירות לדם כמעט את כולו.',
    moves: ['כמות השתייה', 'הקאות ושלשולים', 'משתנים ותרופות ללחץ הדם', 'מחלת כליות'] },
  { id: 'sugar', he: 'סוכר', city: 'אספקת הדלק', sys: 'endocrine', hl: ['pancreas'], where: 'הלבלב',
    from: 'מהמזון, וממאגרי הכבד בין הארוחות.', does: 'דלק לכל תא, ובמיוחד למוח. הלבלב מווסת אותו באינסולין.',
    moves: ['אכילה לפני הבדיקה', 'לחץ ומחלה חריפה', 'סטרואידים', 'סוכרת'] },
  { id: 'fats', he: 'שומני הדם', city: 'מטען בצינורות', sys: 'cardio', hl: ['coronary', 'aorta', 'arteries'], where: 'דופן העורקים',
    from: 'רובם מהכבד, וחלקם מהמזון.', does: 'חומר בניין לתאים ולהורמונים. עודף נאגר בדופן העורקים.',
    moves: ['תורשה', 'תזונה', 'פעילות גופנית', 'עישון', 'סוכרת ובלוטת התריס'] },
  { id: 'hormones', he: 'הורמונים וויטמינים', city: 'מערכת ההודעות', sys: 'endocrine', hl: ['pituitary', 'thyroid'], where: 'הבלוטות',
    from: 'בלוטות, מחסנים והמזון.', does: 'הודעות וחומרי עזר שמווסתים את קצב הגוף.',
    moves: ['תזונה', 'הריון', 'תרופות ותוספים'] },
  { id: 'inflam', he: 'סמני דלקת', city: 'אזעקה', ...LIVER,
    from: 'הכבד מייצר אותו כשמגיע אות של דלקת.', does: 'אומר שיש דלקת בגוף, אבל לא איפה.',
    moves: ['זיהום', 'מחלה דלקתית', 'פציעה או ניתוח'] },
];

// alias: exact codes as printed on Israeli lab reports (upper case, spaces kept). The longest alias wins.
export const LABS = [
  // Blood cells
  { id: 'wbc', alias: ['WBC'], he: 'תאי דם לבנים', g: 'defense', what: 'כמה תאי הגנה יש בכל מיקרוליטר דם.', src: 'mlp-cbc' },
  { id: 'rbc', alias: ['RBC'], he: 'תאי דם אדומים', g: 'blood', what: 'כמה תאים נושאי חמצן יש בדם.', src: 'mlp-cbc' },
  { id: 'hb', alias: ['HB', 'HGB', 'HEMOGLOBIN'], he: 'המוגלובין', g: 'blood', what: 'החלבון שקושר חמצן בתוך התא האדום.', src: 'mlp-cbc' },
  { id: 'hct', alias: ['HCT', 'HEMATOCRIT'], he: 'המטוקריט', g: 'blood', what: 'איזה חלק מנפח הדם הוא תאים אדומים.', src: 'mlp-cbc' },
  { id: 'mcv', alias: ['MCV'], he: 'גודל התא האדום', g: 'blood', what: 'הנפח הממוצע של תא אדום אחד.', src: 'mlp-cbc' },
  { id: 'mch', alias: ['MCH'], he: 'המוגלובין בתא', g: 'blood', what: 'כמה המוגלובין יש בממוצע בתא אדום אחד.', src: 'mlp-cbc' },
  { id: 'mchc', alias: ['MCHC'], he: 'ריכוז ההמוגלובין בתא', g: 'blood', what: 'כמה צפוף ההמוגלובין בתוך התא האדום.', src: 'mlp-cbc' },
  { id: 'rdw', alias: ['RDW-CV', 'RDW'], he: 'שונות בגודל התאים', g: 'blood', what: 'עד כמה התאים האדומים שונים זה מזה בגודל.', src: 'mlp-cbc' },
  { id: 'plt', alias: ['PLT', 'PLATELETS'], he: 'טסיות', g: 'clot', what: 'שברי תאים שסוגרים פצע ראשונים.', src: 'mlp-cbc' },
  { id: 'mpv', alias: ['MPV'], he: 'גודל הטסית', g: 'clot', what: 'הנפח הממוצע של טסית אחת.', src: 'mlp-cbc' },
  { id: 'neutp', alias: ['NEUT%', 'NEUT %'], he: 'נויטרופילים, אחוז', g: 'defense', what: 'החלק של התאים שתוקפים חיידקים ראשונים.', src: 'mlp-diff' },
  { id: 'neuta', alias: ['NEUT.ABS', 'NEUT ABS'], he: 'נויטרופילים, ספירה', g: 'defense', what: 'מספר התאים שתוקפים חיידקים ראשונים.', src: 'mlp-diff' },
  { id: 'lymp', sys: 'immune', hl: ['spleen', 'thymus', 'nodes_neck', 'nodes_axilla', 'nodes_abdomen', 'nodes_groin'], where: 'הטחול, התימוס ובלוטות הלימפה', from: 'נוצרים במח העצם, ומתבגרים בתימוס ובבלוטות הלימפה.',  alias: ['LYM%', 'LYMP%', 'LYM %'], he: 'לימפוציטים, אחוז', g: 'defense', what: 'החלק של תאי הזיכרון החיסוני: תאי B ו-T.', src: 'mlp-diff' },
  { id: 'lyma', sys: 'immune', hl: ['spleen', 'thymus', 'nodes_neck', 'nodes_axilla', 'nodes_abdomen', 'nodes_groin'], where: 'הטחול, התימוס ובלוטות הלימפה', from: 'נוצרים במח העצם, ומתבגרים בתימוס ובבלוטות הלימפה.',  alias: ['LYMP.ABS', 'LYM.ABS', 'LYMP ABS'], he: 'לימפוציטים, ספירה', g: 'defense', what: 'מספר תאי הזיכרון החיסוני בדם.', src: 'mlp-diff' },
  { id: 'monop', alias: ['MONO%', 'MONO %'], he: 'מונוציטים, אחוז', g: 'defense', what: 'החלק של התאים שבולעים ומנקים.', src: 'mlp-diff' },
  { id: 'monoa', alias: ['MONO.ABS', 'MONO ABS'], he: 'מונוציטים, ספירה', g: 'defense', what: 'מספר התאים שבולעים ומנקים.', src: 'mlp-diff' },
  { id: 'eosp', alias: ['EOS%', 'EOS %'], he: 'אאוזינופילים, אחוז', g: 'defense', what: 'החלק של התאים שפועלים באלרגיה ומול טפילים.', src: 'mlp-diff' },
  { id: 'eosa', alias: ['EOS.ABS', 'EOS ABS'], he: 'אאוזינופילים, ספירה', g: 'defense', what: 'מספר התאים שפועלים באלרגיה ומול טפילים.', src: 'mlp-diff' },
  { id: 'basop', alias: ['BASO%', 'BASO %'], he: 'בזופילים, אחוז', g: 'defense', what: 'החלק של התאים שמשחררים היסטמין.', src: 'mlp-diff' },
  { id: 'basoa', alias: ['BASO.ABS', 'BASO ABS'], he: 'בזופילים, ספירה', g: 'defense', what: 'מספר התאים שמשחררים היסטמין.', src: 'mlp-diff' },
  // Clotting
  { id: 'ptsec', ...LIVER, from: 'הכבד מייצר את חלבוני הקרישה.', does: 'כמה מהר הדם נקרש כשנפתח פצע.', moves: ['נוגדי קרישה', 'ויטמין K', 'מחלת כבד', 'חסר תורשתי בחלבון קרישה'],  alias: ['PT-SEC', 'PT SEC'], he: 'זמן פרותרומבין', g: 'clot', what: 'כמה שניות לוקח לדם להיקרש במבחנה, במסלול החיצוני.', src: 'mlp-pt' },
  { id: 'ptp', ...LIVER, from: 'הכבד מייצר את חלבוני הקרישה.', does: 'כמה מהר הדם נקרש כשנפתח פצע.', moves: ['נוגדי קרישה', 'ויטמין K', 'מחלת כבד', 'חסר תורשתי בחלבון קרישה'],  alias: ['PT %', 'PT%'], he: 'פרותרומבין, אחוז', g: 'clot', what: 'אותה מדידה, באחוז מפעילות רגילה.', src: 'mlp-pt' },
  { id: 'inr', ...LIVER, from: 'הכבד מייצר את חלבוני הקרישה.', does: 'כמה מהר הדם נקרש כשנפתח פצע.', moves: ['נוגדי קרישה', 'ויטמין K', 'מחלת כבד', 'חסר תורשתי בחלבון קרישה'],  alias: ['PT-INR', 'INR'], he: 'INR', g: 'clot', what: 'אותה מדידה, ביחס אחיד שמשווה בין מעבדות.', src: 'mlp-pt' },
  { id: 'aptt', ...LIVER, from: 'הכבד מייצר את חלבוני הקרישה.', does: 'כמה מהר הדם נקרש כשנפתח פצע.', moves: ['נוגדי קרישה, במיוחד הפרין', 'מחלת כבד', 'חסר תורשתי בחלבון קרישה'],  alias: ['APTT-SEC', 'APTT', 'PTT'], he: 'APTT', g: 'clot', what: 'כמה שניות לוקח לדם להיקרש, במסלול הפנימי.', src: 'mlp-ptt' },
  // Liver
  { id: 'ast', from: 'תאי הכבד, וגם השריר והלב.', moves: ['אלכוהול', 'תרופות ותוספים', 'כבד שומני', 'דלקת נגיפית', 'פגיעה בשריר או מאמץ חזק'],  alias: ['AST (GOT)', 'AST', 'GOT'], he: 'AST', g: 'liver', what: 'אנזים שיוצא לדם מתאי כבד, וגם מתאי שריר ולב.', src: 'mlp-liver' },
  { id: 'alt', alias: ['ALT (GPT)', 'ALT', 'GPT'], he: 'ALT', g: 'liver', what: 'אנזים שנמצא בעיקר בתאי הכבד, ויוצא לדם כשהם נפגעים.', src: 'mlp-liver' },
  { id: 'alp', hl: ['liver', 'gallbladder'], where: 'הכבד ודרכי המרה', from: 'דרכי המרה בכבד, והעצם.', does: 'עוזר לבנות עצם ולהזרים מרה.', moves: ['חסימה בדרכי המרה', 'גדילת עצם ושבר מתאחה', 'הריון', 'מחלת עצם'],  alias: ['ALK. PHOSPHATASE', 'ALK PHOSPHATASE', 'ALP'], he: 'אלקליין פוספטאז', g: 'liver', what: 'אנזים של דרכי המרה ושל העצם.', src: 'mlp-liver' },
  { id: 'ggt', hl: ['liver', 'gallbladder'], where: 'הכבד ודרכי המרה', from: 'תאי דרכי המרה בכבד.', moves: ['אלכוהול', 'חסימה בדרכי המרה', 'תרופות מסוימות', 'כבד שומני'],  alias: ['GGT'], he: 'GGT', g: 'liver', what: 'אנזים של דרכי המרה בכבד.', src: 'mlp-liver' },
  { id: 'bili', hl: ['liver', 'gallbladder'], where: 'הכבד ודרכי המרה', from: 'פירוק תאים אדומים זקנים, בעיקר בטחול.', does: 'הכבד מפנה אותו במרה. כשהוא מצטבר, העור והעיניים מצהיבים.', moves: ['צום', 'תסמונת גילברט, שכיחה ושקטה', 'פירוק מוגבר של תאים אדומים', 'חסימה בדרכי המרה'],  alias: ['BILIRUBIN TOTAL', 'BILIRUBIN'], he: 'בילירובין', g: 'liver', what: 'צבע צהוב מפירוק תאים אדומים, שהכבד מפנה למרה.', src: 'mlp-liver' },
  { id: 'alb', from: 'הכבד, כ-10 עד 15 גרם ביום.', does: 'מחזיק את הנוזל בתוך כלי הדם, ונושא חומרים ותרופות.', moves: ['תזונה', 'מחלת כבד', 'איבוד חלבון בשתן', 'דלקת'],  alias: ['ALBUMIN'], he: 'אלבומין', g: 'liver', what: 'החלבון הנפוץ בדם, שהכבד מייצר.', src: 'mlp-liver' },
  { id: 'prot', from: 'הכבד, ותאי מערכת החיסון.', does: 'מחזיק את הנוזל בכלי הדם, נושא חומרים, ומגן.', moves: ['תזונה', 'מחלת כבד', 'התייבשות', 'דלקת כרונית'],  alias: ['PROTEIN-TOTAL', 'TOTAL PROTEIN', 'PROTEIN'], he: 'חלבון כללי', g: 'liver', what: 'סך החלבונים בדם: אלבומין וגלובולינים.', src: 'mlp-cmp' },
  { id: 'glob', sys: 'immune', hl: ['spleen', 'nodes_neck', 'nodes_axilla', 'nodes_abdomen', 'nodes_groin'], where: 'הטחול ובלוטות הלימפה', from: 'תאי הפלזמה במערכת החיסון, וגם הכבד.', does: 'הנוגדנים, ונשאים של חומרים בדם.', moves: ['זיהום ודלקת כרוניים', 'מחלות של מערכת החיסון', 'מחלות של תאי הפלזמה'],  alias: ['GLOBULIN'], he: 'גלובולין', g: 'defense', what: 'חלבונים שכוללים את הנוגדנים. מחושב: חלבון כללי פחות אלבומין.', src: 'mlp-cmp' },
  { id: 'ldh', from: 'כמעט כל תא: לב, כבד, שריר ותאי דם.', does: 'אנזים של הפקת אנרגיה בתא. בדם הוא סימן לפירוק רקמה, לא איפה.', moves: ['פגיעה ברקמה', 'פירוק תאי דם', 'מאמץ גופני', 'דגימה שהתפרקה במבחנה'],  alias: ['LDH'], he: 'LDH', g: 'liver', what: 'אנזים שיש כמעט בכל תא, ויוצא לדם בפירוק רקמה.', src: 'mlp-ldh' },
  // Kidney and salts
  { id: 'creat', from: 'השרירים, בקצב קבוע.', does: 'מראה כמה טוב הכליות מסננות.', moves: ['מסת השריר', 'בשר מבושל לפני הבדיקה', 'התייבשות', 'מחלת כליות', 'תרופות מסוימות'],  alias: ['CREATININE'], he: 'קריאטינין', g: 'kidney', what: 'פסולת של שריר, שהכליות מסננות. מדד לסינון.', src: 'mlp-cmp' },
  { id: 'urea', from: 'הכבד, מפירוק חלבון.', does: 'הדרך של הגוף להיפטר מחנקן. הכליות מפנות אותה בשתן.', moves: ['התייבשות', 'כמות החלבון במזון', 'דימום במערכת העיכול', 'מחלת כליות'],  alias: ['UREA', 'BUN'], he: 'אוריאה', g: 'kidney', what: 'פסולת של פירוק חלבון, שהכבד מייצר והכליות מפנות.', src: 'mlp-cmp' },
  { id: 'na', does: 'קובע איפה המים בגוף, ומעביר אותות בעצבים.', moves: ['כמות השתייה', 'הקאות ושלשולים', 'משתנים', 'הורמונים של הכליה והמוח'],  alias: ['SODIUM', 'NA'], he: 'נתרן', g: 'kidney', what: 'המלח העיקרי בנוזל שמחוץ לתאים.', src: 'mlp-cmp' },
  { id: 'k', does: 'קובע את קצב הלב ואת כיווץ השרירים.', moves: ['תפקוד הכליות', 'משתנים ותרופות ללחץ הדם', 'הקאות ושלשולים', 'דגימה שהתפרקה במבחנה'],  alias: ['POTASSIUM', 'K'], he: 'אשלגן', g: 'kidney', what: 'המלח העיקרי בתוך התאים. חיוני לקצב הלב.', src: 'mlp-cmp' },
  { id: 'ca', sys: 'skeletal', hl: ['skull', 'spine', 'thorax', 'pelvis', 'arms', 'legs'], where: 'העצמות', from: 'העצמות, מאגר הסידן של הגוף.', does: 'בונה עצם, ומפעיל שריר, עצב וקרישה.', moves: ['ויטמין D', 'בלוטות יותרת התריס', 'מחלת כליות', 'רמת האלבומין'],  alias: ['CALCIUM', 'CA'], he: 'סידן', g: 'kidney', what: 'מינרל של העצם, השריר והעצב.', src: 'mlp-calcium' },
  // Sugar
  { id: 'glu', alias: ['GLUCOSE'], he: 'גלוקוז', g: 'sugar', what: 'הסוכר בדם ברגע הבדיקה.', src: 'mlp-glucose' },
  { id: 'a1c', moves: ['הסוכר בשלושת החודשים האחרונים', 'אנמיה ושינוי בתאים האדומים', 'מחלת כליות'],  alias: ['HBA1C', 'HEMOGLOBIN A1C', 'A1C'], he: 'המוגלובין מסוכרר', g: 'sugar', what: 'ממוצע הסוכר בשלושת החודשים האחרונים, כפי שנחרט בתאים האדומים.', src: 'mlp-a1c' },
  // Fats
  { id: 'chol', alias: ['CHOLESTEROL TOTAL', 'CHOLESTEROL'], he: 'כולסטרול כללי', g: 'fats', what: 'כל הכולסטרול שנישא בדם.', src: 'mlp-lipid' },
  { id: 'ldl', alias: ['LDL CHOLESTEROL', 'LDL-C', 'LDL'], he: 'LDL', g: 'fats', what: 'הנשא שמוביל כולסטרול אל הרקמות ואל דופן העורקים.', src: 'mlp-lipid' },
  { id: 'hdl', does: 'מחזיר כולסטרול מהעורקים אל הכבד.',  alias: ['HDL CHOLESTEROL', 'HDL-C', 'HDL'], he: 'HDL', g: 'fats', what: 'הנשא שמחזיר כולסטרול אל הכבד.', src: 'mlp-lipid' },
  { id: 'tg', moves: ['אכילה ואלכוהול לפני הבדיקה', 'תזונה', 'סוכרת', 'תורשה'],  alias: ['TRIGLYCERIDES', 'TG'], he: 'טריגליצרידים', g: 'fats', what: 'שומן אנרגיה שנישא בדם.', src: 'mlp-lipid' },
  // Hormones and vitamins
  { id: 'tsh', hl: ['pituitary'], where: 'יותרת המוח', from: 'יותרת המוח, בבסיס המוח.', does: 'קובע כמה הורמון תריס ייוצר, ודרכו את קצב הגוף.', moves: ['בלוטת התריס', 'ביוטין בתוספים', 'הריון', 'מחלה חריפה'],  alias: ['TSH'], he: 'TSH', g: 'hormones', what: 'ההודעה של יותרת המוח לבלוטת התריס.', src: 'mlp-thyroid' },
  { id: 'ft4', hl: ['thyroid'], where: 'בלוטת התריס', from: 'בלוטת התריס, בצוואר.', does: 'קובע את קצב חילוף החומרים בכל תא.', moves: ['יותרת המוח', 'יוד', 'ביוטין בתוספים', 'הריון'],  alias: ['FREE T4', 'FT4'], he: 'T4 חופשי', g: 'hormones', what: 'ההורמון שבלוטת התריס שולחת לכל הגוף.', src: 'mlp-thyroid' },
  { id: 'ferr', ...LIVER, where: 'הכבד, מחסן הברזל', from: 'הכבד והטחול, מחסני הברזל.', does: 'מאגר הברזל לייצור המוגלובין.', moves: ['תזונה', 'דימום, גם וסת', 'דלקת, שמעלה אותו', 'מחלת כבד'],  alias: ['FERRITIN'], he: 'פריטין', g: 'hormones', what: 'מחסן הברזל של הגוף.', src: 'mlp-ferritin' },
  { id: 'b12', sys: 'digestive', hl: ['stomach', 'small'], where: 'הקיבה והמעי הדק', from: 'מזון מן החי. נספג במעי הדק, בעזרת חלבון מהקיבה.', does: 'בונה תאי דם ומעטפת לעצבים.', moves: ['תזונה צמחית', 'ניתוח או דלקת בקיבה', 'תרופות לחומציות', 'גיל'],  alias: ['VITAMIN B12', 'B12'], he: 'ויטמין B12', g: 'hormones', what: 'ויטמין לבניית תאי דם ולמעטפת העצבים.', src: 'mlp-b12' },
  { id: 'vitd', sys: 'skeletal', hl: ['skull', 'spine', 'thorax', 'pelvis', 'arms', 'legs'], where: 'העצמות', from: 'העור באור השמש, והמזון.', does: 'עוזר לספוג סידן ולבנות עצם.', moves: ['חשיפה לשמש', 'עונת השנה', 'גוון העור', 'תוספים'],  alias: ['VITAMIN D', '25-OH VITAMIN D', '25(OH)D'], he: 'ויטמין D', g: 'hormones', what: 'ויטמין שהעור מייצר באור, וחיוני לספיגת סידן.', src: 'mlp-vitd' },
  // Inflammation
  { id: 'crp', alias: ['CRP', 'C-REACTIVE PROTEIN'], he: 'CRP', g: 'inflam', what: 'חלבון שהכבד מייצר כשיש דלקת בגוף.', src: 'mlp-crp' },
];

// Lines that are quality marks of the sample, not results.
export const LAB_SKIP = ['ICTERIC', 'HEMOLYTIC', 'LIPEMIC'];
