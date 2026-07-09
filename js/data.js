/*
 * data.js — Seed itinerary for the China / Japan trip.
 *
 * This is the DEFAULT data. Anything the user adds or ticks off in the app is
 * saved to localStorage and merged over the top of this on load, so editing
 * this file only changes the starting point (unless the user resets).
 *
 * Trip map (2026):
 *   Shanghai : Sep 28 – Oct 5   (PVG)
 *   Osaka    : Oct 6  – Oct 10  (KIX)
 *   Tokyo    : Oct 11 – Oct 16  (HND)
 *   Beijing  : Oct 17 – Oct 19  (PEK)
 *   Shanghai : Oct 20 – Oct 22  (PVG, fly home)
 */

const CITIES = {
  shanghai: { name: "Shanghai", code: "SHA", country: "China", flag: "🇨🇳" },
  osaka:    { name: "Osaka",    code: "OSA", country: "Japan", flag: "🇯🇵" },
  tokyo:    { name: "Tokyo",    code: "TYO", country: "Japan", flag: "🇯🇵" },
  beijing:  { name: "Beijing",  code: "PEK", country: "China", flag: "🇨🇳" },
  kyoto:    { name: "Kyoto",    code: "KYO", country: "Japan", flag: "🇯🇵"},
  yokohama: { name: "Yokohama",  code: "YOK", country: "Japan", flag: "🇯🇵" },
  suzhou:   { name: "Suzhou",    code: "SZH", country: "China", flag: "🇨🇳" },
  nara:     { name: "Nara",      code: "NRA", country: "Japan", flag: "🇯🇵" },
  kamakura: { name: "Kamakura",  code: "KAM", country: "Japan", flag: "🇯🇵" },
};

/* Small helper so seed places get stable, readable ids. */
function place(id, name, details = {}) {
  return {
    id,
    name,
    done: false,
    details: {
      open: details.open || "",
      close: details.close || "",
      address: details.address || "",
      note: details.note || "",
    },
  };
}

/*
 * Each day:
 *   id, date (ISO), city (key of CITIES), focus (the area/theme),
 *   photo (unsplash query used to build a nice header image),
 *   morning / afternoon / evening : arrays of "places" (to-do items)
 *   restaurants / cafes : arrays shown on the flipped side of the card
 */
