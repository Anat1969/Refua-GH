// ארבעה תוצרים, ארבעה מנגנוני חשיבה: כתבה, מאמר, מסה ויצירה. המקור: Claude-GH, .claude/skills/anat-outputs/SKILL.md.
// שלוש שרשראות. בכל אחת הכתבה מעלה שאלה, המאמר מזהה סתירה, המסה מולידה יצירה.
// כל פסקה מסומנת ברמת ידע, וכל עובדה מצביעה על רשומה באטלס: e: גילוי בציר הזמן, d: מחלה, s: מערכת, src: מקור.
// בלי עובדות חדשות: כל מה שמסומן "עובדה" כבר כתוב ב-js/data.js, עם המקור שלו.
import { SYSTEMS, DISEASES, TIMELINE, SOURCES } from './data.js';
import { forge, TOPICS, topicName, NEXT } from './forge.js';
import { loadOutputs, addOutput, flushPending } from './cloud.js';

export const KINDS = [
  { id: 'story', name: 'כתבה', mechanism: 'תחקיר', purpose: 'להנגיש ידע בסיפור שמעורר סקרנות.', reader: 'קוראת סקרנית, 5 דקות',
    process: ['בוחרים רגע אחד: גילוי, דמות או אירוע', 'אוספים עובדות מאומתות: מי, מה, מתי, איפה', 'בונים הקשר היסטורי ותרבותי', 'מחפשים פרט מפתיע', 'בודקים כל עובדה מול מקור'],
    structure: ['פתיחה בסצנה', 'השאלה שהיא מעוררת', '3 עד 5 פרקים לפי זמן', 'ההקשר', 'תובנה בשורה', 'שאלה פתוחה', 'מקורות'],
    quality: ['כל פרק נשען על עובדה עם מקור', 'יש סצנה, דמות, זמן ומקום', 'פרשנות מסומנת כפרשנות', 'מסתיימת בשאלה אמיתית'], },
  { id: 'paper', name: 'מאמר', mechanism: 'ניתוח', purpose: 'לענות על שאלה ולומר כמה אפשר לסמוך על התשובה.', reader: 'קוראת חוקרת, 7 עד 10 דקות',
    process: ['מנסחים שאלה אחת או טענה שאפשר להפריך', 'אוספים מקורות, גם סותרים', 'משווים מה כל מקור אומר', 'מבקרים: הטיה, מדגם, תקופה', 'בוחנים סתירות', 'מכריעים עם מד ודאות'],
    structure: ['השאלה', 'למה היא חשובה', 'השיטה', 'הראיות', 'השוואה וביקורת', 'הסתירות', 'מסקנה ומד ודאות', 'גבולות ומה לא ידוע', 'מקורות'],
    quality: ['השאלה ניתנת לבדיקה', 'יש מקור שסותר או מסייג', 'המסקנה לא חזקה מהראיות', 'נאמר מה לא הוכח'], },
  { id: 'essay', name: 'מסה', mechanism: 'חקירה רעיונית', purpose: 'להעלות שאלה חדשה, טובה מזו שהתחילה.', reader: 'קוראת חושבת, 5 עד 8 דקות',
    process: ['בוחרים הנחת יסוד מקובלת', 'מחפשים את הדפוס בתחום רחוק', 'מניחים מקרים זה ליד זה', 'מערערים: מה אם ההפך?', 'לא סוגרים: מנסחים שאלה חדשה'],
    structure: ['הנחה', 'סדק', 'מסע בין תחומים', 'ערעור', 'שאלה חדשה', 'מה עובדה ומה מחשבה', 'מקורות'],
    quality: ['לפחות שני תחומים רחוקים', 'מנגנון משותף, לא רק דמיון', 'השאלה בסוף חדשה', 'אין מסקנה סגורה'], },
  { id: 'creation', name: 'יצירה', mechanism: 'דמיון מבוסס', purpose: 'ליצור רעיון, עולם אפשרי, ניסוי מחשבתי או משמעות חדשה.', reader: 'במבט אחד, עד 2 דקות',
    process: ['בוחרים עובדה או מנגנון מאומת', 'משנים כלל אחד: "מה אם..."', 'בונים את העולם שנובע מהשינוי', 'בוחרים צורה', 'מצמידים את הבסיס עם מקור'],
    structure: ['הבסיס עם מקור', 'המהלך', 'היצירה, מסומנת כדמיון', 'מה היא מאירה', 'לאן זה מוביל'],
    quality: ['נקלטת במבט או בדקה', 'הבסיס אמיתי ומקושר', 'הדמיון עקבי עם הכלל שהשתנה', 'אין בלבול בין מה שקרה למה שהומצא'], },
];
export const kindById = Object.fromEntries(KINDS.map((k) => [k.id, k]));
export const LEVEL = { fact: 'עובדה', interpretation: 'פרשנות', hypothesis: 'השערה', imagination: 'דמיון' };
const CERTAINTY = { established: 'מבוסס', likely: 'סביר', open: 'לא מוכרע' };
export const CHAINS = [['blood', 'הדם שחוזר'], ['pump', 'המשאבה ברחוב'], ['memory', 'הזיכרון שבחיסון']];

