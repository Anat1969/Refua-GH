# מבנה נתונים

## פריט מזון (food)
```json
{
  "id": "olive-oil",
  "name_he": "שמן זית",
  "name_en": "Olive oil",
  "category": "שמנים",
  "season": ["כל השנה"],
  "layers": {
    "known": [
      {
        "text_he": "בדיאטה ים-תיכונית עשירה בשמן זית נמצא שיעור נמוך יותר של אירועי לב.",
        "evidence": "בינונית",
        "source_id": "predimed-2018"
      }
    ],
    "said": [
      {
        "text_he": "בתנ\"ך שמן זית מסמל ברכה ואור.",
        "tradition": "מקרא",
        "source_id": "tanakh"
      }
    ],
    "believed": [
      {
        "text_he": "שמן זית על בטן ריקה מנקה את הכבד.",
        "status": "לא נבדק"
      }
    ]
  },
  "safety": {
    "flags": [],
    "notes_he": ""
  }
}
```

## כללים
- layers.known: חייב source_id ו-evidence.
- layers.said: חייב tradition ו-source_id.
- layers.believed: חייב status (לא נבדק / לא אוששה).
- safety.flags: ריק, או אחד מ: "red_list", "pregnancy", "medication_interaction", "allergen".
- אין שדות של מינון, קלוריות או "השפעה" כמותית.

## מקור (source)
```json
{
  "id": "predimed-2018",
  "title": "PREDIMED",
  "type": "ניסוי מבוקר",
  "year": 2018,
  "url": "..."
}
```

## רשימה אדומה (redlist)
באפליקציית הרפואה: `REDLIST` ב-`js/data.js`, עם השדות `risk_he`, `context_he`, `organs` (לחיבור לשאלון), `sources` ו-`last_reviewed`.
```json
{
  "id": "teucrium-polium",
  "name_he": "ג'עדה",
  "name_la": "Teucrium polium",
  "risk": "פגיעה כבדית; סיכון בשילוב אינסולין",
  "sources": ["..."],
  "last_reviewed": "YYYY-MM-DD"
}
```

## מערכת בגוף (system), באפליקציית הרפואה
המקור היחיד: `js/data.js`. אותם כללי שכבות כמו בפריט מזון.
```json
{
  "id": "cardio",
  "name_he": "הלב וכלי הדם",
  "name_en": "Cardiovascular system",
  "insight": "==**5** ליטר בדקה, וסיבת המוות המובילה.==",
  "city": "רשת הכבישים: אספקה לכל בית, ופינוי בחזרה.",
  "role": { "layer": "known", "text_he": "...", "evidence": "גבוהה", "source_id": "guyton-2020" },
  "failure": [
    { "layer": "known", "text_he": "...", "evidence": "גבוהה", "source_id": "who-ghe-2023" },
    { "layer": "said", "text_he": "...", "tradition": "רפואה יוונית-רומית", "source_id": "porter-1997" },
    { "layer": "believed", "text_he": "...", "status": "לא אוששה" }
  ],
  "action": {
    "urgency": "emergency",
    "sign_he": "כאב או לחץ בחזה, שמתפשט ליד, ללסת או לגב",
    "go_he": "מד\"א **101**, מיד",
    "source_id": "nhs-heart-attack",
    "question_he": "מה לחץ הדם שלי, ומה הוא אומר?"
  },
  "bridge": {
    "kind": "nutrition",
    "layer": "known", "text_he": "...", "evidence": "בינונית", "source_id": "predimed-2018",
    "next_he": "שמן זית",
    "link": { "app": "nutrition", "food_id": "olive-oil" }
  }
}
```

### כללים
- `role` הוא תמיד ידוע.
- `failure` כולל לפחות פריט ידוע אחד.
- `action.urgency`: "emergency" (חייב להפנות ל-101) או "doctor".
- `action.question_he`: שאלה, שמסתיימת בסימן שאלה. לא הוראה.
- טקסט: `**מודגש**`, `==תובנה==`. מספרים מודגשים אוטומטית. שם לועזי בסוגריים מוצג קטן ואפור.