const DAYS = [
  /* ───────────────────────── SHANGHAI (leg 1) ───────────────────────── */
  {
    id: "day-01", date: "2026-09-28", city: "shanghai",
    focus: "Travel day · LHR → Shanghai",
    photo: "assets/photos/shanghai.png",
    morning: [
      place("d1-m1", "Fly London Heathrow (LHR) → Shanghai (PVG)", { open: "12:05", note: "Departs LHR 12:05pm. Arrives PVG 07:55 next morning." }),
      place("d1-m2", "Grab a local SIM / eSIM + Alipay setup", { note: "Set up Alipay/WeChat Pay before you fly — you'll want it the moment you land." }),
    ],
    afternoon: [
      place("d1-a1", "In the air ✈️"),
    ],
    evening: [
      place("d1-e1", "Overnight flight — try to sleep to beat jet lag"),
    ],
    restaurants: [
      place("d1-r1", "Airline dinner / airport bite before boarding"),
    ],
    cafes: [
      place("d1-c1", "Heathrow lounge coffee"),
    ],
  },
  {
    id: "day-02", date: "2026-09-29", city: "shanghai",
    focus: "Jing'an Temple & The Bund",
    photo:  "assets/photos/shanghai.png",
    morning: [
      place("d2-m1", "Land at Pudong Intl (PVG) 07:55 & transfer in", { note: "Maglev + metro, or a Didi to the hotel." }),
      place("d2-m2", "Jing'an Temple", { open: "07:30", close: "17:00", note: "Golden temple in the heart of the city." }),
    ],
    afternoon: [
      place("d2-a1", "Check into hotel", { open: "15:00", note: "Check-in from 3pm — drop bags & freshen up." }),
      place("d2-a2", "Shopping on Huaihai Road", { note: "Leafy flagship shopping street in the former French Concession." }),
    ],
    evening: [
      place("d2-e1", "The Bund promenade & night skyline", { open: "24h", note: "Best light ~7pm when the Pudong towers switch on." }),
    ],
    restaurants: [
      place("d2-r1", "Lost Heaven (Yunnan)", { open: "11:30", close: "22:00", address: "17 Yan'an East Rd" }),
      place("d2-r2", "M on the Bund", { open: "17:30", close: "22:30" }),
    ],
    cafes: [
      place("d2-c1", "% Arabica — the Bund", { open: "08:00", close: "19:00" }),
      place("d2-c2", "Manner Coffee", { note: "Cheap, everywhere, genuinely good." }),
    ],
  },
  {
    id: "day-03", date: "2026-09-30", city: "shanghai",
    focus: "Wukang Road & Anfu Road",
    photo:  "assets/photos/wukang.png",
    morning: [
      place("d3-m1", "Wukang Road stroll & French Concession architecture", { note: "Tree-lined streets, historic villas, and boutique shops." }),
    ],
    afternoon: [
      place("d3-a1", "Yuyuan Bazaar & Nine-Turn Bridge"),
      place("d3-a2", "City God Temple"),
    ],
    evening: [
      place("d3-e1", "Xiaolongbao dinner in the Old City"),
    ],
    restaurants: [
      place("d3-r1", "Nanxiang Steamed Bun (original)", { open: "10:00", close: "21:00" }),
      place("d3-r2", "Jia Jia Tang Bao", { open: "07:30", close: "13:00", note: "Sells out — go early." }),
    ],
    cafes: [
      place("d3-c1", "Old Heaven / teahouse stop"),
    ],
  },
  {
    id: "day-04", date: "2026-10-01", city: "shanghai",
    focus: "Suzhou Day Trip",
    photo: "assets/photos/suzhou.png",
    morning: [
      place("d4-m1", "Travel to Suzhou via Hongqiao station (~30m)", { note: "Take the high-speed train to Suzhou — check the schedule in advance." }),
      place("d4-m2", "Suzhou Classical Gardens (Humble Administrator's Garden)", { open: "07:30", close: "17:30" }),
      place("d4-m3", "Pingjiang Road stroll" , { note: "Historic canal-side street with shops & tea houses." })
    ],
    afternoon: [
      place("d4-a1", "Shantang Street & canals"),
    ],
    evening: [
      place("d4-e1", "Train back to Shanghai (~30m)"),
    ],
    restaurants: [
      place("d4-r1", "Song He Lou (Suzhou)", { open: "11:00", close: "21:00" }),
      place("d4-r2", "Li Bai Xie", { open: "11:00", close: "20:00" }),
    ],
    cafes: [
      place("d4-c1", "Be Fine Cha", { open: "09:00", close: "18:00" }),
    ],
  },
  {
    id: "day-05", date: "2026-10-02", city: "shanghai",
    focus: "Nanjing Pedestrian Street",
    photo: "assets/photos/shanghai.png",
    morning: [
      place("d5-m1", "Shanghai Tower observation deck", { open: "09:00", close: "22:00" }),
    ],
    afternoon: [
      place("d5-a1", "Super Brand Mall / riverside"),
      place("d5-a2", "Shanghai Ocean Aquarium (optional)"),
    ],
    evening: [
      place("d5-e1", "Sunset views from Flair rooftop"),
    ],
    restaurants: [
      place("d5-r1", "Flair Rooftop (Ritz-Carlton)", { open: "17:00", close: "01:00" }),
    ],
    cafes: [
      place("d5-c1", "% Arabica — IFC", { open: "08:00", close: "20:00" }),
    ],
  },
  {
    id: "day-06", date: "2026-10-03", city: "shanghai",
    focus: "Xintiandi & French Concession",
    photo: "assets/photos/shanghai.png",
    morning: [
      place("d6-m1", "West Bund art museums", { note: "Long Museum / West Bund Museum." }),
    ],
    afternoon: [
      place("d6-a1", "Xintiandi shikumen blocks"),
      place("d6-a2", "Tianzifang round two (if wanted)"),
    ],
    evening: [
      place("d6-e1", "Cocktails at Xintiandi"),
    ],
    restaurants: [
      place("d6-r1", "Ye Shanghai (Xintiandi)", { open: "11:00", close: "22:00" }),
    ],
    cafes: [
      place("d6-c1", "Blue Bottle Coffee", { open: "08:00", close: "19:00" }),
    ],
  },
  {
    id: "day-07", date: "2026-10-04", city: "shanghai",
    focus: "Yu Garden & Shanghai Old Street",
    photo: "assets/photos/yugarden.png",
    morning: [
      place("d7-m1", "Metro/taxi out to Zhujiajiao", { note: "~1h from centre." }),
    ],
    afternoon: [
      place("d7-a1", "Canal boat ride & old bridges"),
      place("d7-a2", "Kezhi Garden"),
    ],
    evening: [
      place("d7-e1", "Back to the city, relaxed dinner"),
    ],
    restaurants: [
      place("d7-r1", "Canal-side noodle house"),
    ],
    cafes: [
      place("d7-c1", "Riverside teahouse"),
    ],
  },
  {
    id: "day-08", date: "2026-10-05", city: "osaka",
    focus: "Travel day to Osaka",
    photo: "assets/photos/osaka.png",
    morning: [
      place("d8-m1", "Depart 1.15pm Shanghai Pudong (PVG) → Osaka Kansai (KIX)", { note: "Flight time ~2h30. Arrive 4.35pm local time." }),
    ],
    afternoon: [
      place("d8-a1", "Repack + confirm flight to Osaka (KIX)"),
    ],
    evening: [
      place("d8-e1", "Early night before travel"),
    ],
    restaurants: [
      place("d8-r1", "Comfort dumplings nearby"),
    ],
    cafes: [
      place("d8-c1", "Manner Coffee for the road"),
    ],
  },

  /* ───────────────────────── OSAKA ───────────────────────── */
  {
    id: "day-09", date: "2026-10-06", city: "osaka",
    focus: "Nipponbashi & Namba",
    photo: "assets/photos/osaka.png",
    morning: [
      place("d9-m1", "Visit Osaka Castle", { open: "09:00", close: "17:00" }),
    ],
    afternoon: [
      place("d9-a1", "Chill around Namba/Nipponbashi — shops & arcades"),
    ],
    evening: [
      place("d9-e1", "Dotonbori & Glico sign at night"),
      place("d9-e2", "Casual street-food crawl — takoyaki & okonomiyaki"),
    ],
    restaurants: [
      place("d9-r1", "Mizuno (okonomiyaki)", { open: "11:00", close: "22:00" }),
      place("d9-r2", "Kukuru (takoyaki)", { open: "12:00", close: "23:00" }),
    ],
    cafes: [
      place("d9-c1", "% Arabica — Osaka"),
    ],
  },
  {
    id: "day-10", date: "2026-10-07", city: "nara",
    focus: "Nara + Kyoto",
    photo: "assets/photos/nara.png",
    morning: [
      place("d10-m1", "Take early train to Nara (~45m)", { note: "Visit Todai-ji & Nara Park." }),
      place("d10-m2", "Feed the deer & explore Nara Park"),
      place("d10-m3", "From Nara, train to Kyoto (~45m)"),
    ],
    afternoon: [
      place("d10-a1", "Walk streets of Kyoto — Nishiki Market & Gion"),
    ],
    evening: [
      place("d10-e1", "Have dinner in Kyoto or back in Osaka (Namba)"),
    ],
    restaurants: [
      place("d10-r1", "Kushikatsu Daruma, Namba", { open: "11:00", close: "22:30", note: "No double-dipping the sauce!" }),
    ],
    cafes: [
      place("d10-c1", "Lilo Coffee Roasters", { open: "10:00", close: "22:00" }),
    ],
  },
  {
    id: "day-11", date: "2026-10-08", city: "osaka",
    focus: "Katsuoji Temple and Nipponbashi / Namba",
    photo: "assets/photos/katsuojitemple.png",
    morning: [
      place("d11-m1", "Travel to Katsuoji Temple", { open: "08:00", close: "17:00",note: "Take the train to Katsuoji Station, then a short walk." }),
      place("d11-m2", "Walk down to Minoh Waterfall")
    ],
    afternoon: [
      place("d11-a1", "Hover around Namba/Nipponbashi"),
      place("d11-a2", "Ship suitcases to Tokyo"),
    ],
    evening: [
      place("d11-e1", "Dinner in Dotonburi / Namba"),
    ],
    restaurants: [
      place("d11-r1", "Kyoto kaiseki or Gion ramen"),
    ],
    cafes: [
      place("d11-c1", "Nakatanidou mochi (Nara)", { open: "10:00", close: "19:00" }),
    ],
  },
  {
    id: "day-12", date: "2026-10-09", city: "kyoto",
    focus: "Kyoto - Arashiyama - Uji",
    photo: "assets/photos/kyoto.png",
    morning: [
      place("d13-m1", "Arashiyama bamboo grove", { note: "Go early for the quiet groves." }),
      place("d13-m2", "Tenryū-ji & Togetsukyō bridge", { open: "08:30", close: "17:00" }),
    ],
    afternoon: [
      place("d13-a1", "Uji stop (optional) — matcha & Byōdō-in", { note: "Squeeze in if you skipped it earlier." }),
    ],
    evening: [
      place("d12-e1", "Local Osaka dinner"),
    ],
    restaurants: [
      place("d12-r1", "Mizuno (okonomiyaki)", { open: "11:00", close: "22:00" }),
    ],
    cafes: [
      place("d12-c1", "Mel Coffee Roasters", { open: "10:00", close: "19:00" }),
    ],
  },
  {
    id: "day-13", date: "2026-10-10", city: "osaka",
    focus: "Shinkansen to Tokyo",
    photo: "assets/photos/osaka.png",
    morning: [
      place("d13-m1", "Stay around Namba / Nipponbashi for a slow morning"),
    ],
    afternoon: [
      place("d13-a2", "Shinkansen → Tokyo", { note: "~2h50 on the Nozomi; check in around Ikebukuro." }),
    ],
    evening: [
      place("d13-e1", "Settle into Ikebukuro — Sunshine St & dinner"),
    ],
    restaurants: [
      place("d13-r1", "Ikebukuro ramen or izakaya"),
    ],
    cafes: [
      place("d13-c1", "% Arabica — Arashiyama", { open: "09:00", close: "18:00" }),
    ],
  },

  /* ───────────────────────── TOKYO ───────────────────────── */
  {
    id: "day-14", date: "2026-10-11", city: "tokyo",
    focus: "Shibuya & Harajuku",
    photo: "assets/photos/shibuya.png",
    morning: [
      place("d14-m1", "Meiji Jingū shrine", { open: "05:00", close: "17:30" }),
    ],
    afternoon: [
      place("d14-a1", "Harajuku — Takeshita St & Omotesandō"),
      place("d14-a2", "Shibuya Crossing & Shibuya Sky", { open: "10:00", close: "22:30", note: "Book a Shibuya Sky sunset slot in advance." }),
    ],
    evening: [
      place("d14-e1", "Dinner around Shibuya"),
    ],
    restaurants: [
      place("d14-r1", "Ichiran Ramen Shibuya", { open: "10:00", close: "23:00" }),
    ],
    cafes: [
      place("d14-c1", "About Life Coffee Brewers", { open: "09:00", close: "19:00" }),
    ],
  },
  {
    id: "day-15", date: "2026-10-12", city: "tokyo",
    focus: "Ikebukuro & Sunshine City",
    photo: "assets/photos/tokyo.png",
    morning: [
      place("d15-m1", "Explore Ikebukuro — local morning"),
    ],
    afternoon: [
      place("d15-a1", "Sunshine City — aquarium, shops & observatory", { open: "10:00", close: "20:00" }),
      place("d15-a2", "Pokémon Café / Pokémon Center", { note: "Pokémon Café needs a reservation ~31 days ahead." }),
    ],
    evening: [
      place("d15-e1", "Ramen street dinner in Ikebukuro"),
    ],
    restaurants: [
      place("d15-r1", "Mutekiya Ramen, Ikebukuro", { open: "10:30", close: "04:00" }),
    ],
    cafes: [
      place("d15-c1", "Local Ikebukuro café"),
    ],
  },
  {
    id: "day-16", date: "2026-10-13", city: "tokyo",
    focus: "Gotoku-ji · Shimokitazawa · Shinjuku",
    photo: "assets/photos/gotokujitemple.png",
    morning: [
      place("d16-m1", "Gotoku-ji (lucky cat temple)", { open: "06:00", close: "17:00", note: "The maneki-neko temple — rows of little waving cats." }),
    ],
    afternoon: [
      place("d16-a1", "Shimokitazawa — vintage shops & cafés"),
    ],
    evening: [
      place("d16-e1", "Shinjuku (optional) — Omoide Yokocho & Golden Gai", { note: "Tack on if you've still got energy." }),
    ],
    restaurants: [
      place("d16-r1", "Shimokita izakaya or curry"),
    ],
    cafes: [
      place("d16-c1", "Bear Pond Espresso, Shimokita", { open: "11:00", close: "19:00" }),
    ],
  },
  {
    id: "day-17", date: "2026-10-14", city: "tokyo",
    focus: "Kichijōji & Ghibli Museum",
    photo: "assets/photos/kichijoji.png",
    morning: [
      place("d17-m1", "Kichijōji & Inokashira Park stroll"),
    ],
    afternoon: [
      place("d17-a1", "Ghibli Museum, Mitaka", { open: "10:00", close: "18:00", note: "Timed tickets only — released the 10th of the month before and sell out fast." }),
    ],
    evening: [
      place("d17-e1", "Harmonica Yokochō izakaya, Kichijōji"),
    ],
    restaurants: [
      place("d17-r1", "Harmonica Yokochō bar snacks"),
    ],
    cafes: [
      place("d17-c1", "Blue Sky Coffee, Inokashira Park"),
    ],
  },
  {
    id: "day-18", date: "2026-10-15", city: "kamakura",
    focus: "Day trip · Kamakura → Yokohama",
    photo: "assets/photos/kamakura.png",
    morning: [
      place("d18-m1", "Train to Kamakura (~1h)", { note: "Ride the retro Enoden line along the coast." }),
      place("d18-m2", "Great Buddha (Kōtoku-in)", { open: "08:00", close: "17:00" }),
    ],
    afternoon: [
      place("d18-a1", "Hasedera & Komachi-dōri street"),
      place("d18-a2", "Enoshima coast (optional), then to Yokohama"),
    ],
    evening: [
      place("d18-e1", "Yokohama Minato Mirai lights & dinner"),
    ],
    restaurants: [
      place("d18-r1", "Shirasu (whitebait) bowl in Kamakura"),
    ],
    cafes: [
      place("d18-c1", "Kamakura Komachi-dōri café"),
    ],
  },
  {
    id: "day-19", date: "2026-10-16", city: "yokohama",
    focus: "Yokohama & Chinatown",
    photo: "assets/photos/yokohama.png",
    morning: [
      place("d19-m1", "Minato Mirai waterfront & Cup Noodles Museum", { open: "10:00", close: "18:00" }),
    ],
    afternoon: [
      place("d19-a1", "Yokohama Chinatown", { note: "Japan's largest Chinatown — endless street snacks." }),
      place("d19-a2", "Red Brick Warehouse & bay stroll"),
    ],
    evening: [
      place("d19-e1", "Farewell-to-Japan dinner; pack for Beijing"),
    ],
    restaurants: [
      place("d19-r1", "Yokohama Chinatown dim sum"),
    ],
    cafes: [
      place("d19-c1", "Minato Mirai bayside café"),
    ],
  },

  /* ───────────────────────── BEIJING ───────────────────────── */
  {
    id: "day-20", date: "2026-10-17", city: "beijing",
    focus: "Arrive Beijing · Shopping & food",
    photo: "assets/photos/beijing.png",
    morning: [
      place("d20-m1", "Fly Tokyo → Beijing (PEK)", { note: "Haneda (HND) Terminal 3 08:50 → 12:00 Beijing Capital (PEK) Terminal 3." }),
    ],
    afternoon: [
      place("d20-a1", "Check in, then Wangfujing shopping street"),
      place("d20-a2", "Qianmen & Dashilar old shops"),
    ],
    evening: [
      place("d20-e1", "Peking duck welcome dinner"),
    ],
    restaurants: [
      place("d20-r1", "Siji Minfu (Peking duck)", { open: "11:00", close: "22:00" }),
    ],
    cafes: [
      place("d20-c1", "Café near Wangfujing"),
    ],
  },
  {
    id: "day-21", date: "2026-10-18", city: "beijing",
    focus: "Forbidden City & Tiananmen",
    photo: "assets/photos/beijing.png",
    morning: [
      place("d21-m1", "Tiananmen Square", { open: "05:00", close: "22:00", note: "Free, but reserve a timed slot on the official WeChat mini-program; passport needed for the security check." }),
    ],
    afternoon: [
      place("d21-a1", "Forbidden City (Palace Museum)", { open: "08:30", close: "17:00", note: "Closed Mondays. Book online ~7 days ahead with your passport — sells out; enter via the Meridian (Wumen) Gate." }),
      place("d21-a2", "Jingshan Park — sunset view over the palace", { open: "06:30", close: "21:00" }),
    ],
    evening: [
      place("d21-e1", "Hutong dinner near Nanluoguxiang"),
    ],
    restaurants: [
      place("d21-r1", "Siji Minfu or local hutong spot", { open: "11:00", close: "22:00" }),
    ],
    cafes: [
      place("d21-c1", "Nanluoguxiang courtyard café"),
    ],
  },
  {
    id: "day-22", date: "2026-10-19", city: "beijing",
    focus: "Great Wall → train to Shanghai",
    photo: "assets/photos/greatwall.png",
    morning: [
      place("d22-m1", "Dawn drive to Mutianyu Great Wall", { open: "07:30", close: "17:30", note: "Leave early to beat crowds — cable car up, toboggan down." }),
    ],
    afternoon: [
      place("d22-a1", "Back to Beijing, collect luggage & check out"),
    ],
    evening: [
      place("d22-e1", "High-speed train Beijing → Shanghai (~18:00)", { note: "~4.5h on the G-series train; arrive Shanghai late evening." }),
    ],
    restaurants: [
      place("d22-r1", "Quick bite at Beijing South station"),
    ],
    cafes: [
      place("d22-c1", "Station coffee before boarding"),
    ],
  },

  /* ───────────────────────── SHANGHAI (leg 2 · home) ───────────────────────── */
  {
    id: "day-23", date: "2026-10-20", city: "shanghai",
    focus: "Shanghai Wild Animal Park",
    photo: "assets/photos/wildanimalpark.png",
    morning: [
      place("d23-m1", "Pre-booked car / Didi to Nanhui", { note: "The park is far out — arrange the transfer in advance." }),
      place("d23-m2", "Shanghai Wild Animal Park opens", { open: "08:00", close: "17:00", note: "Book tickets ahead; passport needed for entry." }),
    ],
    afternoon: [
      place("d23-a1", "Safari drive-through & animal shows"),
    ],
    evening: [
      place("d23-e1", "Back to the city, relaxed dinner"),
    ],
    restaurants: [
      place("d23-r1", "Return to a Shanghai favourite"),
    ],
    cafes: [
      place("d23-c1", "Seesaw / Manner coffee"),
    ],
  },
  {
    id: "day-24", date: "2026-10-21", city: "shanghai",
    focus: "Shanghai Disneyland",
    photo: "assets/photos/disneyland.png",
    morning: [
      place("d24-m1", "Early Park Entry / rope drop", { open: "08:30", close: "20:30", note: "Buy tickets ahead & link them in the Shanghai Disney app; consider Premier Access." }),
    ],
    afternoon: [
      place("d24-a1", "Rides, parades & character meets"),
    ],
    evening: [
      place("d24-e1", "Fireworks over the castle, then back to pack"),
    ],
    restaurants: [
      place("d24-r1", "In-park dining (Wandering Moon Teahouse)"),
    ],
    cafes: [
      place("d24-c1", "Mickey latte in the park"),
    ],
  },
  {
    id: "day-25", date: "2026-10-22", city: "shanghai",
    focus: "Departure · Fly home",
    photo: "assets/photos/shanghai.png",
    morning: [
      place("d25-m1", "Checkout & luggage"),
      place("d25-m2", "Transfer to Pudong (PVG)", { note: "Maglev is fun & fast." }),
    ],
    afternoon: [
      place("d25-a1", "Check in & security"),
    ],
    evening: [
      place("d25-e1", "Fly home ✈️", { note: "PVG 11:00 → 18:45 London Heathrow (LHR)." }),
    ],
    restaurants: [
      place("d25-r1", "Last bite at the airport"),
    ],
    cafes: [
      place("d25-c1", "Airport lounge coffee"),
    ],
  },
];

