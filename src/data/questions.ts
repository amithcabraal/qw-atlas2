export const questions: Question[] = [
  {
    id: 1,
    text: "Where is the Eiffel Tower located?",
    latitude: 48.8584,
    longitude: 2.2945,
    hint: "This iconic iron lattice tower is located in the capital of France",
    image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    text: "Find the Great Pyramid of Giza",
    latitude: 29.9792,
    longitude: 31.1342,
    hint: "This ancient wonder is located in Egypt",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80"
  }
  ]
/*
  {
    id: 3,
    text: "Locate Machu Picchu",
    latitude: -13.1631,
    longitude: -72.5450,
    hint: "This Incan citadel sits high in the Andes Mountains",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    text: "Find the Taj Mahal",
    latitude: 27.1751,
    longitude: 78.0421,
    hint: "This ivory-white marble mausoleum is located in Agra",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80"
  },
  {
    id: 5,
    text: "Locate the Statue of Liberty",
    latitude: 40.6892,
    longitude: -74.0445,
    hint: "This copper statue stands on Liberty Island in New York Harbor",
    image: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&q=80"
  },
  {
    id: 6,
    text: "Find the Sydney Opera House",
    latitude: -33.8568,
    longitude: 151.2153,
    hint: "This performing arts center is located in Sydney Harbour",
    image: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?auto=format&fit=crop&q=80"
  },
  {
    id: 7,
    text: "Where is the Colosseum?",
    latitude: 41.8902,
    longitude: 12.4922,
    hint: "This ancient amphitheater is located in Rome",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80"
  },
  {
    id: 8,
    text: "Locate Christ the Redeemer",
    latitude: -22.9519,
    longitude: -43.2105,
    hint: "This Art Deco statue overlooks Rio de Janeiro",
    image: "https://images.unsplash.com/photo-1593995863951-57c27e518295?auto=format&fit=crop&q=80"
  },
  {
    id: 9,
    text: "Find Petra",
    latitude: 30.3285,
    longitude: 35.4444,
    hint: "This ancient city is carved into rose-colored rock faces",
    image: "https://images.unsplash.com/photo-1579606032821-4e6161c81bd3?auto=format&fit=crop&q=80"
  },
  {
    id: 10,
    text: "Where is Mount Fuji?",
    latitude: 35.3606,
    longitude: 138.7278,
    hint: "This iconic volcano is Japan's highest peak",
    image: "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?auto=format&fit=crop&q=80"
  },
  {
    id: 11,
    text: "Find the Acropolis",
    latitude: 37.9715,
    longitude: 23.7267,
    hint: "This ancient citadel sits above Athens",
    image: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&q=80"
  },
  {
    id: 12,
    text: "Locate Angkor Wat",
    latitude: 13.4125,
    longitude: 103.8670,
    hint: "This temple complex is Cambodia's most famous landmark",
    image: "https://images.unsplash.com/photo-1600820641817-86ac1b0c2c1c?auto=format&fit=crop&q=80"
  },
  {
    id: 13,
    text: "Where is the Forbidden City?",
    latitude: 39.9042,
    longitude: 116.4074,
    hint: "This imperial palace complex is in Beijing",
    image: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&q=80"
  },
  {
    id: 14,
    text: "Find the Sagrada Familia",
    latitude: 41.4036,
    longitude: 2.1744,
    hint: "This unfinished basilica is Barcelona's most famous landmark",
    image: "https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?auto=format&fit=crop&q=80"
  },
  {
    id: 15,
    text: "Locate the Burj Khalifa",
    latitude: 25.1972,
    longitude: 55.2744,
    hint: "This is the world's tallest building",
    image: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?auto=format&fit=crop&q=80"
  },
  {
    id: 16,
    text: "Where is the Golden Gate Bridge?",
    latitude: 37.8199,
    longitude: -122.4783,
    hint: "This suspension bridge is San Francisco's iconic landmark",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&q=80"
  },
  {
    id: 17,
    text: "Find the Blue Mosque",
    latitude: 41.0054,
    longitude: 28.9768,
    hint: "This historic mosque is in Istanbul",
    image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&q=80"
  },
  {
    id: 18,
    text: "Locate Stonehenge",
    latitude: 51.1789,
    longitude: -1.8262,
    hint: "This prehistoric monument stands on Salisbury Plain",
    image: "https://images.unsplash.com/photo-1599833975787-5c143f373c30?auto=format&fit=crop&q=80"
  },
  {
    id: 19,
    text: "Where is the Kremlin?",
    latitude: 55.7520,
    longitude: 37.6175,
    hint: "This fortified complex is in the heart of Moscow",
    image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&q=80"
  },
  {
    id: 20,
    text: "Find the Petronas Towers",
    latitude: 3.1577,
    longitude: 101.7114,
    hint: "These twin skyscrapers dominate Kuala Lumpur's skyline",
    image: "https://images.unsplash.com/photo-1604728717068-e9e1f12c2e43?auto=format&fit=crop&q=80"
  },
  {
    id: 21,
    text: "Locate the Moai Statues",
    latitude: -27.1127,
    longitude: -109.3497,
    hint: "These monolithic human figures are on Easter Island",
    image: "https://images.unsplash.com/photo-1597240890284-c93f86e4e3d9?auto=format&fit=crop&q=80"
  },
  {
    id: 22,
    text: "Where is the Brandenburg Gate?",
    latitude: 52.5163,
    longitude: 13.3777,
    hint: "This neoclassical monument is in Berlin",
    image: "https://images.unsplash.com/photo-1566404791232-af9fe0ae8f8b?auto=format&fit=crop&q=80"
  },
  {
    id: 23,
    text: "Find the Parthenon",
    latitude: 37.9715,
    longitude: 23.7267,
    hint: "This ancient temple sits atop the Acropolis",
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&q=80"
  },
  {
    id: 24,
    text: "Locate Big Ben",
    latitude: 51.5007,
    longitude: -0.1246,
    hint: "This famous clock tower stands beside the Thames",
    image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&q=80"
  },
  {
    id: 25,
    text: "Where is the Louvre Museum?",
    latitude: 48.8606,
    longitude: 2.3376,
    hint: "This art museum is housed in a historic palace in Paris",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80"
  },
  {
    id: 26,
    text: "Find the Hagia Sophia",
    latitude: 41.0086,
    longitude: 28.9802,
    hint: "This ancient basilica-turned-mosque is in Istanbul",
    image: "https://images.unsplash.com/photo-1626275320156-4906b2e8c9dd?auto=format&fit=crop&q=80"
  },
  {
    id: 27,
    text: "Locate the Leaning Tower of Pisa",
    latitude: 43.7230,
    longitude: 10.3966,
    hint: "This famously tilted bell tower is in Italy",
    image: "https://images.unsplash.com/photo-1522918448933-b33e408a411a?auto=format&fit=crop&q=80"
  },
  {
    id: 28,
    text: "Where is the Great Wall of China?",
    latitude: 40.4319,
    longitude: 116.5704,
    hint: "This is the location of the Mutianyu section",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80"
  },
  {
    id: 29,
    text: "Find the Sistine Chapel",
    latitude: 41.9029,
    longitude: 12.4545,
    hint: "This chapel is in Vatican City",
    image: "https://images.unsplash.com/photo-1594844181208-d92c2c72f4be?auto=format&fit=crop&q=80"
  },
  {
    id: 30,
    text: "Locate the Palace of Versailles",
    latitude: 48.8048,
    longitude: 2.1203,
    hint: "This royal château is southwest of Paris",
    image: "https://images.unsplash.com/photo-1596636478939-6d53d4f1dbae?auto=format&fit=crop&q=80"
  }
];
*/
