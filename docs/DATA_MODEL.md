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