/* ───────────────────────── HOTELS ─────────────────────────
 * One entry per stay (a leg of the trip). Each day card looks up the
 * hotel whose [from, to] range covers that day and shows it.
 * Names/areas are blank on purpose — fill them in from the app (tap the
 * hotel bar on any day) and they save per stay.
 */
const HOTELS = [
  { id: "h-sha1", city: "shanghai", from: "2026-09-28", to: "2026-10-04",
    name: "Home Stay (Shanghai Jing'an Temple Subway Station)",
    area: "Jing'an District",
    address: "Lane 877, Yan'an Middle Road, Jing'an District, Shanghai",
    checkIn: "15:00", checkOut: "12:00" },
  { id: "h-osa",  city: "osaka",    from: "2026-10-05", to: "2026-10-09",
    name: "JY Suites Namba",
    area: "Namba · Naniwa Ward",
    address: "2-chome-3-11 Nipponbashihigashi, Naniwa Ward, Osaka",
    checkIn: "15:00", checkOut: "11:00" },
  { id: "h-tyo",  city: "tokyo",    from: "2026-10-10", to: "2026-10-16",
    name: "Ikebukuro stay",
    area: "Ikebukuro · Toshima City",
    address: "1-chome-14-6 Ikebukuro, Toshima City, Tokyo 170-0014",
    checkIn: "15:00", checkOut: "11:00" },
  { id: "h-pek",  city: "beijing",  from: "2026-10-17", to: "2026-10-19",
    name: "Chaoyang stay",
    area: "Chaoyang District",
    address: "Building 3, No. 16 Courtyard, Guanghe Nanli 2nd Alley, Chaoyang District, Beijing",
    checkIn: "14:00", checkOut: "12:00" },
  { id: "h-sha2", city: "shanghai", from: "2026-10-19", to: "2026-10-22",
    name: "Yishu Waterfront Hotel",
    area: "Pudong New Area",
    address: "Building 69, No. 179 Lianmin Village, Pudong New Area, Shanghai",
    checkIn: "14:00", checkOut: "14:00" },
];