const F = (text, refs) => ({ level: 'fact', text, refs });
const I = (text, h) => ({ level: 'interpretation', text, h });
const H = (text, h, refs) => ({ level: 'hypothesis', text, h, refs });
const M = (text) => ({ level: 'imagination', text, h: 'היצירה' });

export const OUTPUTS = [
  // שרשרת 1: הדם שחוזר (גלנוס, וסאליוס, הארווי)
  { id: 'o-story-harvey', kind: 'story', chain: 'blood', derivedFrom: null, title: 'השאלה של הארווי', lead: '1,400 שנה האמינו שהכבד מייצר את הדם. אדם אחד שאל כמה.',
    blocks: [
      { ...F('כ-170, ברומא, לימד **גלנוס** שהדם נוצר בכבד מן המזון, ונצרך באיברים. התורה הזאת החזיקה כ-1,400 שנה.', ['e:galen']), h: 'הסצנה' },
      F('ב-1543, בפדובה, פרסם **וסאליוס** אטלס אנטומי מנתיחה של גוף האדם, שתיקן טעויות של גלנוס.', ['e:vesalius', 'src:vesalius-1543']),
      F('ב-1628, בלונדון, שאל **הארווי** כמה דם יוצא מהלב בשעה. התשובה: יותר ממה שהגוף יכול לייצר. ולכן הדם **מסתובב במעגל**.', ['e:harvey', 'src:harvey-1628']),
      F('היום ידוע שבמנוחה הלב מזרים כ-**5** ליטר דם בדקה.', ['s:cardio', 'src:guyton-2020']),
      I('==מה שהפיל תורה בת 1,400 שנה לא היה מכשיר חדש, אלא שאלה של כמות.==', 'התובנה'),
    ],
    question: 'אילו תורות מחזיקות היום רק כי איש עוד לא שאל "כמה"?',
    transition: { to: 'paper', why: 'כדי לדעת מה הפיל את גלנוס, צריך להשוות שתי דרכים: נתיחה וחשבון.' } },
  { id: 'o-paper-galen', kind: 'paper', chain: 'blood', derivedFrom: 'o-story-harvey', certainty: 'likely', title: 'נתיחה או חשבון: מה הפיל את גלנוס?', lead: 'שתי דרכים לתקן תורה: לראות שהיא טועה, או להראות שהיא לא אפשרית.',
    blocks: [
      I('האם האטלס של וסאליוס, או החשבון של הארווי, הוא שהפיל את תורת הדם של גלנוס?', 'השאלה'),
      { ...F('וסאליוס, 1543: נתיחה של גוף האדם, שתיקנה טעויות של גלנוס.', ['e:vesalius', 'src:vesalius-1543']), h: 'הראיות' },
      F('הארווי, 1628: הלב מזרים בשעה יותר דם ממה שהגוף יכול לייצר.', ['e:harvey', 'src:harvey-1628']),
      I('הנתיחה הראתה שגלנוס **טעה בפרטים**. החשבון הראה שהמודל עצמו **לא אפשרי**. זה ההבדל בין תיקון להחלפה.', 'השוואה וביקורת'),
      H('ייתכן ששתיהן נדרשו: בלי מפה מדויקת של הלב, לחשבון לא היה על מה לעמוד. איך בודקים: האם הארווי נשען על האנטומיה של וסאליוס ושל תלמידיו.', 'הסתירה'),
      I('**סביר:** החשבון הכריע, והנתיחה הכינה את הקרקע.', 'מסקנה'),
      I('המקורות באפליקציה הם סיכום היסטורי (Porter) ופרק אחד מהארווי, ולא כל כתביו. המסקנה לא חזקה מזה.', 'גבולות'),
    ],
    question: 'כשתיקון מצטבר נגמר ומגיעה החלפה, מה מסמן את הרגע?',
    transition: { to: 'essay', why: 'הסתירה בין 85 שנות תיקון לבין תורה שלא נפלה היא שאלה רעיונית, לא היסטורית.' } },
  { id: 'o-essay-persist', kind: 'essay', chain: 'blood', derivedFrom: 'o-paper-galen', title: 'תורה שמחזיקה 1,400 שנה', lead: 'טעות לא מפילה תורה. אולי רק רשת אחרת מפילה אותה.',
    blocks: [
      I('ההנחה המקובלת: תורה שגויה נופלת כשמתגלה בה טעות.', 'הנחה'),
      { ...F('וסאליוס תיקן טעויות של גלנוס ב-1543, והמעגל של הארווי הגיע רק ב-1628, **85** שנה אחר כך.', ['e:vesalius', 'e:harvey']), h: 'סדק' },
      F('ב-1847, בווינה, הראה **סמלווייס** ששטיפת ידיים של רופאים הורידה את התמותה מקדחת לידה. עמיתיו דחו אותו.', ['e:semmelweis']),
      I('בעיר, רחוב שתוכנן לעגלות נשאר רחוב גם כשהעגלות נעלמו: הרשת מחזיקה את הצורה. גם תורה היא רשת של מורים, ספרים ומונחים שנשענים זה על זה.', 'מסע בין תחומים'),
      H('אולי טעות לא מפילה תורה, ורק רשת חלופית מפילה אותה: המעגל של הארווי, או תורת החיידקים שהחליפה את תורת המיאזמה אחרי קוך, 1882.', 'ערעור', ['e:koch']),
      I('==לא "מתי מתגלה הטעות", אלא "מתי נבנית הרשת שתחליף אותה".==', 'שאלה חדשה'),
    ],
    question: 'איזו רשת חלופית נבנית היום, בלי שעוד יודעים מה היא תחליף?',
    transition: { to: 'creation', why: 'אם התורה היא רשת, אפשר לתת קול לאיבר שהיא שמה במרכז שלא בצדק.' } },
  { id: 'o-creation-liver', kind: 'creation', chain: 'blood', derivedFrom: 'o-essay-persist', form: 'מכתב', title: 'מכתב מהכבד לגלנוס', lead: 'האיבר שקיבל 1,400 שנה של קרדיט עונה.',
    blocks: [
      { ...F('גלנוס לימד שהדם נוצר בכבד מן המזון. התורה החזיקה כ-1,400 שנה.', ['e:galen']), h: 'הבסיס' },
      I('מה אם הכבד היה יכול לענות, אחרי הארווי?', 'המהלך'),
      M('גלנוס היקר, תודה על האמון. במשך ארבעה־עשר מאות שנים האמנתם שאני מייצר את כל הדם. אני עובד קשה, זה נכון. אבל את הדם אני רק פוגש בדרכו: הוא עובר בי, עוזב וחוזר. מי שגילה זאת לא פתח אותי. הוא רק ספר. בהוקרה, הכבד.'),
      I('המכתב מראה שהטעות של גלנוס לא הייתה טיפשות: הוא נתן לאיבר עמוס תפקיד של מערכת שלמה.', 'מה היא מאירה'),
      H('איזה איבר מקבל היום קרדיט שאינו שלו? איך בודקים: עוברים על כרטיסי המערכות באטלס, ומחפשים "פלא" שמיוחס לאיבר אחד.', 'לאן זה מוביל', ['s:cardio']),
    ],
    question: 'מה היה כותב הלב בחזרה?',
    transition: { to: 'story', why: 'כל יצירה מחזירה לרגע אמיתי: כתבה חדשה על איבר אחר.' } },

  // שרשרת 2: המשאבה ברחוב (סנואו, סמלווייס, קוך)
  { id: 'o-story-pump', kind: 'story', chain: 'pump', derivedFrom: null, title: 'ידית המשאבה', lead: 'לונדון, 1854. מפה של מקרי כולרה, ומשאבת מים אחת.',
    blocks: [
      { ...F('ב-1854, בלונדון, שרטט **ג׳ון סנואו** מפה של מקרי **כולרה**. היא הובילה למשאבת מים אחת. ידית המשאבה הוסרה, והאפידמיולוגיה נולדה.', ['e:snow', 'src:snow-1855']), h: 'הסצנה' },
      F('שבע שנים קודם, ב-1847 בווינה, הראה סמלווייס ששטיפת ידיים מורידה תמותה, ונדחה.', ['e:semmelweis']),
      F('ב-1882, בברלין, זיהה **קוך** את החיידק שגורם לשחפת. תורת החיידקים מחליפה את תורת המיאזמה.', ['e:koch']),
      I('סנואו עבד לפני שתורת החיידקים התבססה: הוא מצא **איפה** בלי לדעת **מה**.', 'ההקשר'),
      I('==מפה יכולה להצביע על סיבה עוד לפני שיודעים מה היא.==', 'התובנה'),
    ],
    question: 'אילו מפות של היום מצביעות על סיבה שעוד אין לה שם?',
    transition: { to: 'paper', why: 'הטענה "מפה מצביעה על סיבה" ניתנת לבדיקה, ולכן היא מאמר.' } },
  { id: 'o-paper-map', kind: 'paper', chain: 'pump', derivedFrom: 'o-story-pump', certainty: 'likely', title: 'האם מפה יכולה להוכיח סיבה?', lead: 'מקום מצמצם את החיפוש. גורם סוגר אותו.',
    blocks: [
      I('האם מפת המקרים של סנואו הוכיחה שהמים הם הסיבה, או רק הצביעה עליהם?', 'השאלה'),
      { ...F('סנואו, 1854: המפה הובילה למשאבה אחת, והידית הוסרה.', ['e:snow', 'src:snow-1855']), h: 'הראיות' },
      F('קוך, 1882: זיהוי החיידק שגורם לשחפת, ותורת החיידקים מחליפה את המיאזמה.', ['e:koch']),
      I('המפה הראתה **מקום**. המעבדה הראתה **גורם**. הסרת הידית הייתה גם פעולה וגם ניסוי.', 'השוואה וביקורת'),
      H('ייתכן שהמגפה כבר דעכה כשהידית הוסרה, ואז ההסרה לא מוכיחה דבר לבדה. איך בודקים: ספירת המקרים לפי יום, בספר של סנואו מ-1855.', 'הסתירה', ['src:snow-1855']),
      I('**סביר:** המפה הצביעה, והפעולה בדקה. הגורם עצמו קיבל הסבר רק עם תורת החיידקים.', 'מסקנה'),
      I('באפליקציה יש את ספרו של סנואו ואת הסיכום של Porter, אבל לא את נתוני המקרים עצמם. לכן המסקנה נשארת "סביר".', 'גבולות'),
    ],
    question: 'מתי מקום לבדו מספיק כדי לפעול, גם בלי לדעת את הגורם?',
    transition: { to: 'essay', why: 'אם משאבה ברחוב היא סיבה למחלה, הגבול בין גוף לעיר נסדק.' } },
  { id: 'o-essay-city', kind: 'essay', chain: 'pump', derivedFrom: 'o-paper-map', title: 'הגוף כעיר, העיר כגוף', lead: 'איפה נגמר הגוף: בעור, במעי, או בצינור המים של הרחוב?',
    blocks: [
      I('ההנחה: רפואה עוסקת בגוף אחד, ותכנון עיר עוסק ברחובות.', 'הנחה'),
      { ...F('ב-1854 הסיבה לכולרה בשכונה אחת בלונדון הייתה משאבת מים אחת ברחוב.', ['e:snow']), h: 'סדק' },
      F('ב-1948 הגדירה WHO בריאות כרווחה גופנית, נפשית וחברתית, ולא רק היעדר מחלה.', ['e:who', 'src:who-constitution']),
      F('במכון ויצמן ספרו: בגוף כ-**38** טריליון חיידקים, בערך כמספר תאי הגוף.', ['e:weizmann', 'src:sender-2016']),
      I('האטלס הזה קורא את הגוף כעיר של רשתות: אספקה, תקשורת, אוורור וניקוז. אם בריאות היא גם חברתית, המשאבה ברחוב היא איבר של הגוף הציבורי, והרחוב הוא כלי דם.', 'מסע בין תחומים'),
      H('אולי הגבול בין גוף לסביבה הוא הסכם, ולא עובדה: בערך מחצית מהתאים שבתוכנו אינם תאי אדם.', 'ערעור'),
      I('==איפה נגמר הגוף, ומי אחראי על החלק שמחוץ לעור?==', 'שאלה חדשה'),
    ],
    question: 'אם הרחוב הוא כלי דם, מי הרופא שלו?',
    transition: { to: 'creation', why: 'משאבה שהיא איבר אפשר לתת לה יומן.' } },
  { id: 'o-creation-pump', kind: 'creation', chain: 'pump', derivedFrom: 'o-essay-city', form: 'יומן', title: 'יומן המשאבה ברחוב ברוד', lead: 'שלושה ימים, מנקודת המבט של מי שאיש לא חשד בה.',
    blocks: [
      { ...F('ב-1854 הובילה המפה של סנואו למשאבת מים אחת, וידית המשאבה הוסרה.', ['e:snow']), h: 'הבסיס' },
      I('מה אם המשאבה הייתה כותבת יומן?', 'המהלך'),
      M('שלישי. כולם באים אליי. אני המים הכי טעימים ברחוב, כך אומרים. רביעי. פחות דליים. אדם עם מחברת סופר דלתות, ומסמן נקודות על נייר. חמישי. לקחו לי את הידית. אני עומדת ברחוב, ואיש לא שותה. בפעם הראשונה, השתיקה שלי מצילה.'),
      I('הפעולה הקטנה ביותר, הסרת ידית, הייתה גם הניסוי. המחברת של סנואו היא הגיבורה השקטה.', 'מה היא מאירה'),
      H('איזו "ידית" אחת בעיר של היום היא גם פעולה וגם ניסוי? איך בודקים: מקום אחד, מדידה לפני ואחרי.', 'לאן זה מוביל'),
    ],
    question: 'מה היה כותב האיש עם המחברת?',
    transition: { to: 'story', why: 'כל יצירה מחזירה לרגע אמיתי: כתבה חדשה על מפה אחרת.' } },

  // שרשרת 3: הזיכרון שבחיסון (ג׳נר, אבעבועות שחורות, WHO)
  { id: 'o-story-memory', kind: 'story', chain: 'memory', derivedFrom: null, title: 'מאבעבועות הבקר ועד ז׳נבה', lead: '184 שנה בין חיסון ראשון למחלה שנמחקה.',
    blocks: [
      { ...F('ב-1796, בברקלי, הראה **ג׳נר** שחשיפה ל**אבעבועות הבקר** הגנה מפני **אבעבועות שחורות**. זה החיסון הראשון.', ['e:jenner']), h: 'הסצנה' },
      F('ב-1980, בז׳נבה, הוכרזו **אבעבועות שחורות** כמוכחדות: המחלה הראשונה שהאנושות מחקה, בזכות חיסון.', ['e:smallpox', 'src:who-smallpox']),
      F('לפי WHO, חיסונים מצילים **3.5** עד **5** מיליון חיים בשנה, בזכות הזיכרון שהם מלמדים.', ['s:immune', 'src:who-immunization']),
      I('בין הצעד הראשון למחיקה עברו **184** שנה: החיסון עבד מיד, ההכחדה דרשה מאות שנים של רשת.', 'ההקשר'),
      I('==החיסון לא מוסיף לגוף כוח. הוא מלמד אותו לזכור.==', 'התובנה'),
    ],
    question: 'מה עוד אפשר ללמד מערכת לזכור, בלי שתפגוש את הסכנה עצמה?',
    transition: { to: 'paper', why: 'המספר "3.5 עד 5 מיליון" מבקש בדיקה: מה הוא סופר, ומה הוא לא.' } },
  { id: 'o-paper-lives', kind: 'paper', chain: 'memory', derivedFrom: 'o-story-memory', certainty: 'likely', title: 'כמה חיים חוסך הזיכרון?', lead: 'טווח ולא מספר: מה אומר האומדן, ומה הוא לא יכול לספור.',
    blocks: [
      I('כמה חיים חוסכים חיסונים בשנה, וכמה אפשר לסמוך על המספר?', 'השאלה'),
      { ...F('WHO: **3.5** עד **5** מיליון חיים בשנה.', ['src:who-immunization', 's:immune']), h: 'הראיות' },
      F('אבעבועות שחורות הוכרזו כמוכחדות ב-1980.', ['e:smallpox', 'src:who-smallpox']),
      I('המספר הוא אומדן של מודל, ולכן הוא **טווח** ולא מספר אחד. הטווח עצמו הוא סימן של כנות.', 'השוואה וביקורת'),
      H('מחלה שנמחקה לא נספרת באומדן שנתי: החיים שהיא כבר לא לוקחת נעלמים מהחשבון. איך בודקים: לקרוא אילו מחלות נכללות באומדן של WHO.', 'הסתירה', ['src:who-immunization']),
      I('**מבוסס** שחיסונים מצילים. **סביר** שהטווח נכון. **לא מוכרע** כמה חוסכת מחלה שכבר אינה.', 'מסקנה'),
      I('האפליקציה מחזיקה את דף העובדות של WHO, ולא את המודל עצמו. לכן הבדיקה נשארת שאלה.', 'גבולות'),
    ],
    question: 'איך סופרים את מה שלא קרה?',
    transition: { to: 'essay', why: 'השאלה "איך סופרים את מה שלא קרה" היא שאלה על זיכרון ועל שכחה.' } },
  { id: 'o-essay-forget', kind: 'essay', chain: 'memory', derivedFrom: 'o-paper-lives', title: 'מחלה שנמחקה, זיכרון שנשאר', lead: 'מה שנעלם לא חייב להישכח.',
    blocks: [
      I('ההנחה: מה שנעלם, נשכח.', 'הנחה'),
      { ...F('באטלס זו שאלה פתוחה: איך זוכרת מערכת החיסון פולש במשך עשרות שנים?', ['s:immune']), h: 'סדק' },
      F('הקאנון ברפואה של **אבן סינא** (1025) היה ספר לימוד מרכזי באוניברסיטאות של אירופה במשך מאות שנים.', ['e:avicenna']),
      I('ספרייה שומרת ספר שאיש לא קורא. מוזיאון שומר כלי שאיש לא משתמש בו. מערכת החיסון שומרת תשובה לשאלה שאולי לא תישאל.', 'מסע בין תחומים'),
      H('אולי זיכרון לא שומר את העבר, אלא מכין לעתיד שעוד לא קרה.', 'ערעור'),
      I('==מה שווה זיכרון של סכנה שנעלמה, ומי מחליט מתי מותר לשכוח?==', 'שאלה חדשה'),
    ],
    question: 'מה עיר צריכה לזכור, אחרי שהסכנה עברה?',
    transition: { to: 'creation', why: 'זיכרון שמכין לעתיד אפשר לצייר כארכיון.' } },
  { id: 'o-creation-archive', kind: 'creation', chain: 'memory', derivedFrom: 'o-essay-forget', form: 'ניסוי מחשבתי', title: 'הארכיון של הגוף', lead: 'מדף אחד מאובק, ותיק שאיש לא ביקש.',
    blocks: [
      { ...F('ג׳נר, 1796: החיסון הראשון. 1980: אבעבועות שחורות מוכחדות.', ['e:jenner', 'e:smallpox']), h: 'הבסיס' },
      I('מה אם מערכת החיסון הייתה ארכיון עם דלפק השאלה?', 'המהלך'),
      M('בקומה התחתונה, מדף אחד מאובק: אבעבועות שחורות. איש לא ביקש את התיק הזה שנים, ובכל זאת הוא לא נזרק. הארכיונאית אומרת: אנחנו לא שומרים לפי מה שמבקשים. אנחנו שומרים לפי מה שהיה מסוכן לשכוח.'),
      I('הארכיון מראה שזיכרון הוא החלטה על סכנה, לא על שימוש.', 'מה היא מאירה'),
      H('האם גם ארכיון של עיר צריך כלל כזה: לשמור לפי הסכנה שבשכחה? איך בודקים: בארכיון של תוכנית עירונית אחת, מה נשמר ולמה.', 'לאן זה מוביל'),
    ],
    question: 'מה הייתה הארכיונאית זורקת ראשון?',
    transition: { to: 'story', why: 'כל יצירה מחזירה לרגע אמיתי: כתבה חדשה על זיכרון אחר.' } },
];
// כל תוצר לדוגמה שייך לנושא באטלס, כדי ש"להפוך לסוג הבא" יבנה מאותו נושא
const CHAIN_TOPIC = { blood: 's:cardio', pump: 'd:diarrhoeal', memory: 's:immune' };
OUTPUTS.forEach((o) => { o.topic = CHAIN_TOPIC[o.chain]; });
export const outputById = Object.fromEntries(OUTPUTS.map((o) => [o.id, o]));
export const childrenOf = (id) => OUTPUTS.filter((o) => o.derivedFrom === id);