## גשר: החוזה בין רפואה לתזונה
שתי האפליקציות מדברות באותם מזהים.
- `bridge.link.app`: "nutrition" או "city".
- `bridge.link.food_id`: מזהה של פריט `food` באפליקציית התזונה (למשל "olive-oil").
- `bridge.link.topic`: נושא תזונתי בלי פריט יחיד ("fiber", "calcium", "mediterranean-diet").
- `source_id` משותף: מקור שמופיע בשתי האפליקציות נושא אותו מזהה (למשל "predimed-2018", "smiles-2017", "rambam-deot").
- בכיוון ההפוך: פריט מזון יכול להחזיק `body_systems: ["cardio"]`, עם אותם מזהי מערכות: nervous, respiratory, cardio, digestive, skeletal, immune.
- כשהכתובת של אפליקציית התזונה תהיה ידועה, הקישור נבנה כך: `<nutrition-url>#food=<food_id>` או `#topic=<topic>`.

## מילות חירום (KEYWORDS)
```json
{ "id": "poison", "terms": ["הרעלה", "חשד להרעלה"], "title_he": "חשד להרעלה",
  "do_he": ["..."], "calls": ["poison", "mda"], "system": null, "plants": true }
```
- הסדר במערך הוא העדיפות: אובדנות, בליעה אצל ילד, הרעלה, הפסקת תרופה, ואחריהן סימני המערכות.
- `plants: false`: המסך לא מציג שום תוכן על צמחים (SAFETY.md, סעיף 2).
- ההתאמה ב-`js/match.js`: כל מילה במונח צריכה להופיע בשאילתה, בתחילת מילה ואחרי אותיות שימוש. מילה עד 3 אותיות רק שלמה.

## שאלון בטיחות (PROFILE_ITEMS)
- נשמר ב-`localStorage`, במפתח `refua.profile.v1`, ולא יוצא מהמכשיר.
- `special: true`: מפעיל "צמח או תוסף מרוכז: לא מתאים בלי ייעוץ" (SAFETY.md, סעיף 5).
- `organ`: מחבר לפריטים ברשימה האדומה עם אותו איבר.

## מערכת לעומק (DEEP), שלב 2
```json
{ "cardio": {
  "title_he": "מחזור הדם", "insight": "==...==", "insight_note": "...",
  "steps": [{ "seg": "cava", "name_he": "...", "layer": "known", "text_he": "...", "evidence": "גבוהה", "source_id": "...", "oxy": "poor" }],
  "organs": [{ "name_he": "הלב", "layer": "known", "...": "..." }],
  "diseases": [{ "id": "hypertension", "name_he": "...", "name_en": "...", "insight": "...", "items": ["..."], "action": { "...": "..." }, "bridge": { "...": "..." } }],
  "museum": { "quote_he": "...", "quote_en": "...", "quote_source": "...", "quote_by_he": "...", "haiku": ["", "", ""], "haiku_note": "..." }
} }
```
- `steps[].seg` הוא מזהה קטע בתרשים (`js/circulation.js`). `oxy`: "rich", "poor" או "swap" (חילוף גזים).
- כל `items`, `steps` ו-`organs` עוברים את אותם כללי שכבות כמו `SYSTEMS`.
- כל מחלה: לפחות פריט ידוע אחד, סימן לפנייה (חירום מפנה ל-101) ושאלה לרופא.
- כתובת: `#s=<system>&v=deep&t=<process|organs|diseases>&k=<step>&d=<disease>`.

