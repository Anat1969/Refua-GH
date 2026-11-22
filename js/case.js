// Example cases: one real person's path through a disease, shown at her own request and with her approval.
// A case is a single story, not a rule. It carries no advice, and the page that draws it does not interpret it.
// `report` feeds lab/pathology.html (the same fields as its form, in millimetres).
// `pet` is the PET-CT after the operation: every line is what the report wrote, region by region.
//   heat is a drawing level (0 to 1), not a measurement: the report gives no uptake numbers.
//   The source document is kept with the personal details blacked out (docs/case/).
export const CASES = [
  {
    id: 'anat',
    disease: 'breast-cancer',
    name_he: 'ענת שטיבלמן',
    consent_he: 'מוצג לבקשתה ובאישורה. מקרה אחד, ולא כלל.',
    headline_he: 'גוש של **12** מ״מ בשד שמאל, שהתגלה בבדיקת סקר.',
    tile_he: 'הגידול, השוליים ובלוטות הזקיף, על מודל הגוף.',
    image: 'img/case-anat.jpg',
    source_he: 'מכתב סיכום, דוח פתולוגי וסיכום PET-CT, 2026. מסמכים אישיים, באישור בעלת המקרה.',
    steps: [
      { k: 'סקר', view: 'body', text_he: 'ממוגרפיה של **בדיקת סקר** מצאה אסימטריה בשד שמאל, בחלק **החיצוני־התחתון**. לא היה גוש שהורגש קודם.' },
      { k: 'הדמיה', view: 'body', text_he: 'אולטרסאונד: גוש של כ-**10** מ״מ בשד שמאל, ב**שעה 8**, מאחורי העטרה. המקום סומן בקליפ.' },
      { k: 'ביופסיה', view: 'spec', text_he: 'דגימת מחט: **קרצינומה פולשנית של הצינורות** (IDC), דרגה **2**. קולטני אסטרוגן חיוביים. פרוגסטרון ו-HER2 שליליים.' },
      { k: 'ניתוח', view: 'spec', text_he: '**כריתה חלקית**: הגוש יצא עם שכבת רקמה סביבו. מבית השחי נלקחו **2** בלוטות זקיף.' },
      { k: 'פתולוגיה', view: 'spec', text_he: 'גידול פולשני של **12** מ״מ, ומסביבו DCIS עד **30** מ״מ. השוליים נקיים מגידול פולשני. ה-DCIS מגיע עד **0.5** מ״מ מהשוליים הקדמיים.' },
      { k: 'בלוטות', view: 'nodes', text_he: 'באחת משתי בלוטות הזקיף נמצאה **גרורה של 4 מ״מ**. בשנייה לא נמצאה גרורה.' },
      { k: 'הרחבה', view: 'ext', text_he: 'בהרחבת השוליים, בצד התחתון־מדיאלי: **3** צינורות עם DCIS, במרחק **2.6** מ״מ מהשוליים החדשים.' },
      { k: 'PET-CT', view: 'pet', text_he: 'סריקת **כל הגוף** אחרי הניתוח: קליטה ב**שינויים שאחרי הניתוח**, בשד שמאל ובבית השחי. **בלי הגדלה של בלוטות לימפה**, בשום תחנה.' },
    ],
    report: {
      side: 'L', clock: '8', quad: 'lo', near: 'retro', ml: 30, si: 45, ap: 35,
      inkLat: 'black', inkMed: 'black', inkSup: 'yellow', inkInf: 'green', inkAnt: 'red', inkPost: 'blue',
      idc: 12, grade: '2', dcis: 30, lvi: 'yes',
      gSup: 20, gInf: 7, gAnt: 3, gPost: 10, gLat: 17, gMed: 6,
      dSup: '', dInf: '', dAnt: '0.5', dPost: '<2', dLat: '<2', dMed: '<2',
      er: '+3', pr: 'שלילי', her2: '0', ki67: '15',
      n1a: 9, n1b: 7, n1c: 4, n1met: 4, n2a: 7, n2b: 6, n2c: 3, n2met: 0,
      ext: 'yes', extWhere: 'inf-med', extA: 30, extB: 20, extC: 10, extDucts: 3, extMargin: '2.6',
    },
    pet: {
      date_he: '16.11.2026',
      doc: 'docs/case/anat-pet-ct-2026-11-16.pdf',
      why_he: 'מעקב, אחרי כריתה חלקית בשד שמאל.',
      how_he: ['הסמן: **FDG**, סוכר מסומן. הוזרק ב**כף יד ימין**.', 'הסריקה התחילה **60** דקות אחרי ההזרקה.', 'חומר ניגוד ל-CT: בשתייה ובווריד.'],
      // what lit up, as written. where: a place in the model; size in millimetres only when the report wrote it.
      spots: [
        { id: 'breast', where: 'breast-med', mm: 29, heat: 0.72, he: 'קולקציה אחרי הניתוח', line_he: 'צד מדיאלי של שד שמאל', said_he: 'קליטה מוגברת בשינויים שאחרי הניתוח, בצד המדיאלי של שד שמאל. רושם לקולקציה בקוטר **29** מ״מ.' },
        { id: 'axilla', where: 'axilla', heat: 0.62, he: 'שינויים אחרי הניתוח', line_he: 'בית השחי השמאלי. גודל לא נכתב', said_he: 'קליטה מוגברת בשינויים שאחרי הניתוח, בבית השחי השמאלי.' },
        { id: 'thyroid', where: 'thyroid', heat: 0.7, he: 'בלוטת התריס', line_he: 'קליטה מפושטת, בשתי האונות', said_he: 'קליטה מפושטת מוגברת בבלוטת התריס, בשתי האונות. בלשון הדוח: "יכול להתאים לתיירואידיטיס".' },
        { id: 'groin', where: 'groin', heat: 0.5, he: 'בלוטות המפשעה', line_he: 'בשני הצדדים. בדוח: "ריאקטיבי"', said_he: 'קליטה מוגברת בבלוטות המפשעה, בשני הצדדים. בלשון הדוח: "ריאקטיבי". הבלוטות לא מוגדלות.' },
        { id: 'liver', where: 'liver-4a', heat: 0.75, he: 'נקודה בכבד, סגמנט 4A', line_he: 'בדוח: "ככל הנראה ארטיפקט"', said_he: 'קליטה מוקדית לא ספציפית בכבד, בסגמנט 4A. בלשון הדוח: "ככל הנראה ארטיפקט", להמשך מעקב.' },
      ],
      // where nothing was found, in the order of the report
      clear: [
        ['ראש', 'בלי קליטה פתולוגית.'],
        ['צוואר', 'בלי הגדלה של בלוטות לימפה.'],
        ['בתי השחי, המדיאסטינום ושערי הריאות', 'בלי הגדלה של בלוטות לימפה.'],
        ['ריאות', 'בלי קליטה פתולוגית, ובלי נגעים מוקדיים.'],
        ['בטן, אגן ומפשעות', 'בלי הגדלה של בלוטות לימפה. הכבד, הטחול, הלבלב והכליות תקינים ב-CT.'],
        ['שלד, שריר ורקמה רכה', 'בלי קליטה פתולוגית, ובלי נגעים בשלד.'],
      ],
      summary_he: 'סיכום הדוח: שינויים שאחרי הניתוח בשד ובבית השחי השמאלי, וסימני תיירואידיטיס.',
    },
  },
];
export const casesFor = (diseaseId) => CASES.filter((c) => c.disease === diseaseId);
