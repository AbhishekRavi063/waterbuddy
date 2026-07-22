export const languages = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "malayalam", label: "Malayalam" },
];

export const vibes = [
  { id: "cute", label: "Cute" },
  { id: "filmy", label: "Filmy" },
  { id: "savage", label: "Savage" },
];

export const characters = [
  {
    id: "elephant",
    name: "Captain Komban",
    avatar: "🐘",
    accent: "Dramatic protector",
    colors: ["#FFD166", "#F4A261"],
  },
  {
    id: "grandma",
    name: "Ammachi AI",
    avatar: "👵",
    accent: "Sweet but dangerous",
    colors: ["#F7CAD0", "#F4ACB7"],
  },
  {
    id: "cat",
    name: "Mass Hero Meow",
    avatar: "🐱",
    accent: "Cinema superstar",
    colors: ["#84A59D", "#52796F"],
  },
  {
    id: "parrot",
    name: "Breaking News Mithu",
    avatar: "🦜",
    accent: "Overexcited reporter",
    colors: ["#90BE6D", "#43AA8B"],
  },
  {
    id: "panda",
    name: "Sleepy Pandi",
    avatar: "🐼",
    accent: "Chaotic best friend",
    colors: ["#BDE0FE", "#A2D2FF"],
  },
];

const dialogueBank = {
  english: {
    cute: [
      "Tiny hydration alert. Your body sent me a very polite complaint.",
      "Drink water and I will officially call you a responsible legend.",
      "This is your adorable reminder that lips, skin, and brain all want water.",
    ],
    filmy: [
      "Interval block is over. Hero entry now: drink that water.",
      "No superstar glows on zero hydration. Respect the bottle.",
      "The audience is waiting for your hydration comeback scene.",
    ],
    savage: [
      "Your water bottle has seen more neglect than a side character.",
      "You scroll with dedication. Try that energy on drinking water.",
      "At this point your bottle and I both deserve answers.",
    ],
  },
  hindi: {
    cute: [
      "Paani pee lo, warna main phir se pyar se disturb karunga.",
      "Hydration ka message aaya hai. Ignore mat karo, dost.",
      "Tumhara body bol raha hai: thoda sa paani bhej do please.",
    ],
    filmy: [
      "Hero entry tabhi complete hogi jab bottle khatam hogi.",
      "Yeh hydration ka scene hai, background music khud imagine karo.",
      "Pehle paani, phir full main-character attitude.",
    ],
    savage: [
      "Phone charge karte ho, khud ko kab charge karoge? Paani piyo.",
      "Itna attitude theek hai, dehydration nahi.",
      "Bottle wahan rakhi hai sirf decoration ke liye kya?",
    ],
  },
  malayalam: {
    cute: [
      "Vellam kudikkan time ayi. Njan nalla reethiyil parayunnu.",
      "Kochu reminder: bodykku kurachu water venam ketto.",
      "Nee super aanu, pakshe hydrate cheythal kooduthal super.",
    ],
    filmy: [
      "Ithu oru mass scene aanu. Bottle eduthu vellam kudikyu.",
      "Heroine glowinu munpe hydration venam.",
      "Climaxinu munpe oru glass vellam mandatory aanu.",
    ],
    savage: [
      "Bottle ninne nokki karayunnu. Oru sip enkilum kudikyu.",
      "Scroll cheyyan energy undu, vellam kudikkan illayo?",
      "Dehydrationine ithra support venda. Vellam kudikyu.",
    ],
  },
};

const replies = {
  success: [
    "Legend behavior. I’m updating the hydration committee.",
    "Excellent. Your organs send regards.",
    "Beautiful. Even the avatar is emotionally moved.",
  ],
  snooze: [
    "Fine. I’ll allow a dramatic delay.",
    "Two minutes. No Oscar-level excuses after that.",
    "Snoozed, but I’m judging with love.",
  ],
  chaos: [
    "Chai is not water, but your confidence is inspiring.",
    "Suspicious answer. I’ll be back with louder energy.",
    "I respect the joke. The kidneys do not.",
  ],
};

const notificationTitles = {
  english: [
    "Hydration drama just dropped",
    "Urgent message from your water bottle",
    "Main character, please sip now",
  ],
  hindi: [
    "Hydration ka breaking scene",
    "Bottle ne complaint file kar di",
    "Hero entry se pehle paani",
  ],
  malayalam: [
    "Hydration alert vannu ketto",
    "Bottle ninnodu samsarikkunnu",
    "Mass entrykku munpe vellam",
  ],
};

export function pickCharacter(index) {
  return characters[index % characters.length];
}

export function getPrompt(language, vibe, index) {
  const lines = dialogueBank[language]?.[vibe] ?? dialogueBank.english.cute;
  return lines[index % lines.length];
}

export function getReply(type, index) {
  const lines = replies[type] ?? replies.success;
  return lines[index % lines.length];
}

export function buildNotificationPayload(language, vibe, index) {
  const character = pickCharacter(index);
  const titleLines = notificationTitles[language] ?? notificationTitles.english;

  return {
    title: `${character.avatar} ${titleLines[index % titleLines.length]}`,
    body: getPrompt(language, vibe, index),
    tag: `water-buddy-${character.id}-${vibe}`,
    data: {
      characterId: character.id,
      language,
      vibe,
      url: "/",
    },
  };
}