## מחלה (DISEASES), שלב 4
אותו מבנה כמו מחלה במצב עומק, ועוד `system` (אחת משש המערכות).
- `DISEASES` = מחלות הלב מתוך `DEEP.cardio.diseases` (הפניה) + `MORE_DISEASES`.
- שער הבטיחות: מזהה ייחודי, מערכת קיימת, פריט ידוע אחד לפחות, סימן לפנייה (חירום מפנה ל-101), שאלה לרופא. דיכאון חייב להפנות לער"ן 1201.
- כתובת: `#s=<system>&v=diseases&f=<system>` לגלריה, ו-`#s=<system>&v=disease&d=<id>&f=<system>` לכרטיס.

## קבוצות (GROUPS) ומערכת שביעית
- `GROUPS.cancer`: `name_he`, `ids` (מזהי מחלות), `insight`, `items` (כרטיס פתיחה). בגלריה זה מסנן ליד המערכות: `f=cancer`.
- מערכת `reproductive` ("מערכת הרבייה והשד"), עם `short_he` לתווית בדמות. שקף משלה בדמות ובאטלס התלת־ממדי.
- מחלה יכולה להשתייך למערכת אחת ולקבוצה אחת או יותר.

## הגשר בפועל (שלב 6)
- `NUTRITION_APP` ב-`js/data.js`: כתובת, מיפוי `foods` (המזהה שלנו למזהה של Tzuna) ו-`topics` (נושא למילת חיפוש).
- `bridge.link.foods` (רשות): עוד מזהים של Tzuna, שמוצגים כשורת גיליונות מתחת לקישור הראשי ("ועוד גיליונות"). השם העברי מ-`NUTRITION_APP.names`, והכתובת מ-`nutritionFoodHref(id)`. שער הבטיחות חוסם מזהה בלי שם. הכיוון ההפוך: `js/data/medicine.js` ב-Tzuna. כל זוג נשען על פריט עם מקור בשתי האפליקציות.
- `nutritionHref(link)` מחזיר `https://tzuna-gh.vercel.app/#/foods?id=<id>` או `#/foods?q=<מילה>`. בלי כתובת, אין קישור. שער הבטיחות חוסם גשר תזונה בלי כתובת.

## דף הבית (HOME)
- `hillel_he`, `hillel_tr`, `hillel_source`, `one_foot`, `one_foot_more`, `lines` (שבעה: `text_he`, `source_id`, `go`), `haiku`.
- "בדיקה של דקה" לוקחת שלושה משפטים מ-`SYSTEMS`, אחד לכל שכבה. השכבה שכבר רשומה בדאטה היא התשובה. התוצאה ב-`localStorage`, במפתח `refua.quiz.v1`.

## הגוף בתלת־ממד: `ANATOMY3D` ו-`MODEL_CREDIT`
- `ANATOMY3D[systemId] = { focus: [partId], gap_he?, parts: [{ id, he, en, tissue, layer: 'known', text_he, source_id }] }`.
- `id` של כל מבנה הוא שם הצומת ב-`models/<systemId>.glb`. `focus` הם המבנים שהמצלמה ממסגרת.
- `gap_he`: מה שחסר במקור, במילים. מוצג בבמה.
- `tissue`: צבע במראה "רקמה". במראה "דיו" כל המבנים בפורצלן ובקו דיו.
- `models/body.glb`: צומת לכל מערכת (לפי ה-id שלה) ו-`skin`, מפושטים, להקשר.
- בחלק מהמבנים: `sex: 'f' | 'm'` (מוצג לפי מתג הגוף), `model: 'hra'` (המקור של המודל, מוצג בכרטיס), ו-`focus_m` למסגור בגוף של גבר.
- `DISEASE3D[diseaseId] = [partId]`: המבנים שמחלה מאירה. כל מבנה חייב להיות חלק מהמערכת של המחלה.
- `depth: { outer: [partId], inner: [partId] }`: רמה 2 הופכת את `outer` לשקוף, ורמה 3 מסירה אותו ומאירה את `inner`. כשמחלה מאירה מבנים, הם גוברים על רמת העומק.