/** מקור באטלס: מה הוא, איך קוראים לו, ולאן הוא מוביל */
export function resolveRef(ref) {
  const [k, id] = ref.split(/:(.+)/);
  if (k === 'e') { const t = TIMELINE.find((x) => x.id === id); return t && { kind: 'גילוי', label: `${t.person_he}, ${t.year_he}`, href: `#v=history&e=${id}` }; }
  if (k === 'd') { const d = DISEASES.find((x) => x.id === id); return d && { kind: 'מחלה', label: d.name_he, href: `#s=${d.system}&v=disease&d=${id}` }; }
  if (k === 's') { const s = SYSTEMS.find((x) => x.id === id); return s && { kind: 'מערכת', label: s.name_he, href: `#s=${id}` }; }
  if (k === 'src') { const s = SOURCES[id]; return s && { kind: 'מקור', label: s.title, href: s.url || '#v=sources', ext: !!s.url }; }
  return null;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rich = (s) => esc(s).replace(/==(.+?)==/g, '<mark class="ins">$1</mark>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const plain = (s) => String(s).replace(/\*\*|==/g, '');

// ===== יצירה בתוך האפליקציה (כלל ענת, 25.11.2026): בלחיצה נוצר תוצר מלא, ערוך ומעוצב כלוח A4,
// ו"הוספה לאפליקציה" שומרת אותו בענן. משם: הורדה, הדפסה, שיתוף, והוא מופיע לבד במגזין "חוט".
// אין כאן פרומפט להעתקה ואין קישור ל-Claude: המנוע (js/forge.js) כותב מהנתונים, בלי AI ובלי תשלום.
const MAG = 'https://maamarim-gh.vercel.app';
const state = { kind: 'story', topic: 's:cardio', seed: 0, draft: null, saved: [], msg: '', busy: false, loaded: false };

function refChip(r) {
  const x = resolveRef(r);
  if (!x) return '';
  return `<a class="ev-chip press-soft" href="${esc(x.href)}" data-ref="${esc(r)}"${x.ext ? ' target="_blank" rel="noreferrer"' : ''}><span class="ev-kind">${x.kind}</span>${esc(x.label)}</a>`;
}

/** לוח A4: אותו לוח לתצוגה, לעריכה, להורדה ולהדפסה */
function sheet(o, { editable = false } = {}) {
  const k = kindById[o.kind];
  const ce = editable ? ' contenteditable="true" spellcheck="false"' : '';
  const from = o.derivedFrom && (outputById[o.derivedFrom] || state.saved.find((x) => x.id === o.derivedFrom));
  return `<article class="a4 out-${o.kind}" data-output="${esc(o.id || 'draft')}" dir="rtl">
    <header class="a4-band"><span class="genre">${k.name}</span><span>${k.mechanism}</span><span>${esc(topicName(o.topic) || '')}</span>${o.form ? `<span>${esc(o.form)}</span>` : ''}${from ? `<span>התפתח מ${kindById[from.kind].name}: ${esc(from.title)}</span>` : ''}</header>
    <h2 class="a4-title display" data-edit="title"${ce}>${esc(o.title)}</h2>
    <p class="a4-lead" data-edit="lead"${ce}>${esc(o.lead || '')}</p>
    ${o.certainty ? `<div class="certainty c-${o.certainty}"><span class="label">מד ודאות</span><span class="c-track">${['open', 'likely', 'established'].map((c) => `<i class="${c === o.certainty ? 'on' : ''}"></i>`).join('')}</span><b>${CERTAINTY[o.certainty]}</b></div>` : ''}
    <div class="a4-body">${o.blocks.map((b, i) => `<section class="blk blk-${b.level}" data-level="${b.level}">
      ${b.h ? `<h3 class="blk-h">${esc(b.h)}</h3>` : ''}
      <p><span class="lv lv-${b.level}">${LEVEL[b.level]}</span> <span data-edit="b${i}"${ce}>${editable ? esc(plain(b.text)) : rich(b.text)}</span></p>
      ${b.refs ? `<div class="ev-row">${b.refs.map(refChip).join('')}</div>` : ''}
    </section>`).join('')}</div>
    <p class="out-question"><span class="label">השאלה שנשארת</span> <b data-edit="question"${ce}>${esc(o.question || '')}</b></p>
    <footer class="a4-foot"><span>רפואה: גוף, מחלה, בריאות</span><span>${k.name} · לוח A4</span><span>refua-gh.vercel.app</span></footer>
  </article>`;
}

/** הלוח הוא דף A4 אמיתי (794 על 1123 פיקסלים): הגופן גדל עד שהדף מלא, ויורד עד שאין גלישה.
 *  במסך צר הדף כולו מוקטן (zoom), כך שהעימוד זהה בטלפון, במחשב ובהדפסה. */
function fitA4(root) {
  root.querySelectorAll('.a4').forEach((a) => {
    let f = 22;
    a.style.setProperty('--a4f', `${f}px`);
    while (a.scrollHeight > a.clientHeight + 1 && f > 11) { f -= 0.5; a.style.setProperty('--a4f', `${f}px`); }
    const stage = a.parentElement;
    a.style.zoom = String(Math.min(1, (stage.clientWidth - 4) / 794));
  });
}

/** קריאת העריכה מהלוח בחזרה לתוצר */
function readEdits(root, o) {
  const get = (k) => root.querySelector(`[data-edit="${k}"]`)?.textContent.trim();
  return { ...o, title: get('title') || o.title, lead: get('lead') ?? o.lead, question: get('question') ?? o.question, blocks: o.blocks.map((b, i) => ({ ...b, text: get(`b${i}`) || b.text })) };
}

function printSheet(root, o) {
  const prev = document.title;
  document.title = `${kindById[o.kind].name} - ${o.title}`; // שם הקובץ כשבוחרים "שמירה כ-PDF"
  document.body.classList.add('printing-a4');
  root.querySelector('.a4')?.classList.add('to-print');
  const done = () => { document.body.classList.remove('printing-a4'); root.querySelector('.a4.to-print')?.classList.remove('to-print'); document.title = prev; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  print();
  setTimeout(done, 1500);
}

async function share(o) {
  const url = `${location.origin}${location.pathname}#v=creations&o=${o.id}`;
  const data = { title: o.title, text: `${kindById[o.kind].name}: ${o.title}`, url };
  try { if (navigator.share) { await navigator.share(data); return 'נשלח.'; } } catch { /* בוטל */ }
  try { await navigator.clipboard.writeText(url); return 'הקישור הועתק.'; } catch { return url; }
}

function forgePanel() {
  return `<section class="forge" aria-label="יצירת תוצר">
    <h2 class="forge-h">יצירה בלחיצה</h2>
    <p class="forge-why">המנוע כותב את התוצר מתוך האטלס עצמו, ומעמד אותו כלוח A4. כל עובדה בו מגיעה עם המקור שלה. עורכים בדף, מוסיפים לאפליקציה, והוא מופיע גם במגזין "חוט".</p>
    <div class="forge-row" role="group" aria-label="סוג התוצר">${KINDS.map((k) => `<button type="button" class="chip press" data-fk="${k.id}" aria-pressed="${state.kind === k.id}">${k.name} <i>${k.mechanism}</i></button>`).join('')}</div>
    <div class="forge-row">
      <label class="forge-topic"><span class="label">על מה</span>
        <select data-ft>${['מערכות', 'מחלות'].map((g) => `<optgroup label="${g}">${TOPICS.filter((t) => t.group === g).map((t) => `<option value="${t.id}"${t.id === state.topic ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>`).join('')}</select>
      </label>
      <button type="button" class="btn solid press" data-act="forge">יצירת ${kindById[state.kind].name}</button>
    </div>
  </section>`;
}

function draftView() {
  const d = state.draft;
  return `<section class="draft" aria-label="טיוטה">
    <p class="draft-note">זו טיוטה ערוכה. אפשר לתקן כל משפט ישירות בדף, ואז להוסיף אותה לאפליקציה.</p>
    <div class="draft-acts">
      <button type="button" class="btn solid press" data-act="save"${state.busy ? ' disabled' : ''}>הוספה לאפליקציה</button>
      <button type="button" class="btn press" data-act="again">גרסה אחרת</button>
      <button type="button" class="btn press" data-act="cancel">ביטול</button>
      ${state.msg ? `<span class="draft-msg" role="status">${esc(state.msg)}</span>` : ''}
    </div>
    <div class="a4-stage">${sheet(d, { editable: true })}</div>
  </section>`;
}

function docView(o) {
  const next = kindById[NEXT[o.kind]];
  const saved = !!o.createdAt || o.local;
  return `<section class="doc" aria-label="${esc(o.title)}">
    <div class="draft-acts">
      <button type="button" class="btn solid press" data-act="pdf">הורדה כ-PDF</button>
      <button type="button" class="btn press" data-act="print">הדפסה</button>
      ${o.id && !o.local ? `<button type="button" class="btn press" data-act="share">שיתוף</button>` : ''}
      ${saved && !o.local ? `<a class="btn press" href="${MAG}" target="_blank" rel="noreferrer">במגזין "חוט"</a>` : ''}
      <button type="button" class="btn press" data-act="next" data-from="${esc(o.id)}">להפוך ל${next.name}</button>
      ${state.msg ? `<span class="draft-msg" role="status">${esc(state.msg)}</span>` : ''}
    </div>
    <div class="a4-stage">${sheet(o)}</div>
  </section>`;
}

function library(sel) {
  const card = (x) => `<a class="out-card press${sel && sel.id === x.id ? ' is-on' : ''}" href="#v=creations&o=${x.id}" data-card="${esc(x.id)}" aria-current="${!!(sel && sel.id === x.id)}"><span class="genre">${kindById[x.kind].name}</span><b>${esc(x.title)}</b><span class="oc-lead">${esc(topicName(x.topic) || '')}${x.local ? ' · ממתין לרשת' : ''}</span></a>`;
  return `<section class="lib" aria-label="ספריית התוצרים">
    <h2 class="forge-h">הספרייה <span class="num">${state.saved.length}</span></h2>
    ${state.saved.length ? `<div class="lib-grid">${state.saved.map(card).join('')}</div>` : `<p class="out-hint">${state.loaded ? 'עוד אין כאן תוצרים. יצירה בלחיצה למעלה מוסיפה את הראשון.' : 'טוען את הספרייה...'}</p>`}
    <h3 class="label lib-sub">לדוגמה: שלוש שרשראות, מכתבה ועד יצירה</h3>
    <div class="chains">
      ${CHAINS.map(([id, name]) => `<div class="chain-row" data-chain="${id}"><span class="chain-name label">${name}</span>${KINDS.map((k) => { const x = OUTPUTS.find((y) => y.chain === id && y.kind === k.id); return x ? card(x) : '<span></span>'; }).join('')}</div>`).join('')}
    </div>
  </section>`;
}

let host = null, selId = '';
function paint() {
  if (!host) return;
  const sel = outputById[selId] || state.saved.find((x) => x.id === selId) || null;
  host.innerHTML = `<section class="outputs" aria-label="ארבעה תוצרים">
    <p class="out-intro"><b>כתבה, מאמר, מסה ויצירה</b> הם ארבעה מנגנוני חשיבה. כל פסקה מסומנת: <span class="lv lv-fact">עובדה</span> <span class="lv lv-interpretation">פרשנות</span> <span class="lv lv-hypothesis">השערה</span> <span class="lv lv-imagination">דמיון</span>, וכל עובדה מצביעה על רשומה באטלס.</p>
    ${forgePanel()}
    ${state.draft ? draftView() : sel ? docView(sel) : ''}
    ${library(sel)}
  </section>`;
  fitA4(host);
}

async function onClick(e) {
  const b = e.target.closest('[data-fk], [data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (b.dataset.fk) { state.kind = b.dataset.fk; return paint(); }
  if (act === 'forge') { state.seed = 0; state.msg = ''; state.draft = forge(state.kind, state.topic, 0); paint(); host.querySelector('.draft')?.scrollIntoView({ block: 'start' }); return; }
  if (act === 'again') { state.draft = forge(state.draft.kind, state.draft.topic, ++state.seed, state.draft.derivedFrom ? { id: state.draft.derivedFrom } : null); return paint(); }
  if (act === 'cancel') { state.draft = null; state.msg = ''; return paint(); }
  if (act === 'next') {
    const from = outputById[b.dataset.from] || state.saved.find((x) => x.id === b.dataset.from);
    state.kind = NEXT[from.kind]; state.topic = from.topic; state.seed = 0; state.msg = '';
    state.draft = forge(state.kind, from.topic, 0, from); paint(); host.querySelector('.draft')?.scrollIntoView({ block: 'start' }); return;
  }
  if (act === 'save') {
    const o = readEdits(host.querySelector('.draft'), state.draft);
    state.busy = true; state.msg = 'שומר...'; paint();
    const r = await addOutput(o);
    state.busy = false;
    if (r.ok) { state.saved = [r.out, ...state.saved]; state.draft = null; state.msg = 'נוסף לאפליקציה, ויופיע גם במגזין "חוט".'; location.hash = `v=creations&o=${r.out.id}`; return; }
    if (r.local) { state.saved = [r.local, ...state.saved]; state.draft = null; }
    state.msg = r.error; return paint();
  }
  const sel = outputById[selId] || state.saved.find((x) => x.id === selId);
  if (!sel) return;
  if (act === 'pdf' || act === 'print') return printSheet(host.querySelector('.doc'), sel);
  if (act === 'share') { state.msg = await share(sel); return paint(); }
}

/** נקרא מ-app.js בכל מעבר לדף התוצרים */
export function mountOutputs(el, o) {
  if (host !== el) {
    host = el;
    el.addEventListener('click', onClick);
    el.addEventListener('change', (e) => { if (e.target.matches('[data-ft]')) { state.topic = e.target.value; } });
    flushPending().finally(() => loadOutputs().then((xs) => { state.saved = xs; state.loaded = true; paint(); }));
  }
  selId = o === 'outputs' ? '' : o;
  if (selId) state.draft = null;
  if (!state.msg.startsWith('נוסף')) state.msg = '';
  paint();
  if (selId) host.querySelector('.doc')?.scrollIntoView({ block: 'start' });
}
