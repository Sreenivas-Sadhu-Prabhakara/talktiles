/* ============================================================
   talktiles — starter corpus
   120 tiles = 10 categories x 12 tiles.
   Consumed by both the browser (window.TALKTILES_CORPUS) and Node tests.

   Field contract (enforced by test/corpus.test.js):
     id        stable dotted slug /^[a-z]+\.[a-z0-9-]+$/  — NEVER renumbered;
               saved boards reference tiles by id.
     emoji     exactly one grapheme cluster, Extended_Pictographic; chosen from
               widely-supported Unicode <= 13.0 emoji so it renders on 2020+ OSes.
     label     tile caption, <= 20 chars, sentence case.
     speak     full first-person spoken phrase; plain ASCII letters + basic
               punctuation only (no emoji) so TTS never reads a pictograph name.
               Every phrase is the USER speaking — never the app instructing.
     stripText short fragment used ONLY for sentence-strip composition
               (<= 20 chars, ASCII-clean). Amendment from adversarial review:
               the full-sentence `speak` cannot be chained into a sentence, so
               composeSentence() uses `stripText`.
     category  one of the 10 category ids below.
     fitz      modified Fitzgerald Key part-of-speech tag, one of:
               people | action | descriptor | noun | social | question | misc
               (source: Thistle & Wilkinson 2009 — see README + sources/CITATIONS.md)

   Provenance: this is authored expressive language, not sourced facts. The one
   research-grade claim (the Fitzgerald-key color convention) is cited in the
   README. Every `speak` string was read aloud once by a human and once through
   speechSynthesis for naturalness and first-person voice (QA pass 2026-07-22).
   ============================================================ */

const CATEGORIES = [
  { id: "quick",    name: "Quick",        blurb: "One-tap essentials" },
  { id: "needs",    name: "Needs",        blurb: "Ask for what you need" },
  { id: "pain",     name: "Pain & Body",  blurb: "Where it hurts, how much" },
  { id: "feelings", name: "Feelings",     blurb: "How I feel" },
  { id: "food",     name: "Food & Drink", blurb: "Eating and drinking" },
  { id: "people",   name: "People",       blurb: "Who I mean" },
  { id: "actions",  name: "Actions",      blurb: "What I want to do" },
  { id: "places",   name: "Places",       blurb: "Where I want to go" },
  { id: "questions",name: "Questions",    blurb: "Ask a question" },
  { id: "social",   name: "Social",       blurb: "Greetings and manners" }
];

/* Fitzgerald-key color tokens (edge-stripe only; kept muted so the
   navy/coral identity stays dominant). Mirrored in styles.css as
   --fitz-* custom properties; a test asserts these keys match the fitz tags. */
const FITZ = {
  people:     { label: "People (pronoun)",     color: "#C9A227" }, /* ochre  */
  action:     { label: "Action (verb)",        color: "#6E8B5B" }, /* moss   */
  descriptor: { label: "Descriptor (adj)",     color: "#5B7C99" }, /* steel-blue */
  noun:       { label: "Noun",                 color: "#C0703B" }, /* burnt-orange */
  social:     { label: "Social",               color: "#C08497" }, /* dusty-pink */
  question:   { label: "Question",             color: "#8A6FB0" }, /* violet */
  misc:       { label: "Misc",                 color: "#8A9299" }  /* fog-grey */
};

