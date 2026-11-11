// Example cases: one real person's path through a disease, shown at her own request and with her approval.
// A case is a single story, not a rule. It carries no advice, and the page that draws it does not interpret it.
// `report` feeds lab/pathology.html (the same fields as its form, in millimetres).
export const CASES = [
  {
    id: 'anat',
    disease: 'breast-cancer',
    name_he: 'ענת שטיבלמן',
    consent_he: 'מוצג לבקשתה ובאישורה. מקרה אחד, ולא כלל.',
    headline_he: 'גוש של **12** מ״מ בשד שמאל, שהתגלה בבדיקת סקר.',
    tile_he: 'הגידול, השוליים ובלוטות הזקיף, על מודל הגוף.',
    image: 'img/case-anat.jpg',
    source_he: 'מכתב סיכום ודוח פתולוגי, 2026. מסמכים אישיים, באישור בעלת המקרה.',
    steps: [
      { k: 'סקר', view: 'body', text_he: 'ממוגרפיה של **בדיקת סקר** מצאה אסימטריה בשד שמאל. לא היה גוש שהורגש קודם.' },
      { k: 'הדמיה', view: 'body', text_he: 'אולטרסאונד: גוש של כ-**10** מ״מ בשד שמאל, ב**שעה 8**, מאחורי העטרה. המקום סומן בקליפ.' },
      { k: 'ביופסיה', view: 'spec', text_he: 'דגימת מחט: **קרצינומה פולשנית של הצינורות** (IDC), דרגה **2**. קולטני אסטרוגן חיוביים. פרוגסטרון ו-HER2 שליליים.' },
      { k: 'ניתוח', view: 'spec', text_he: '**כריתה חלקית**: הגוש יצא עם שכבת רקמה סביבו. מבית השחי נלקחו **2** בלוטות זקיף.' },
      { k: 'פתולוגיה', view: 'spec', text_he: 'גידול פולשני של **12** מ״מ, ומסביבו DCIS עד **30** מ״מ. השוליים נקיים מגידול פולשני. ה-DCIS מגיע עד **0.5** מ״מ מהשוליים הקדמיים.' },
      { k: 'בלוטות', view: 'nodes', text_he: 'באחת משתי בלוטות הזקיף נמצאה **גרורה של 4 מ״מ**. בשנייה לא נמצאה גרורה.' },
      { k: 'הרחבה', view: 'ext', text_he: 'בהרחבת השוליים, בצד התחתון־מדיאלי: **3** צינורות עם DCIS, במרחק **2.6** מ״מ מהשוליים החדשים.' },
    ],
    report: {
      side: 'L', clock: '8', near: 'retro', ml: 30, si: 45, ap: 35,
      inkLat: 'black', inkMed: 'black', inkSup: 'yellow', inkInf: 'green', inkAnt: 'red', inkPost: 'blue',
      idc: 12, grade: '2', dcis: 30, lvi: 'yes',
      gSup: 20, gInf: 7, gAnt: 3, gPost: 10, gLat: 17, gMed: 6,
      dSup: '', dInf: '', dAnt: '0.5', dPost: '<2', dLat: '<2', dMed: '<2',
      er: '+3', pr: 'שלילי', her2: '0', ki67: '15',
      n1a: 9, n1b: 7, n1c: 4, n1met: 4, n2a: 7, n2b: 6, n2c: 3, n2met: 0,
      ext: 'yes', extWhere: 'inf-med', extA: 30, extB: 20, extC: 10, extDucts: 3, extMargin: '2.6',
    },
  },
];
export const casesFor = (diseaseId) => CASES.filter((c) => c.disease === diseaseId);