/* ───────────────────────── THINGS TO BUY ───────────────────────── */
const SHOPPING = [
  { category: "China", items: [
    place("s-cn1", "Silk scarf / pyjamas"),
    place("s-cn2", "Loose-leaf tea + teaware"),
    place("s-cn3", "Chops / name seal (Old City)"),
    place("s-cn4", "Cheap electronics accessories"),
  ]},
  { category: "Japan", items: [
    place("s-jp1", "Kit-Kat & snack flavours"),
    place("s-jp2", "Skincare & pharmacy haul (Don Quijote)"),
    place("s-jp3", "Stationery (Loft / Itoya)"),
    place("s-jp4", "Ceramics / chopsticks"),
    place("s-jp5", "Uniqlo / GU Japan-only lines"),
    place("s-jp6", "Anime / hobby goods (Akihabara)"),
  ]},
  { category: "Gifts", items: [
    place("s-g1", "Fridge magnets"),
    place("s-g2", "Local sweets to share"),
    place("s-g3", "Postcards"),
  ]},
];

/* ───────────────────────── FLIGHTS ───────────────────────── */
const FLIGHTS = [
  { id: "f1", label: "Outbound", from: "London", fromCode: "LHR", to: "Shanghai", toCode: "PVG",
    date: "2026-09-28", dep: "12:05", arr: "07:55 (+1)", flightNo: "", seat: "", depTerm: "", arrTerm: "", conf: "" },
  { id: "f2", label: "Shanghai → Osaka", from: "Shanghai", fromCode: "PVG", to: "Osaka", toCode: "KIX",
    date: "2026-10-06", dep: "13:15", arr: "16:35", flightNo: "", seat: "", depTerm: "T1", arrTerm: "T1", conf: "" },
  { id: "f3", label: "Osaka → Tokyo", mode: "train", from: "Osaka", fromCode: "OSA", to: "Tokyo", toCode: "TYO",
    date: "2026-10-10", dep: "", arr: "", flightNo: "Shinkansen (Nozomi)", seat: "", depTerm: "", arrTerm: "", conf: "" },
  { id: "f4", label: "Tokyo → Beijing", from: "Tokyo", fromCode: "HND", to: "Beijing", toCode: "PEK",
    date: "2026-10-17", dep: "08:50", arr: "12:00", flightNo: "", seat: "", depTerm: "T3", arrTerm: "T3", conf: "" },
  { id: "f5", label: "Beijing → Shanghai", mode: "train", from: "Beijing", fromCode: "BJS", to: "Shanghai", toCode: "SHA",
    date: "2026-10-19", dep: "18:00", arr: "", flightNo: "High-speed rail", seat: "", depTerm: "", arrTerm: "", conf: "" },
  { id: "f6", label: "Return home", from: "Shanghai", fromCode: "PVG", to: "London", toCode: "LHR",
    date: "2026-10-22", dep: "11:00", arr: "18:45", flightNo: "", seat: "", depTerm: "", arrTerm: "", conf: "" },
];

