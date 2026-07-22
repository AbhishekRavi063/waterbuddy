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

const reminderLines = [
  "Amrita, paani piyo. Ninne nokki bottle already heartbreak mode-il aanu.",
  "Hello beautiful, glow venamenkil first hydration venam.",
  "Tumhari smile blockbuster hai, but hydration interval missing hai.",
  "Vellam kudicho mole? Illengil njan full villain entry edukum.",
  "Main hero background music ready aanu. Nee just oru sip edukkuka.",
  "Athu sari, but water kudikkathe cute mathram aayal mathiyo?",
  "Paani pee lo jaan, warna lipsum brainum strike cheyyum.",
  "Nee romba pretty aanu, pakshe water bottle-ne ignore cheyyunnathu toxic aanu.",
  "Bollywood heroine pole shine cheyyan? First drink water, madam.",
  "Ente ponnu, vellam kudikkan ithra attitude venda ketto.",
  "Amrita baby, hydration illathe main character arc weak aakum.",
  "Oru glass vellam kudichaal mathi, pinne full flirt mode continue cheyyam.",
  "Paani ke bina romance bhi dry ho jata hai. Sip now.",
  "Ithu love letter alla, hydration warning aanu with feelings.",
  "Nee vellam kudichal njan thanne whistle adikkum. Mass scene.",
];

const replies = {
  success: [
    "Aha, now that is heroine behavior.",
    "Shabash. Komban and kidneys both are impressed.",
    "Mass. Ippol thanne glow upgrade ayi.",
    "Good girl. Hydration team sends flying kisses.",
  ],
  snooze: [
    "Two minutes only. Ithinu shesham no more cinema excuses.",
    "Fine, but this delay has strong side-character energy.",
    "Snooze accepted. Romance okay, dehydration not okay.",
  ],
  chaos: [
    "Chai cute aanu, but still not water, madam.",
    "Flirting with tea while ignoring water? Dangerous storyline.",
    "Comedy super, but bottle still waiting for commitment.",
  ],
};

const notificationTitles = [
  "Amrita, hydration scene ready",
  "Breaking news: cute girl forgot water again",
  "Main character alert: sip immediately",
  "Vellam kudikkan romantic reminder",
  "Bottle says it misses you",
];

export function pickCharacter(index) {
  return characters[index % characters.length];
}

export function getPrompt(index) {
  return reminderLines[index % reminderLines.length];
}

export function getReply(type, index) {
  const lines = replies[type] ?? replies.success;
  return lines[index % lines.length];
}

export function buildNotificationPayload(index) {
  const character = pickCharacter(index);
  return {
    title: `${character.avatar} ${notificationTitles[index % notificationTitles.length]}`,
    body: getPrompt(index),
    tag: `water-buddy-${character.id}`,
    data: {
      characterId: character.id,
      url: "/",
    },
  };
}