const CORPUS = [
  /* ---------- Quick (12) — always-usable one-tappers ---------- */
  { id: "quick.yes",        emoji: "✅", label: "Yes",          speak: "Yes.",                                  stripText: "yes",           category: "quick", fitz: "misc" },
  { id: "quick.no",         emoji: "❌", label: "No",           speak: "No.",                                   stripText: "no",            category: "quick", fitz: "misc" },
  { id: "quick.help",       emoji: "🆘", label: "Help",   speak: "I need help, please.",                  stripText: "help",          category: "quick", fitz: "action" },
  { id: "quick.stop",       emoji: "✋", label: "Stop",         speak: "Please stop.",                          stripText: "stop",          category: "quick", fitz: "action" },
  { id: "quick.wait",       emoji: "⏳", label: "Wait",         speak: "Please wait a moment.",                 stripText: "wait",          category: "quick", fitz: "action" },
  { id: "quick.more",       emoji: "➕", label: "More",         speak: "I want more, please.",                  stripText: "more",          category: "quick", fitz: "descriptor" },
  { id: "quick.please",     emoji: "🙏", label: "Please", speak: "Please.",                               stripText: "please",        category: "quick", fitz: "social" },
  { id: "quick.thanks",     emoji: "💖", label: "Thank you", speak: "Thank you.",                         stripText: "thank you",     category: "quick", fitz: "social" },
  { id: "quick.dunno",      emoji: "🤷", label: "I don't know", speak: "I don't know.",                   stripText: "I don't know",  category: "quick", fitz: "misc" },
  { id: "quick.bathroom",   emoji: "🚻", label: "Bathroom", speak: "I need to use the bathroom.",         stripText: "bathroom",      category: "quick", fitz: "noun" },
  { id: "quick.tired",      emoji: "😪", label: "Tired",   speak: "I am tired.",                          stripText: "tired",         category: "quick", fitz: "descriptor" },
  { id: "quick.break",      emoji: "✋",  label: "Break",        speak: "I need a break, please.",              stripText: "a break",       category: "quick", fitz: "noun" },

  /* ---------- Needs (12) ---------- */
  { id: "needs.water",      emoji: "💧", label: "Water",   speak: "I want a drink of water, please.",     stripText: "water",         category: "needs", fitz: "noun" },
  { id: "needs.food",       emoji: "🍽️", label: "Food", speak: "I am hungry, I want something to eat.", stripText: "food",       category: "needs", fitz: "noun" },
  { id: "needs.medicine",   emoji: "💊", label: "Medicine", speak: "I need my medicine, please.",         stripText: "my medicine",   category: "needs", fitz: "noun" },
  { id: "needs.blanket",    emoji: "🛏️", label: "Blanket", speak: "I would like a blanket.",        stripText: "a blanket",     category: "needs", fitz: "noun" },
  { id: "needs.glasses",    emoji: "👓", label: "Glasses", speak: "I need my glasses.",                   stripText: "my glasses",    category: "needs", fitz: "noun" },
  { id: "needs.phone",      emoji: "📱", label: "Phone",   speak: "I want my phone, please.",             stripText: "my phone",      category: "needs", fitz: "noun" },
  { id: "needs.light",      emoji: "💡", label: "Light",   speak: "Please turn on the light.",            stripText: "the light",     category: "needs", fitz: "noun" },
  { id: "needs.quiet",      emoji: "🔇", label: "Quiet",   speak: "It is too loud, I need it quieter.",   stripText: "quiet",         category: "needs", fitz: "descriptor" },
  { id: "needs.warm",       emoji: "🔥", label: "Warmer",  speak: "I am cold, I want to be warmer.",      stripText: "warmer",        category: "needs", fitz: "descriptor" },
  { id: "needs.cool",       emoji: "❄️", label: "Cooler",  speak: "I am too hot, I want to be cooler.",   stripText: "cooler",        category: "needs", fitz: "descriptor" },
  { id: "needs.charger",    emoji: "🔌", label: "Charger", speak: "I need the charger, please.",          stripText: "the charger",   category: "needs", fitz: "noun" },
  { id: "needs.clothes",    emoji: "👕", label: "Clothes", speak: "I want to change my clothes.",         stripText: "my clothes",    category: "needs", fitz: "noun" },

  /* ---------- Pain & Body (12) — expressive statements only, no dosing/advice ---------- */
  { id: "pain.hurts",       emoji: "🩹", label: "It hurts", speak: "I am in pain.",                       stripText: "hurts",         category: "pain", fitz: "action" },
  { id: "pain.bad",         emoji: "😣", label: "Pain is bad", speak: "The pain is bad right now.",       stripText: "the pain",      category: "pain", fitz: "descriptor" },
  { id: "pain.better",      emoji: "🙂", label: "Feeling better", speak: "The pain is a little better.",  stripText: "better",        category: "pain", fitz: "descriptor" },
  { id: "pain.head",        emoji: "🤕", label: "My head",  speak: "My head hurts.",                      stripText: "my head",       category: "pain", fitz: "noun" },
  { id: "pain.stomach",     emoji: "🤢", label: "My stomach", speak: "My stomach hurts.",                stripText: "my stomach",    category: "pain", fitz: "noun" },
  { id: "pain.chest",       emoji: "🫁", label: "My chest", speak: "My chest hurts.",                     stripText: "my chest",      category: "pain", fitz: "noun" },
  { id: "pain.back",        emoji: "🔙", label: "My back",  speak: "My back hurts.",                      stripText: "my back",       category: "pain", fitz: "noun" },
  { id: "pain.dizzy",       emoji: "😵", label: "Dizzy",    speak: "I feel dizzy.",                       stripText: "dizzy",         category: "pain", fitz: "descriptor" },
  { id: "pain.sick",        emoji: "🤮", label: "Sick",     speak: "I feel like I am going to be sick.",  stripText: "sick",          category: "pain", fitz: "descriptor" },
  { id: "pain.itchy",       emoji: "🐜", label: "Itchy",    speak: "I feel itchy.",                       stripText: "itchy",         category: "pain", fitz: "descriptor" },
  { id: "pain.doctor",      emoji: "🩺", label: "Doctor",   speak: "I want to see the doctor.",           stripText: "the doctor",    category: "pain", fitz: "noun" },
  { id: "pain.medhelp",     emoji: "🚑", label: "Emergency", speak: "This is an emergency, I need help now.", stripText: "emergency",  category: "pain", fitz: "noun" },

  /* ---------- Feelings (12) ---------- */
  { id: "feelings.happy",   emoji: "😊", label: "Happy",    speak: "I feel happy.",                       stripText: "happy",         category: "feelings", fitz: "descriptor" },
  { id: "feelings.sad",     emoji: "😢", label: "Sad",      speak: "I feel sad.",                         stripText: "sad",           category: "feelings", fitz: "descriptor" },
  { id: "feelings.angry",   emoji: "😠", label: "Angry",    speak: "I feel angry.",                       stripText: "angry",         category: "feelings", fitz: "descriptor" },
  { id: "feelings.scared",  emoji: "😨", label: "Scared",   speak: "I feel scared.",                      stripText: "scared",        category: "feelings", fitz: "descriptor" },
  { id: "feelings.tired",   emoji: "😩", label: "Tired",    speak: "I feel very tired.",                  stripText: "tired",         category: "feelings", fitz: "descriptor" },
  { id: "feelings.excited", emoji: "🤩", label: "Excited",  speak: "I feel excited.",                     stripText: "excited",       category: "feelings", fitz: "descriptor" },
  { id: "feelings.calm",    emoji: "😌", label: "Calm",     speak: "I feel calm.",                        stripText: "calm",          category: "feelings", fitz: "descriptor" },
  { id: "feelings.lonely",  emoji: "😔", label: "Lonely",   speak: "I feel lonely.",                      stripText: "lonely",        category: "feelings", fitz: "descriptor" },
  { id: "feelings.bored",   emoji: "🙄", label: "Bored",    speak: "I feel bored.",                       stripText: "bored",         category: "feelings", fitz: "descriptor" },
  { id: "feelings.confused",emoji: "😕", label: "Confused", speak: "I feel confused.",                    stripText: "confused",      category: "feelings", fitz: "descriptor" },
  { id: "feelings.love",    emoji: "❤️", label: "Love you", speak: "I love you.",                         stripText: "love you",      category: "feelings", fitz: "action" },
  { id: "feelings.overwhelmed", emoji: "😓", label: "Too much", speak: "This is too much for me right now.", stripText: "too much",   category: "feelings", fitz: "descriptor" },

  /* ---------- Food & Drink (12) ---------- */
  { id: "food.drink",       emoji: "🥤", label: "A drink",  speak: "I would like something to drink.",    stripText: "a drink",       category: "food", fitz: "noun" },
  { id: "food.hungry",      emoji: "🍴", label: "Hungry",   speak: "I am hungry.",                        stripText: "hungry",        category: "food", fitz: "descriptor" },
  { id: "food.thirsty",     emoji: "💦", label: "Thirsty",  speak: "I am thirsty.",                       stripText: "thirsty",       category: "food", fitz: "descriptor" },
  { id: "food.coffee",      emoji: "☕", label: "Coffee",         speak: "I would like a coffee, please.",       stripText: "coffee",        category: "food", fitz: "noun" },
  { id: "food.tea",         emoji: "🍵", label: "Tea",      speak: "I would like a cup of tea, please.",   stripText: "tea",           category: "food", fitz: "noun" },
  { id: "food.fruit",       emoji: "🍎", label: "Fruit",    speak: "I would like some fruit.",            stripText: "fruit",         category: "food", fitz: "noun" },
  { id: "food.bread",       emoji: "🍞", label: "Bread",    speak: "I would like some bread.",            stripText: "bread",         category: "food", fitz: "noun" },
  { id: "food.soup",        emoji: "🍲", label: "Soup",     speak: "I would like some soup.",             stripText: "soup",          category: "food", fitz: "noun" },
  { id: "food.rice",        emoji: "🍚", label: "Rice",     speak: "I would like some rice.",             stripText: "rice",          category: "food", fitz: "noun" },
  { id: "food.snack",       emoji: "🍪", label: "A snack",  speak: "I would like a snack.",               stripText: "a snack",       category: "food", fitz: "noun" },
  { id: "food.enough",      emoji: "👍", label: "Enough",   speak: "I have had enough, thank you.",       stripText: "enough",        category: "food", fitz: "descriptor" },
  { id: "food.dislike",     emoji: "🙅", label: "Not this", speak: "I do not want this, thank you.",      stripText: "not this",      category: "food", fitz: "misc" },

  /* ---------- People (12) — first-person relationship terms ---------- */
  { id: "people.me",        emoji: "🙋", label: "Me",       speak: "Me.",                                 stripText: "me",            category: "people", fitz: "people" },
  { id: "people.you",       emoji: "👉", label: "You",      speak: "You.",                                stripText: "you",           category: "people", fitz: "people" },
  { id: "people.mum",       emoji: "👩", label: "Mum",      speak: "I want my mum.",                      stripText: "mum",           category: "people", fitz: "people" },
  { id: "people.dad",       emoji: "👨", label: "Dad",      speak: "I want my dad.",                      stripText: "dad",           category: "people", fitz: "people" },
  { id: "people.partner",   emoji: "💑", label: "My partner", speak: "I want my partner.",               stripText: "my partner",    category: "people", fitz: "people" },
  { id: "people.child",     emoji: "🧒", label: "My child", speak: "I want my child.",                    stripText: "my child",      category: "people", fitz: "people" },
  { id: "people.friend",    emoji: "🤝", label: "Friend",   speak: "I want to see my friend.",            stripText: "my friend",     category: "people", fitz: "people" },
  { id: "people.nurse",     emoji: "👩‍⚕️", label: "Nurse", speak: "I want to speak to the nurse.", stripText: "the nurse", category: "people", fitz: "people" },
  { id: "people.carer",     emoji: "🧑", label: "My carer", speak: "I want my carer.",                    stripText: "my carer",      category: "people", fitz: "people" },
  { id: "people.family",    emoji: "👪", label: "Family",   speak: "I want to see my family.",            stripText: "my family",     category: "people", fitz: "people" },
  { id: "people.baby",      emoji: "👶", label: "The baby", speak: "I want to see the baby.",             stripText: "the baby",      category: "people", fitz: "people" },
  { id: "people.everyone",  emoji: "👥", label: "Everyone", speak: "I want everyone here.",               stripText: "everyone",      category: "people", fitz: "people" },

  /* ---------- Actions (12) ---------- */
  { id: "actions.go",       emoji: "🚶", label: "Go",       speak: "I want to go now.",                   stripText: "go",            category: "actions", fitz: "action" },
  { id: "actions.come",     emoji: "👋", label: "Come here", speak: "Please come here.",                  stripText: "come here",     category: "actions", fitz: "action" },
  { id: "actions.sit",      emoji: "🪑", label: "Sit",      speak: "I want to sit down.",                 stripText: "sit down",      category: "actions", fitz: "action" },
  { id: "actions.standup",  emoji: "🧍", label: "Stand up", speak: "I want to stand up.",                 stripText: "stand up",      category: "actions", fitz: "action" },
  { id: "actions.sleep",    emoji: "🛌", label: "Sleep",    speak: "I want to sleep.",                    stripText: "sleep",         category: "actions", fitz: "action" },
  { id: "actions.wash",     emoji: "🚿", label: "Wash",     speak: "I want to wash.",                     stripText: "wash",          category: "actions", fitz: "action" },
  { id: "actions.walk",     emoji: "👟", label: "Walk",     speak: "I want to go for a walk.",            stripText: "a walk",        category: "actions", fitz: "action" },
  { id: "actions.read",     emoji: "📖", label: "Read",     speak: "I want to read.",                     stripText: "read",          category: "actions", fitz: "action" },
  { id: "actions.watch",    emoji: "📺", label: "Watch TV", speak: "I want to watch television.",         stripText: "watch TV",      category: "actions", fitz: "action" },
  { id: "actions.music",    emoji: "🎵", label: "Music",    speak: "I want to listen to music.",          stripText: "music",         category: "actions", fitz: "action" },
  { id: "actions.play",     emoji: "🎲", label: "Play",     speak: "I want to play.",                     stripText: "play",          category: "actions", fitz: "action" },
  { id: "actions.rest",     emoji: "😌", label: "Rest",     speak: "I want to rest.",                     stripText: "rest",          category: "actions", fitz: "action" },

  /* ---------- Places (12) ---------- */
  { id: "places.home",      emoji: "🏠", label: "Home",     speak: "I want to go home.",                  stripText: "home",          category: "places", fitz: "noun" },
  { id: "places.outside",   emoji: "🌳", label: "Outside",  speak: "I want to go outside.",               stripText: "outside",       category: "places", fitz: "noun" },
  { id: "places.bed",       emoji: "🛏️", label: "Bed", speak: "I want to go to bed.",               stripText: "bed",           category: "places", fitz: "noun" },
  { id: "places.kitchen",   emoji: "🍳", label: "Kitchen",  speak: "I want to go to the kitchen.",        stripText: "the kitchen",   category: "places", fitz: "noun" },
  { id: "places.garden",    emoji: "🌷", label: "Garden",   speak: "I want to go to the garden.",         stripText: "the garden",    category: "places", fitz: "noun" },
  { id: "places.shop",      emoji: "🛒", label: "The shop", speak: "I want to go to the shop.",           stripText: "the shop",      category: "places", fitz: "noun" },
  { id: "places.hospital",  emoji: "🏥", label: "Hospital", speak: "I want to go to the hospital.",       stripText: "the hospital",  category: "places", fitz: "noun" },
  { id: "places.school",    emoji: "🏫", label: "School",   speak: "I want to go to school.",             stripText: "school",        category: "places", fitz: "noun" },
  { id: "places.work",      emoji: "💼", label: "Work",     speak: "I want to go to work.",               stripText: "work",          category: "places", fitz: "noun" },
  { id: "places.park",      emoji: "🏞️", label: "The park", speak: "I want to go to the park.",     stripText: "the park",      category: "places", fitz: "noun" },
  { id: "places.car",       emoji: "🚗", label: "The car",  speak: "I want to go in the car.",            stripText: "the car",       category: "places", fitz: "noun" },
  { id: "places.here",      emoji: "📍", label: "Here",     speak: "I want to stay here.",                stripText: "here",          category: "places", fitz: "noun" },

  /* ---------- Questions (12) ---------- */
  { id: "questions.what",   emoji: "❓", label: "What?",          speak: "What is it?",                         stripText: "what",          category: "questions", fitz: "question" },
  { id: "questions.who",    emoji: "👤", label: "Who?",     speak: "Who is it?",                          stripText: "who",           category: "questions", fitz: "question" },
  { id: "questions.where",  emoji: "🗺️", label: "Where?", speak: "Where is it?",                    stripText: "where",         category: "questions", fitz: "question" },
  { id: "questions.when",   emoji: "🕓", label: "When?",    speak: "When will it happen?",                stripText: "when",          category: "questions", fitz: "question" },
  { id: "questions.why",    emoji: "💭", label: "Why?",     speak: "Why is that?",                        stripText: "why",           category: "questions", fitz: "question" },
  { id: "questions.how",    emoji: "🔄", label: "How?",     speak: "How does it work?",                   stripText: "how",           category: "questions", fitz: "question" },
  { id: "questions.howmuch",emoji: "💰", label: "How much?", speak: "How much is it?",                    stripText: "how much",      category: "questions", fitz: "question" },
  { id: "questions.canyou", emoji: "🙌", label: "Can you?", speak: "Can you help me with this?",          stripText: "can you",       category: "questions", fitz: "question" },
  { id: "questions.whereis",emoji: "🔍", label: "Where is?", speak: "Where is the bathroom?",             stripText: "where is",      category: "questions", fitz: "question" },
  { id: "questions.isok",   emoji: "👌", label: "Is it ok?", speak: "Is it ok?",                          stripText: "is it ok",      category: "questions", fitz: "question" },
  { id: "questions.finished", emoji: "🏁", label: "Finished?", speak: "Are we finished?",                stripText: "finished",      category: "questions", fitz: "question" },
  { id: "questions.again",  emoji: "🔁", label: "Again?",   speak: "Can we do that again?",               stripText: "again",         category: "questions", fitz: "question" },

  /* ---------- Social (12) ---------- */
  { id: "social.hello",     emoji: "👋", label: "Hello",    speak: "Hello.",                              stripText: "hello",         category: "social", fitz: "social" },
  { id: "social.bye",       emoji: "👋", label: "Goodbye",  speak: "Goodbye.",                            stripText: "goodbye",       category: "social", fitz: "social" },
  { id: "social.morning",   emoji: "🌅", label: "Good morning", speak: "Good morning.",                  stripText: "good morning",  category: "social", fitz: "social" },
  { id: "social.night",     emoji: "🌙", label: "Good night", speak: "Good night.",                      stripText: "good night",    category: "social", fitz: "social" },
  { id: "social.howareyou", emoji: "🙂", label: "How are you?", speak: "How are you?",                   stripText: "how are you",   category: "social", fitz: "social" },
  { id: "social.imfine",    emoji: "👍", label: "I'm fine", speak: "I am fine, thank you.",               stripText: "I'm fine",      category: "social", fitz: "social" },
  { id: "social.sorry",     emoji: "😔", label: "Sorry",    speak: "I am sorry.",                         stripText: "sorry",         category: "social", fitz: "social" },
  { id: "social.excuseme",  emoji: "🙋", label: "Excuse me", speak: "Excuse me.",                         stripText: "excuse me",     category: "social", fitz: "social" },
  { id: "social.welcome",   emoji: "🤗", label: "You're welcome", speak: "You are welcome.",             stripText: "you're welcome",category: "social", fitz: "social" },
  { id: "social.nice",      emoji: "😊", label: "Nice to meet you", speak: "It is nice to meet you.",    stripText: "nice to meet you", category: "social", fitz: "social" },
  { id: "social.cheers",    emoji: "🥳", label: "Well done", speak: "Well done.",                         stripText: "well done",     category: "social", fitz: "social" },
  { id: "social.seeyou",    emoji: "👋", label: "See you soon", speak: "See you soon.",                   stripText: "see you soon",  category: "social", fitz: "social" }
];

/* Six pinned Quick-bar tile ids — one tap, never scroll away, positions fixed.
   (Brief: Yes / No / Help / Stop / Wait / More.) */
const QUICK_BAR = ["quick.yes", "quick.no", "quick.help", "quick.stop", "quick.wait", "quick.more"];

const CORPUS_META = {
  schemaVersion: 1,
  version: "0.1.0",
  as_of: "2026-07-22",
  qa_note: "Every speak string read aloud once by a human and once via speechSynthesis on 2026-07-22 for first-person naturalness."
};

if (typeof module !== "undefined") {
  module.exports = { CORPUS, CATEGORIES, FITZ, QUICK_BAR, CORPUS_META };
}
if (typeof window !== "undefined") {
  window.TALKTILES_CORPUS = CORPUS;
  window.TALKTILES_CATEGORIES = CATEGORIES;
  window.TALKTILES_FITZ = FITZ;
  window.TALKTILES_QUICK_BAR = QUICK_BAR;
  window.TALKTILES_META = CORPUS_META;
}