/* ───────────────────────── THINGS TO BOOK ─────────────────────────
 * Time-sensitive reservations. Each has:
 *   where        — location (venue / city)
 *   visit        — the day you plan to go (ISO, or "" if flexible)
 *   bookBy       — human-readable "when to book" advice (always shown)
 *   bookByDate   — ISO date the booking window opens / should be done by
 *                  (drives the countdown chip; leave "" if it depends on
 *                  a date you haven't fixed yet)
 *   flexible     — true if the location/date can flex
 *   note         — extra advice
 */
const BOOKINGS = [
  {
    id: "bk-hikiniku", name: "Hikiniku to Come (挽肉と米)",
    where: "Shibuya, Tokyo · also Kyoto", visit: "2026-10-11",
    bookBy: "Reservations open 1 September", bookByDate: "2026-09-01",
    flexible: true,
    note: "Prefer the Shibuya location. Extremely popular — book right when the window opens. Kyoto branch is a backup if Shibuya is full.",
  },
  {
    id: "bk-ghibli", name: "Ghibli Museum",
    where: "Mitaka, Tokyo", visit: "2026-10-14",
    bookBy: "Tickets drop 10 Sept, 10:00 JST", bookByDate: "2026-09-10",
    flexible: false,
    note: "October dates are released on 10 Sept and sell out within minutes. Be logged in and ready at 10:00 JST sharp.",
  },
  {
    id: "bk-pokemon", name: "Pokémon Café",
    where: "Osaka or Tokyo (flexible)", visit: "",
    bookBy: "Opens exactly 31 days before your chosen date", bookByDate: "",
    flexible: true,
    note: "Branches in both Osaka & Tokyo. Pick a date first, then set a reminder to book 31 days prior (e.g. going 12 Oct → book 11 Sept when the slot releases).",
  },
  {
    id: "bk-wildpark", name: "Shanghai Wild Animal Park",
    where: "Nanhui, Shanghai", visit: "2026-10-20",
    bookBy: "Book in September", bookByDate: "2026-09-01",
    flexible: false,
    note: "Reserve entry tickets in advance (passport needed). Popular in October — don't leave it late.",
  },
  {
    id: "bk-transfer-wildpark", name: "Transfer → Wild Animal Park",
    where: "Hotel → Nanhui", visit: "2026-10-20",
    bookBy: "Arrange a few days before", bookByDate: "2026-10-17",
    flexible: false,
    note: "Book a private car / Didi in advance — the park is far out and taxis back can be scarce.",
  },
  {
    id: "bk-disney", name: "Shanghai Disneyland",
    where: "Pudong, Shanghai", visit: "2026-10-21",
    bookBy: "Book in September", bookByDate: "2026-09-01",
    flexible: false,
    note: "Buy park tickets early and consider Premier Access / Early Park Entry. Link tickets in the Shanghai Disney app.",
  },
  {
    id: "bk-transfer-disney", name: "Transfer → Disneyland",
    where: "Hotel → Pudong", visit: "2026-10-21",
    bookBy: "Arrange a few days before", bookByDate: "2026-10-18",
    flexible: false,
    note: "Pre-book a car from the hotel so you arrive for park opening.",
  },
];

