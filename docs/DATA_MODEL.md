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