/* ───────────────────────── TIPS / SUGGESTIONS ───────────────────────── */
const TIPS = [
  { icon: "📶", title: "Connectivity", body: "China blocks Google/Instagram/WhatsApp — set up a reputable eSIM or VPN before you fly. Japan is open; grab a pocket Wi-Fi or eSIM at the airport." },
  { icon: "💳", title: "Payments", body: "China is cashless: link a card to Alipay & WeChat Pay before arrival. Japan still loves cash — carry some yen, and get a Suica/ICOCA/PASMO card for transit & konbini." },
  { icon: "🚄", title: "Getting around", body: "Osaka→Tokyo is fastest by Shinkansen (~3h). In China use Didi (in Alipay) for taxis and the metro apps. Keep your passport on you for Chinese attraction entry." },
  { icon: "🎫", title: "Book ahead", body: "teamLab (Tokyo), Shanghai Tower, and the Forbidden City all use timed tickets — reserve a few days out. Fushimi Inari & popular ramen are best done early morning." },
  { icon: "🧳", title: "Packing", body: "Late Sep–Oct is mild but variable: layers, a light rain jacket, and comfy walking shoes. Leave luggage room for the Japan shopping haul." },
  { icon: "🈺", title: "Handy phrases", body: "CN: nǐ hǎo (hello), xièxie (thanks), duōshǎo qián (how much). JP: konnichiwa (hello), arigatō (thanks), sumimasen (excuse me)." },
  { icon: "🍜", title: "Food etiquette", body: "Japan: no tipping, slurping noodles is fine, don't stick chopsticks upright in rice. China: sharing dishes family-style, tea gets refilled constantly." },
  { icon: "🕗", title: "Time zones", body: "China (UTC+8) and Japan (UTC+9) differ by 1 hour — nudge your watch forward flying into Osaka and back flying into Beijing." },
];

const TRIP_META = {
  title: "China · Japan",
  subtitle: "Autumn 2026",
  start: "2026-09-28",
  end: "2026-10-22",
};

/* Expose everything to app.js */
window.TRIP_DATA = { meta: TRIP_META, cities: CITIES, days: DAYS, hotels: HOTELS, shopping: SHOPPING, bookings: BOOKINGS, flights: FLIGHTS, tips: TIPS };
