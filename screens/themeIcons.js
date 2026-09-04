// Generated from item-review-export.json by tools/item-reviewer/apply-export.js.
// Keep require() calls static so React Native can bundle the item images.
const ITEM_CATALOG = [
  {
    id: "100 bord",
    name: "100 bord",
    themes: ["snelweg","vakantie","verkeersborden"],
    excludedThemes: [],
    weight: 5,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/100 bord.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Verkeersborden/100 bord.png"),
      verkeersborden: require("../assets/images/Verkeersborden/100 bord.png"),
    },
  },
  {
    id: "130 bord",
    name: "130 bord",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 4,
    themeWeights: {"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/130 bord.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Verkeersborden/130 bord.png"),
      verkeersborden: require("../assets/images/Verkeersborden/130 bord.png"),
    },
  },
  {
    id: "30 bord",
    name: "30 bord",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 5,
    themeWeights: {"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/30 bord.png"),
    iconsByTheme: {
      stad: require("../assets/images/Verkeersborden/30 bord.png"),
      verkeersborden: require("../assets/images/Verkeersborden/30 bord.png"),
    },
  },
  {
    id: "adviessnelheid 60",
    name: "adviessnelheid 60",
    themes: ["platteland","verkeersborden"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/adviessnelheid 60.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Verkeersborden/adviessnelheid 60.png"),
      verkeersborden: require("../assets/images/Verkeersborden/adviessnelheid 60.png"),
    },
  },
  {
    id: "afzethek",
    name: "afzethek",
    themes: ["stad"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Platteland/afzethek.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/afzethek.png"),
    },
  },
  {
    id: "ambulance",
    name: "ambulance",
    themes: ["stad","voertuigen"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {"voertuigen":2},
    defaultIcon: require("../assets/images/stad/ambulance.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/ambulance.png"),
    },
  },
  {
    id: "anwb auto",
    name: "anwb auto",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":3,"snelweg":2},
    defaultIcon: require("../assets/images/Snelweg/anwb auto.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/anwb auto.png"),
    },
  },
  {
    id: "apotheekbord",
    name: "apotheekbord",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/apotheekbord.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/apotheekbord.png"),
    },
  },
  {
    id: "auto met aanhangwagen",
    name: "auto met aanhangwagen",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["stad","verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":3,"voertuigen":4},
    defaultIcon: require("../assets/images/Snelweg/auto met aanhangwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/auto met aanhangwagen.png"),
      platteland: require("../assets/images/Snelweg/auto met aanhangwagen.png"),
    },
  },
  {
    id: "auto met dakkoffer",
    name: "auto met dakkoffer",
    themes: ["snelweg","vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":4,"snelweg":2,"voertuigen":3},
    defaultIcon: require("../assets/images/Snelweg/auto met dakkoffer.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/auto met dakkoffer.png"),
    },
  },
  {
    id: "auto met fietsdrager",
    name: "auto met fietsdrager",
    themes: ["snelweg","vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"vakantie":4,"voertuigen":3},
    defaultIcon: require("../assets/images/Snelweg/auto met fietsdrager.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/auto met fietsdrager.png"),
    },
  },
  {
    id: "auto met paardenwagen",
    name: "auto met paardenwagen",
    themes: ["snelweg","platteland","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"platteland":4,"voertuigen":2},
    defaultIcon: require("../assets/images/Snelweg/auto met paardenwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/auto met paardenwagen.png"),
    },
  },
  {
    id: "auto met pech",
    name: "auto met pech",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":3,"vakantie":3},
    defaultIcon: require("../assets/images/Snelweg/auto met pech.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/auto met pech.png"),
    },
  },
  {
    id: "autotransporter",
    name: "autotransporter",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":4,"voertuigen":2},
    defaultIcon: require("../assets/images/Voertuigen/autotransporter.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/autotransporter.png"),
    },
  },
  {
    id: "bakfiets",
    name: "bakfiets",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3},
    defaultIcon: require("../assets/images/stad/bakfiets.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/bakfiets.png"),
    },
  },
  {
    id: "autosnelweg bord",
    name: "begin autosnelweg bord",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":4,"verkeersborden":3},
    defaultIcon: require("../assets/images/Snelweg/autosnelweg-bord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "bestelbus",
    name: "bestelbus",
    themes: ["algemeen"],
    excludedThemes: ["verkeersborden"],
    weight: 3,
    themeWeights: {"algemeen":3},
    defaultIcon: require("../assets/images/Voertuigen/bestelbus.png"),
    iconsByTheme: {
    },
  },
  {
    id: "afvalbak groen",
    name: "blikvanger",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"platteland":2},
    defaultIcon: require("../assets/images/stad/afvalbak-groen.png"),
    iconsByTheme: {
    },
  },
  {
    id: "blokhut",
    name: "blokhut",
    themes: ["bergen"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Bergen/blokhut.png"),
    iconsByTheme: {
    },
  },
  {
    id: "boot op aanhangwagen",
    name: "boot op aanhangwagen",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Vakantie/boot op aanhangwagen.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/boot op aanhangwagen.png"),
    },
  },
  {
    id: "wegwijzerbord",
    name: "bord boven snelweg",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 5,
    themeWeights: {"snelweg":5},
    defaultIcon: require("../assets/images/Snelweg/wegwijzerbord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "brandweerauto",
    name: "brandweerauto",
    themes: ["stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"voertuigen":2},
    defaultIcon: require("../assets/images/stad/brandweerauto.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/brandweerauto.png"),
    },
  },
  {
    id: "brievenbus",
    name: "brievenbus",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3},
    defaultIcon: require("../assets/images/stad/brievenbus.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/brievenbus.png"),
    },
  },
  {
    id: "brug over water",
    name: "brug over water",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":3,"vakantie":4},
    defaultIcon: require("../assets/images/Snelweg/brug over water.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/brug over water.png"),
    },
  },
  {
    id: "brug over weg",
    name: "brug over weg",
    themes: ["snelweg"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":4},
    defaultIcon: require("../assets/images/Snelweg/brug over weg.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/brug over weg.png"),
    },
  },
  {
    id: "bulldozer",
    name: "bulldozer",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/bulldozer.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/bulldozer.png"),
    },
  },
  {
    id: "bushalte",
    name: "bushalte",
    themes: ["stad","vakantie"],
    excludedThemes: ["voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"stad":4,"vakantie":2},
    defaultIcon: require("../assets/images/stad/bushalte.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/bushalte.png"),
    },
  },
  {
    id: "busje",
    name: "busje",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":5,"voertuigen":4},
    defaultIcon: require("../assets/images/Voertuigen/busje.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Voertuigen/busje.png"),
      voertuigen: require("../assets/images/Voertuigen/busje.png"),
    },
  },
  {
    id: "cabrio",
    name: "cabrio",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["winter","verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":4,"voertuigen":4},
    defaultIcon: require("../assets/images/Voertuigen/cabrio.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/cabrio.png"),
    },
  },
  {
    id: "camper",
    name: "camper",
    themes: ["snelweg","vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":5,"snelweg":1,"voertuigen":4},
    defaultIcon: require("../assets/images/Vakantie/camper.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/camper.png"),
      voertuigen: require("../assets/images/Voertuigen/camper.png"),
    },
  },
  {
    id: "camperspiegel",
    name: "camperspiegel",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":3},
    defaultIcon: require("../assets/images/Vakantie/camperspiegel.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/camperspiegel.png"),
    },
  },
  {
    id: "caravan",
    name: "caravan",
    themes: ["snelweg","vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":1,"vakantie":5,"voertuigen":4},
    defaultIcon: require("../assets/images/Vakantie/caravan.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/caravan.png"),
      voertuigen: require("../assets/images/Voertuigen/caravan.png"),
    },
  },
  {
    id: "cementwagen",
    name: "cementwagen",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":2},
    defaultIcon: require("../assets/images/Voertuigen/cementwagen.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/cementwagen.png"),
    },
  },
  {
    id: "cruise schip",
    name: "cruise schip",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/cruise schip.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/cruise schip.png"),
    },
  },
  {
    id: "dennenbomen",
    name: "dennenbomen",
    themes: ["bergen"],
    excludedThemes: [],
    weight: 4,
    themeWeights: {},
    defaultIcon: require("../assets/images/Platteland/dennenbomen.png"),
    iconsByTheme: {
    },
  },
  {
    id: "doodlopende weg",
    name: "doodlopende weg",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/doodlopende weg.png"),
    iconsByTheme: {
      stad: require("../assets/images/Verkeersborden/doodlopende weg.png"),
      verkeersborden: require("../assets/images/Verkeersborden/doodlopende weg.png"),
    },
  },
  {
    id: "eend",
    name: "eend",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":2},
    defaultIcon: require("../assets/images/Platteland/eend.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/eend.png"),
    },
  },
  {
    id: "eenrichtingsveer rechts",
    name: "eenrichtingsveer rechts",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/eenrichtingsveer rechts.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/eenrichtingsveer rechts.png"),
    },
  },
  {
    id: "eenrichtingsverkeer rechtdoor",
    name: "eenrichtingsverkeer rechtdoor",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/eenrichtingsverkeer rechtdoor.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/eenrichtingsverkeer rechtdoor.png"),
    },
  },
  {
    id: "einde autosnelweg bord",
    name: "einde autosnelweg bord",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Snelweg/einde-autosnelweg-bord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "zwart wit markeringsbord",
    name: "einde vluchtstrook bord",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":2,"verkeersborden":1},
    defaultIcon: require("../assets/images/Snelweg/zwart-wit-markeringsbord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "houten afzetpaal",
    name: "elektriciteitspaal",
    themes: ["platteland","vakantie"],
    excludedThemes: ["snelweg","stad","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"platteland":1,"vakantie":3},
    defaultIcon: require("../assets/images/Platteland/houten-afzetpaal.png"),
    iconsByTheme: {
    },
  },
  {
    id: "fabriek",
    name: "fabriek",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/fabriek.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/fabriek.png"),
    },
  },
  {
    id: "fietser",
    name: "fietser",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5},
    defaultIcon: require("../assets/images/stad/fietser.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/fietser.png"),
    },
  },
  {
    id: "fietspad",
    name: "fietspad",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"platteland":2},
    defaultIcon: require("../assets/images/Platteland/fietspad.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/fietspad.png"),
    },
  },
  {
    id: "fietspaddestoel",
    name: "fietspaddestoel",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":1},
    defaultIcon: require("../assets/images/Platteland/fietspaddestoel.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/fietspaddestoel.png"),
    },
  },
  {
    id: "file",
    name: "file",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":4,"vakantie":3},
    defaultIcon: require("../assets/images/Snelweg/file.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/file.png"),
    },
  },
  {
    id: "flat",
    name: "flat",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2},
    defaultIcon: require("../assets/images/stad/flat.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/flat.png"),
    },
  },
  {
    id: "flitspaal",
    name: "flitspaal",
    themes: ["snelweg","stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"stad":3},
    defaultIcon: require("../assets/images/stad/flitspaal.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/flitspaal.png"),
    },
  },
  {
    id: "foodtruck",
    name: "foodtruck",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/foodtruck.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/foodtruck.png"),
    },
  },
  {
    id: "geldautomaat",
    name: "geldautomaat",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2},
    defaultIcon: require("../assets/images/stad/geldautomaat.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/geldautomaat.png"),
    },
  },
  {
    id: "rood wit baken",
    name: "geleidenbaken",
    themes: ["snelweg","stad","vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"stad":1,"vakantie":1},
    defaultIcon: require("../assets/images/Verkeersborden/rood-wit-baken.png"),
    iconsByTheme: {
    },
  },
  {
    id: "gesloten voor fietsers",
    name: "gesloten voor fietsers",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor fietsers.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor fietsers.png"),
    },
  },
  {
    id: "gesloten voor fietsers en bromfietsers",
    name: "gesloten voor fietsers en bromfietsers",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor fietsers en bromfietsers.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor fietsers en bromfietsers.png"),
    },
  },
  {
    id: "gesloten voor te brede voertuigen",
    name: "gesloten voor te brede voertuigen",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"verkeersborden":2},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor te brede voertuigen.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor te brede voertuigen.png"),
    },
  },
  {
    id: "gesloten voor te hoge voertuigen",
    name: "gesloten voor te hoge voertuigen",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor te hoge voertuigen.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor te hoge voertuigen.png"),
    },
  },
  {
    id: "gesloten voor zware aslast",
    name: "gesloten voor zware aslast",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor zware aslast.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor zware aslast.png"),
    },
  },
  {
    id: "gesloten voor zware voertuigen",
    name: "gesloten voor zware voertuigen",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/gesloten voor zware voertuigen.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/gesloten voor zware voertuigen.png"),
    },
  },
  {
    id: "gladheid bord",
    name: "gladheid bord",
    themes: ["winter","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"winter":3,"verkeersborden":1},
    defaultIcon: require("../assets/images/Winter/gladheid-bord.png"),
    iconsByTheme: {
      winter: require("../assets/images/Winter/gladheid-bord.png"),
    },
  },
  {
    id: "golfcart",
    name: "golfcart",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/golfcart.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/golfcart.png"),
    },
  },
  {
    id: "graafmachine",
    name: "graafmachine",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":4,"snelweg":1},
    defaultIcon: require("../assets/images/Voertuigen/graafmachine.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/graafmachine.png"),
    },
  },
  {
    id: "graffiti",
    name: "graffiti",
    themes: ["snelweg","stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":4,"stad":2},
    defaultIcon: require("../assets/images/Snelweg/graffiti.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/graffiti.png"),
    },
  },
  {
    id: "grensbord",
    name: "grensbord",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":1},
    defaultIcon: require("../assets/images/Vakantie/grensbord.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/grensbord.png"),
    },
  },
  {
    id: "groen pijlbord",
    name: "groen pijlbord",
    themes: ["snelweg","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":4,"verkeersborden":3},
    defaultIcon: require("../assets/images/Snelweg/groen-pijlbord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "groene container",
    name: "grote container",
    themes: ["stad","platteland","vakantie","winter","bergen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 3,
    themeWeights: {"stad":4,"platteland":2,"vakantie":4},
    defaultIcon: require("../assets/images/stad/groene-container.png"),
    iconsByTheme: {
    },
  },
  {
    id: "hectometerpaal",
    name: "hectometerpaal",
    themes: ["snelweg"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":5},
    defaultIcon: require("../assets/images/Snelweg/hectometerpaal.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/hectometerpaal.png"),
    },
  },
  {
    id: "helikopter",
    name: "helikopter",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":3,"snelweg":2},
    defaultIcon: require("../assets/images/Snelweg/helikopter.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/helikopter.png"),
    },
  },
  {
    id: "hijskraan",
    name: "hijskraan",
    themes: ["snelweg","stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"stad":3},
    defaultIcon: require("../assets/images/stad/hijskraan.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/stad/hijskraan.png"),
      stad: require("../assets/images/stad/hijskraan.png"),
    },
  },
  {
    id: "hond",
    name: "hond",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"platteland":1},
    defaultIcon: require("../assets/images/Platteland/hond.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/hond.png"),
    },
  },
  {
    id: "hoogspanningsmast",
    name: "hoogspanningsmast",
    themes: ["snelweg"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":5},
    defaultIcon: require("../assets/images/Snelweg/hoogspanningsmast.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/hoogspanningsmast.png"),
    },
  },
  {
    id: "hoogwerker",
    name: "hoogwerker",
    themes: ["snelweg","stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"voertuigen":2,"snelweg":1},
    defaultIcon: require("../assets/images/Platteland/hoogwerker.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/hoogwerker.png"),
    },
  },
  {
    id: "hooibaal",
    name: "hooibaal",
    themes: ["snelweg","platteland","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":3,"platteland":4,"vakantie":2},
    defaultIcon: require("../assets/images/Snelweg/hooibaal.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/hooibaal.png"),
    },
  },
  {
    id: "houtstapel",
    name: "houtstapel",
    themes: ["platteland","vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":4,"vakantie":3,"bergen":4},
    defaultIcon: require("../assets/images/Bergen/houtstapel.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/houtstapel.png"),
    },
  },
  {
    id: "huis",
    name: "huis",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5},
    defaultIcon: require("../assets/images/stad/huis.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/huis.png"),
    },
  },
  {
    id: "huis met lichtjes",
    name: "huis met lichtjes",
    themes: ["winter"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"winter":4},
    defaultIcon: require("../assets/images/Winter/huis-met-lichtjes.png"),
    iconsByTheme: {
      winter: require("../assets/images/Winter/huis-met-lichtjes.png"),
    },
  },
  {
    id: "huis met zonnepanelen",
    name: "huis met zonnepanelen",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"platteland":3},
    defaultIcon: require("../assets/images/Platteland/huis met zonnepanelen.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/huis met zonnepanelen.png"),
    },
  },
  {
    id: "ijscowagen",
    name: "ijscowagen",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/ijscowagen.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/ijscowagen.png"),
    },
  },
  {
    id: "informatiebord natuurgebied",
    name: "informatiebord natuurgebied",
    themes: ["vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":3,"bergen":4},
    defaultIcon: require("../assets/images/Bergen/informatiebord-natuurgebied.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/informatiebord-natuurgebied.png"),
    },
  },
  {
    id: "inrijden toegestaan",
    name: "inrijden toegestaan",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/inrijden toegestaan.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/inrijden toegestaan.png"),
    },
  },
  {
    id: "inrijverbod beide richtingen",
    name: "inrijverbod beide richtingen",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/inrijverbod beide richtingen.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/inrijverbod beide richtingen.png"),
    },
  },
  {
    id: "inrijverbod deze richting",
    name: "inrijverbod deze richting",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/inrijverbod deze richting.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/inrijverbod deze richting.png"),
    },
  },
  {
    id: "kas",
    name: "kas",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":3},
    defaultIcon: require("../assets/images/Platteland/kas.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/kas.png"),
    },
  },
  {
    id: "kasteel",
    name: "kasteel",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":1},
    defaultIcon: require("../assets/images/Vakantie/kasteel.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/kasteel.png"),
    },
  },
  {
    id: "kerk",
    name: "kerk",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"platteland":4},
    defaultIcon: require("../assets/images/stad/kerk.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/kerk.png"),
      platteland: require("../assets/images/stad/kerk.png"),
    },
  },
  {
    id: "kerstboom",
    name: "kerstboom",
    themes: ["winter"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"winter":5},
    defaultIcon: require("../assets/images/Winter/kerstboom.png"),
    iconsByTheme: {
      winter: require("../assets/images/Winter/kerstboom.png"),
    },
  },
  {
    id: "kerstkrans",
    name: "kerstkrans",
    themes: ["winter"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Winter/kerstkrans.png"),
    iconsByTheme: {
    },
  },
  {
    id: "kerstman",
    name: "kerstman",
    themes: ["winter"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Winter/kerstman.png"),
    iconsByTheme: {
    },
  },
  {
    id: "kinderwagen",
    name: "kinderwagen",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2},
    defaultIcon: require("../assets/images/stad/kinderwagen.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/kinderwagen.png"),
    },
  },
  {
    id: "kledingrek",
    name: "kledingrek",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":1},
    defaultIcon: require("../assets/images/Vakantie/kledingrek.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/kledingrek.png"),
    },
  },
  {
    id: "kliko",
    name: "kliko",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5,"platteland":4},
    defaultIcon: require("../assets/images/stad/kliko.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/kliko.png"),
    },
  },
  {
    id: "koe",
    name: "koe",
    themes: ["platteland","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":5,"bergen":2},
    defaultIcon: require("../assets/images/Platteland/koe.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/koe.png"),
    },
  },
  {
    id: "kruising",
    name: "kruising",
    themes: ["algemeen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":3},
    defaultIcon: require("../assets/images/stad/kruising.png"),
    iconsByTheme: {
    },
  },
  {
    id: "laadpaal",
    name: "laadpaal",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2},
    defaultIcon: require("../assets/images/stad/laadpaal.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/laadpaal.png"),
    },
  },
  {
    id: "lesauto",
    name: "lesauto",
    themes: ["stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"voertuigen":3},
    defaultIcon: require("../assets/images/stad/lesauto.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/lesauto.png"),
    },
  },
  {
    id: "limousine",
    name: "limousine",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/limousine.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/limousine.png"),
    },
  },
  {
    id: "loopbrug",
    name: "loopbrug",
    themes: ["snelweg"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":3},
    defaultIcon: require("../assets/images/Snelweg/loopbrug.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/loopbrug.png"),
    },
  },
  {
    id: "luchtballon",
    name: "luchtballon",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":1,"vakantie":1},
    defaultIcon: require("../assets/images/Vakantie/luchtballon.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/luchtballon.png"),
    },
  },
  {
    id: "man die hond uit laat",
    name: "man die hond uit laat",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4},
    defaultIcon: require("../assets/images/stad/man die hond uit laat.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/man die hond uit laat.png"),
    },
  },
  {
    id: "man op grasmaaier",
    name: "man op grasmaaier",
    themes: ["platteland","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":1,"voertuigen":1},
    defaultIcon: require("../assets/images/Platteland/man op grasmaaier.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/man op grasmaaier.png"),
    },
  },
  {
    id: "marktkraam",
    name: "marktkraam",
    themes: ["stad","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"vakantie":2},
    defaultIcon: require("../assets/images/stad/marktkraam.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/marktkraam.png"),
    },
  },
  {
    id: "matrixbord rood kruis",
    name: "matrixbord rood kruis",
    themes: ["snelweg"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2},
    defaultIcon: require("../assets/images/Snelweg/matrixbord rood kruis.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/matrixbord rood kruis.png"),
    },
  },
  {
    id: "medium truck",
    name: "medium truck",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":4,"voertuigen":4},
    defaultIcon: require("../assets/images/stad/medium truck.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/medium truck.png"),
    },
  },
  {
    id: "meer",
    name: "meer",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":3},
    defaultIcon: require("../assets/images/Vakantie/meer.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/meer.png"),
    },
  },
  {
    id: "meeuwen",
    name: "meeuwen",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":4},
    defaultIcon: require("../assets/images/Vakantie/meeuwen.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/meeuwen.png"),
    },
  },
  {
    id: "molen",
    name: "molen",
    themes: ["snelweg","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"platteland":2},
    defaultIcon: require("../assets/images/Snelweg/molen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/molen.png"),
    },
  },
  {
    id: "monstertruck",
    name: "monstertruck",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/monstertruck.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/monstertruck.png"),
    },
  },
  {
    id: "motorboot",
    name: "motorboot",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/motorboot.png"),
    iconsByTheme: {
    },
  },
  {
    id: "motorrijder",
    name: "motorrijder",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":4,"voertuigen":4},
    defaultIcon: require("../assets/images/Snelweg/motorrijder.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/motorrijder.png"),
    },
  },
  {
    id: "nederlandse vlag",
    name: "nederlandse vlag",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"platteland":4},
    defaultIcon: require("../assets/images/Platteland/nederlandse vlag.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/nederlandse vlag.png"),
    },
  },
  {
    id: "oldtimer",
    name: "oldtimer",
    themes: ["snelweg","stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"stad":1,"voertuigen":2},
    defaultIcon: require("../assets/images/Voertuigen/oldtimer.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/oldtimer.png"),
    },
  },
  {
    id: "overstekend wild",
    name: "overstekend wild",
    themes: ["platteland","bergen","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":3,"bergen":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/overstekend wild.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Verkeersborden/overstekend wild.png"),
      verkeersborden: require("../assets/images/Verkeersborden/overstekend wild.png"),
    },
  },
  {
    id: "paard",
    name: "paard",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":4},
    defaultIcon: require("../assets/images/Platteland/paard.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/paard.png"),
    },
  },
  {
    id: "paraplu",
    name: "paraplu",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":1},
    defaultIcon: require("../assets/images/stad/paraplu.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/paraplu.png"),
    },
  },
  {
    id: "parasol",
    name: "parasol",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/parasol.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/parasol.png"),
    },
  },
  {
    id: "parkeerbord",
    name: "parkeerbord",
    themes: ["algemeen","stad"],
    excludedThemes: ["snelweg","voertuigen"],
    weight: 3,
    themeWeights: {"stad":4,"algemeen":3},
    defaultIcon: require("../assets/images/stad/parkeerbord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "passagiervliegtuig",
    name: "passagiervliegtuig",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"vakantie":3},
    defaultIcon: require("../assets/images/Snelweg/passagiervliegtuig.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/passagiervliegtuig.png"),
    },
  },
  {
    id: "picknicktafel",
    name: "picknicktafel",
    themes: ["algemeen","vakantie"],
    excludedThemes: ["voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"algemeen":1,"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/picknicktafel.png"),
    iconsByTheme: {
    },
  },
  {
    id: "pickup",
    name: "pickup-truck",
    themes: ["algemeen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 3,
    themeWeights: {"voertuigen":4},
    defaultIcon: require("../assets/images/Voertuigen/pickup.png"),
    iconsByTheme: {
    },
  },
  {
    id: "poes",
    name: "poes",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":1,"platteland":1},
    defaultIcon: require("../assets/images/Platteland/poes.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/poes.png"),
    },
  },
  {
    id: "politie auto",
    name: "politie auto",
    themes: ["snelweg","stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"stad":2,"voertuigen":2},
    defaultIcon: require("../assets/images/stad/politie auto.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/politie auto.png"),
    },
  },
  {
    id: "politie motorrijder",
    name: "politie motorrijder",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"voertuigen":1},
    defaultIcon: require("../assets/images/Snelweg/politie motorrijder.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/politie motorrijder.png"),
    },
  },
  {
    id: "politieagent",
    name: "politieagent",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":1},
    defaultIcon: require("../assets/images/stad/politieagent.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/politieagent.png"),
    },
  },
  {
    id: "postbode",
    name: "postbode",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":1},
    defaultIcon: require("../assets/images/stad/postbode.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/postbode.png"),
    },
  },
  {
    id: "quad",
    name: "quad",
    themes: ["platteland","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":1,"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/quad.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Voertuigen/quad.png"),
      voertuigen: require("../assets/images/Voertuigen/quad.png"),
    },
  },
  {
    id: "rechts houden bord",
    name: "rechts houden bord",
    themes: ["algemeen","verkeersborden"],
    excludedThemes: ["snelweg","bergen","voertuigen"],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/rechts-houden-bord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "reflectorpaal",
    name: "reflectorpaal",
    themes: ["platteland","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":5,"vakantie":3},
    defaultIcon: require("../assets/images/Platteland/reflectorpaal.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/reflectorpaal.png"),
    },
  },
  {
    id: "regenboog",
    name: "regenboog",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/regenboog.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/regenboog.png"),
    },
  },
  {
    id: "riksja",
    name: "riksja",
    themes: ["vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":1,"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/riksja.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/riksja.png"),
    },
  },
  {
    id: "bergrivier",
    name: "rivier",
    themes: ["vakantie","bergen"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Bergen/bergrivier.png"),
    iconsByTheme: {
    },
  },
  {
    id: "roeiboot",
    name: "roeiboot",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":3},
    defaultIcon: require("../assets/images/Vakantie/roeiboot.png"),
    iconsByTheme: {
    },
  },
  {
    id: "rotonde",
    name: "rotonde",
    themes: ["stad","platteland","vakantie","winter"],
    excludedThemes: ["snelweg","bergen","voertuigen","verkeersborden"],
    weight: 4,
    themeWeights: {"platteland":2,"vakantie":3},
    defaultIcon: require("../assets/images/Platteland/rotonde.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/rotonde.png"),
    },
  },
  {
    id: "rotondebord",
    name: "rotondebord",
    themes: ["stad","platteland","vakantie","winter"],
    excludedThemes: ["voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"platteland":2,"stad":4,"vakantie":3,"winter":3},
    defaultIcon: require("../assets/images/Platteland/rotondebord.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/rotondebord.png"),
    },
  },
  {
    id: "lijkwagen",
    name: "rouwauto",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":1,"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/lijkwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Voertuigen/lijkwagen.png"),
      voertuigen: require("../assets/images/Voertuigen/lijkwagen.png"),
    },
  },
  {
    id: "rubberboot",
    name: "rubberboot",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/rubberboot.png"),
    iconsByTheme: {
    },
  },
  {
    id: "bochtig verkeersbord",
    name: "s-bocht verkeersbord",
    themes: ["algemeen","platteland","bergen","verkeersborden"],
    excludedThemes: ["stad","voertuigen"],
    weight: 1,
    themeWeights: {"verkeersborden":3,"bergen":4,"platteland":2,"algemeen":2},
    defaultIcon: require("../assets/images/Bergen/bochtig-verkeersbord.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/bochtig-verkeersbord.png"),
    },
  },
  {
    id: "schaap",
    name: "schaap",
    themes: ["platteland","vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":3,"bergen":3,"vakantie":2},
    defaultIcon: require("../assets/images/Platteland/schaap.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/schaap.png"),
    },
  },
  {
    id: "schaatser",
    name: "schaatser",
    themes: ["winter"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"winter":3},
    defaultIcon: require("../assets/images/Winter/schaatser.png"),
    iconsByTheme: {
      winter: require("../assets/images/Winter/schaatser.png"),
    },
  },
  {
    id: "bocht reflectoren",
    name: "scherpe bocht",
    themes: ["snelweg","vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":2,"vakantie":4,"bergen":4},
    defaultIcon: require("../assets/images/Bergen/bocht-reflectoren.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/bocht-reflectoren.png"),
    },
  },
  {
    id: "schotelantenne",
    name: "schotelantenne",
    themes: ["stad","platteland","vakantie","bergen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"stad":3,"platteland":3,"vakantie":3,"bergen":3},
    defaultIcon: require("../assets/images/Bergen/schotelantenne.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/schotelantenne.png"),
    },
  },
  {
    id: "schrikdraad",
    name: "schrikdraad",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":2},
    defaultIcon: require("../assets/images/Platteland/schrikdraad.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/schrikdraad.png"),
    },
  },
  {
    id: "scooter",
    name: "scooter",
    themes: ["stad","vakantie","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"vakantie":3,"voertuigen":3},
    defaultIcon: require("../assets/images/Voertuigen/scooter.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/scooter.png"),
    },
  },
  {
    id: "segway",
    name: "segway",
    themes: ["voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/segway.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/segway.png"),
    },
  },
  {
    id: "slagboom",
    name: "slagboom",
    themes: ["stad","platteland","winter","bergen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"winter":2,"bergen":2,"platteland":2,"stad":3},
    defaultIcon: require("../assets/images/Vakantie/slagboom.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/slagboom.png"),
    },
  },
  {
    id: "slee",
    name: "slee",
    themes: ["winter"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"winter":3},
    defaultIcon: require("../assets/images/Winter/slee.png"),
    iconsByTheme: {
      winter: require("../assets/images/Winter/slee.png"),
    },
  },
  {
    id: "sleepwagen",
    name: "sleepwagen",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":3,"voertuigen":3},
    defaultIcon: require("../assets/images/Snelweg/sleepwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/sleepwagen.png"),
    },
  },
  {
    id: "sloot",
    name: "sloot",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":4},
    defaultIcon: require("../assets/images/Platteland/sloot.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/sloot.png"),
    },
  },
  {
    id: "sneeuwpop",
    name: "sneeuwpop",
    themes: ["winter"],
    excludedThemes: [],
    weight: 4,
    themeWeights: {},
    defaultIcon: require("../assets/images/Winter/sneeuwpop.png"),
    iconsByTheme: {
    },
  },
  {
    id: "snelheidsbord 50",
    name: "snelheidsbord 50",
    themes: ["algemeen","verkeersborden"],
    excludedThemes: ["snelweg","voertuigen"],
    weight: 3,
    themeWeights: {"algemeen":2},
    defaultIcon: require("../assets/images/Verkeersborden/snelheidsbord-50.png"),
    iconsByTheme: {
    },
  },
  {
    id: "snelheidsbord 80",
    name: "snelheidsbord 80",
    themes: ["platteland","vakantie","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"vakantie":2,"verkeersborden":3,"platteland":4},
    defaultIcon: require("../assets/images/Verkeersborden/snelheidsbord-80.png"),
    iconsByTheme: {
    },
  },
  {
    id: "snelheidsmeter",
    name: "snelheidsmeter",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4},
    defaultIcon: require("../assets/images/stad/snelheidsmeter.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/snelheidsmeter.png"),
    },
  },
  {
    id: "snowcat",
    name: "snowcat",
    themes: ["bergen","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"bergen":2,"voertuigen":1},
    defaultIcon: require("../assets/images/Voertuigen/snowcat.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/snowcat.png"),
    },
  },
  {
    id: "speeltuin",
    name: "speeltuin",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3},
    defaultIcon: require("../assets/images/stad/speeltuin.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/speeltuin.png"),
    },
  },
  {
    id: "spoorboom",
    name: "spoorboom",
    themes: ["stad","platteland","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"platteland":2,"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/spoorboom.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/spoorboom.png"),
    },
  },
  {
    id: "spoorrails",
    name: "spoorrails",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"snelweg":4,"vakantie":2},
    defaultIcon: require("../assets/images/Snelweg/spoorrails.png"),
    iconsByTheme: {
    },
  },
  {
    id: "sportauto",
    name: "sportauto",
    themes: ["snelweg","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":3,"voertuigen":3},
    defaultIcon: require("../assets/images/Voertuigen/sportauto.png"),
    iconsByTheme: {
      voertuigen: require("../assets/images/Voertuigen/sportauto.png"),
    },
  },
  {
    id: "bus",
    name: "stadsbus",
    themes: ["stad","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"stad":4,"voertuigen":4},
    defaultIcon: require("../assets/images/stad/bus.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/bus.png"),
    },
  },
  {
    id: "stopbord",
    name: "stopbord",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/stopbord.png"),
    iconsByTheme: {
      stad: require("../assets/images/Verkeersborden/stopbord.png"),
      verkeersborden: require("../assets/images/Verkeersborden/stopbord.png"),
    },
  },
  {
    id: "stoplicht",
    name: "stoplicht",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5},
    defaultIcon: require("../assets/images/stad/stoplicht.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/stoplicht.png"),
    },
  },
  {
    id: "strandwachthut",
    name: "strandwachthut",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/strandwachthut.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/strandwachthut.png"),
    },
  },
  {
    id: "tankstation",
    name: "tankstation",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":5,"vakantie":4},
    defaultIcon: require("../assets/images/Snelweg/tankstation.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/tankstation.png"),
    },
  },
  {
    id: "tankwagen",
    name: "tankwagen",
    themes: ["snelweg","stad","platteland","vakantie","winter","bergen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"bergen":1,"voertuigen":4,"winter":2,"vakantie":3,"platteland":2,"stad":2,"snelweg":4},
    defaultIcon: require("../assets/images/Snelweg/tankwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/tankwagen.png"),
    },
  },
  {
    id: "tent",
    name: "tent",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/tent.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/tent.png"),
    },
  },
  {
    id: "terras",
    name: "terras",
    themes: ["stad","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"vakantie":3},
    defaultIcon: require("../assets/images/stad/terras.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/terras.png"),
    },
  },
  {
    id: "tolweg",
    name: "tolweg",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/tolweg.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/tolweg.png"),
    },
  },
  {
    id: "touringbus",
    name: "touringbus",
    themes: ["snelweg","stad","platteland","vakantie","winter","bergen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"voertuigen":4,"bergen":1,"winter":3,"vakantie":5,"platteland":1,"stad":2,"snelweg":5},
    defaultIcon: require("../assets/images/Snelweg/touringbus.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/touringbus.png"),
    },
  },
  {
    id: "tractor",
    name: "tractor",
    themes: ["platteland","voertuigen"],
    excludedThemes: [],
    weight: 5,
    themeWeights: {"platteland":5,"voertuigen":3},
    defaultIcon: require("../assets/images/Voertuigen/tractor.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Voertuigen/tractor.png"),
      voertuigen: require("../assets/images/Voertuigen/tractor.png"),
    },
  },
  {
    id: "tram",
    name: "tram",
    themes: ["stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"voertuigen":1},
    defaultIcon: require("../assets/images/stad/tram.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/tram.png"),
    },
  },
  {
    id: "trampoline",
    name: "trampoline",
    themes: ["stad","platteland","vakantie","bergen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"bergen":1,"vakantie":3,"platteland":3,"stad":4},
    defaultIcon: require("../assets/images/stad/trampoline.png"),
    iconsByTheme: {
    },
  },
  {
    id: "trein",
    name: "trein",
    themes: ["snelweg","voertuigen","vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"voertuigen":2,"snelweg":3,"vakantie":3},
    defaultIcon: require("../assets/images/Snelweg/trein.png"),
    generalIcon: require("../assets/images/Voertuigen/oranje-trein.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/trein.png"),
    },
  },
  {
    id: "tunnel",
    name: "tunnel",
    themes: ["snelweg","vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"snelweg":1,"vakantie":3,"bergen":4},
    defaultIcon: require("../assets/images/Snelweg/tunnel.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/tunnel.png"),
    },
  },
  {
    id: "vallende stenen bord",
    name: "vallende stenen bord",
    themes: ["bergen"],
    excludedThemes: [],
    weight: 4,
    themeWeights: {},
    defaultIcon: require("../assets/images/Bergen/vallende-stenen-bord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "vee rooster",
    name: "vee rooster",
    themes: ["platteland","bergen"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Platteland/vee-rooster.png"),
    iconsByTheme: {
    },
  },
  {
    id: "veerboot",
    name: "veerboot",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/veerboot.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/veerboot.png"),
    },
  },
  {
    id: "verboden aanhangwagen",
    name: "verboden aanhangwagen",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"verkeersborden":2,"stad":3},
    defaultIcon: require("../assets/images/Verkeersborden/verboden aanhangwagen.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/verboden aanhangwagen.png"),
    },
  },
  {
    id: "verboden auto",
    name: "verboden auto",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/verboden auto.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/verboden auto.png"),
    },
  },
  {
    id: "verboden auto en motor",
    name: "verboden auto en motor",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/verboden auto en motor.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/verboden auto en motor.png"),
    },
  },
  {
    id: "verboden bromfiets",
    name: "verboden bromfiets",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/verboden bromfiets.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/verboden bromfiets.png"),
    },
  },
  {
    id: "verboden motor",
    name: "verboden motor",
    themes: ["stad","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":2,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/verboden motor.png"),
    iconsByTheme: {
      verkeersborden: require("../assets/images/Verkeersborden/verboden motor.png"),
    },
  },
  {
    id: "verkeerskegel",
    name: "verkeerspion",
    themes: ["stad","vakantie"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"vakantie":1,"stad":2},
    defaultIcon: require("../assets/images/Verkeersborden/verkeerskegel.png"),
    iconsByTheme: {
    },
  },
  {
    id: "bolle spiegel",
    name: "verkeersspiegel",
    themes: ["stad","platteland","vakantie","bergen"],
    excludedThemes: ["snelweg","voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"stad":2,"platteland":2,"vakantie":3,"bergen":4},
    defaultIcon: require("../assets/images/Bergen/bolle-spiegel.png"),
    iconsByTheme: {
    },
  },
  {
    id: "victor veilig",
    name: "victor veilig",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4},
    defaultIcon: require("../assets/images/stad/victor veilig.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/victor veilig.png"),
    },
  },
  {
    id: "visser",
    name: "visser",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/visser.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/visser.png"),
    },
  },
  {
    id: "voorrang verlenen",
    name: "voorrang verlenen",
    themes: ["stad","platteland","vakantie","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5,"platteland":3,"vakantie":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/voorrang verlenen.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Verkeersborden/voorrang verlenen.png"),
      verkeersborden: require("../assets/images/Verkeersborden/voorrang verlenen.png"),
    },
  },
  {
    id: "voorrangsbord",
    name: "voorrangsbord",
    themes: ["stad","platteland","vakantie","verkeersborden"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":5,"platteland":4,"vakantie":3,"verkeersborden":3},
    defaultIcon: require("../assets/images/Verkeersborden/voorrangsbord.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Verkeersborden/voorrangsbord.png"),
      verkeersborden: require("../assets/images/Verkeersborden/voorrangsbord.png"),
    },
  },
  {
    id: "vrachtwagen",
    name: "vrachtwagen",
    themes: ["snelweg","stad","platteland","vakantie","winter","bergen","voertuigen"],
    excludedThemes: ["verkeersborden"],
    weight: 1,
    themeWeights: {"voertuigen":5,"bergen":2,"winter":2,"vakantie":4,"platteland":3,"stad":3,"snelweg":5},
    defaultIcon: require("../assets/images/Voertuigen/vrachtwagen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Voertuigen/vrachtwagen.png"),
      voertuigen: require("../assets/images/Voertuigen/vrachtwagen.png"),
    },
  },
  {
    id: "vuilniswagen",
    name: "vuilniswagen",
    themes: ["stad","voertuigen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"voertuigen":2},
    defaultIcon: require("../assets/images/Voertuigen/vuilniswagen.png"),
    iconsByTheme: {
      stad: require("../assets/images/Voertuigen/vuilniswagen.png"),
      voertuigen: require("../assets/images/Voertuigen/vuilniswagen.png"),
    },
  },
  {
    id: "vuurtoren",
    name: "vuurtoren",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/vuurtoren.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/vuurtoren.png"),
    },
  },
  {
    id: "wandelaars",
    name: "wandelaars",
    themes: ["bergen"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Bergen/wandelaars.png"),
    iconsByTheme: {
    },
  },
  {
    id: "waterval",
    name: "waterval",
    themes: ["vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"bergen":4,"vakantie":2},
    defaultIcon: require("../assets/images/Bergen/waterval.png"),
    iconsByTheme: {
      bergen: require("../assets/images/Bergen/waterval.png"),
    },
  },
  {
    id: "weg met groene lijn",
    name: "weg met groene lijn",
    themes: ["platteland"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":1},
    defaultIcon: require("../assets/images/Platteland/weg met groene lijn.png"),
    iconsByTheme: {
      platteland: require("../assets/images/Platteland/weg met groene lijn.png"),
    },
  },
  {
    id: "wegversmalling",
    name: "wegversmalling",
    themes: ["stad","platteland"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"stad":2,"platteland":2},
    defaultIcon: require("../assets/images/Verkeersborden/wegversmalling.png"),
    iconsByTheme: {
    },
  },
  {
    id: "wegversmalling bord",
    name: "wegversmalling bord",
    themes: ["stad","platteland","verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {"stad":2,"verkeersborden":1},
    defaultIcon: require("../assets/images/Verkeersborden/wegversmalling-bord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "werkzaamhedenbord",
    name: "werkzaamhedenbord",
    themes: ["verkeersborden"],
    excludedThemes: [],
    weight: 3,
    themeWeights: {},
    defaultIcon: require("../assets/images/Verkeersborden/werkzaamhedenbord.png"),
    iconsByTheme: {
    },
  },
  {
    id: "wielrenner",
    name: "wielrenner",
    themes: ["platteland","vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"platteland":2,"vakantie":4,"bergen":2},
    defaultIcon: require("../assets/images/Vakantie/wielrenner.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/wielrenner.png"),
    },
  },
  {
    id: "wijngaard",
    name: "wijngaard",
    themes: ["vakantie","bergen"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":4,"bergen":2},
    defaultIcon: require("../assets/images/Vakantie/wijngaard.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/wijngaard.png"),
    },
  },
  {
    id: "windmolen",
    name: "windmolen",
    themes: ["snelweg","platteland","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":4,"platteland":2,"snelweg":4},
    defaultIcon: require("../assets/images/Snelweg/windmolen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/windmolen.png"),
    },
  },
  {
    id: "windzak",
    name: "windzak",
    themes: ["snelweg","vakantie"],
    excludedThemes: [],
    weight: 2,
    themeWeights: {},
    defaultIcon: require("../assets/images/Snelweg/windzak.png"),
    iconsByTheme: {
    },
  },
  {
    id: "winkel",
    name: "winkel",
    themes: ["stad","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4,"vakantie":3},
    defaultIcon: require("../assets/images/stad/winkel.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/winkel.png"),
    },
  },
  {
    id: "winkelwagen",
    name: "winkelwagen",
    themes: ["stad","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":3,"vakantie":2},
    defaultIcon: require("../assets/images/stad/winkelwagen.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/winkelwagen.png"),
    },
  },
  {
    id: "zandkasteel",
    name: "zandkasteel",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":1},
    defaultIcon: require("../assets/images/Vakantie/zandkasteel.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/zandkasteel.png"),
    },
  },
  {
    id: "zebrapad",
    name: "zebrapad",
    themes: ["stad"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"stad":4},
    defaultIcon: require("../assets/images/stad/zebrapad.png"),
    iconsByTheme: {
      stad: require("../assets/images/stad/zebrapad.png"),
    },
  },
  {
    id: "blauwe zeecontainer",
    name: "zeecontainer",
    themes: ["snelweg","stad","platteland","vakantie","winter","bergen"],
    excludedThemes: ["voertuigen","verkeersborden"],
    weight: 1,
    themeWeights: {"winter":2,"bergen":2,"vakantie":3,"platteland":2,"stad":3,"snelweg":4},
    defaultIcon: require("../assets/images/Snelweg/blauwe-zeecontainer.png"),
    iconsByTheme: {
    },
  },
  {
    id: "zielboot",
    name: "zeillboot",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/zielboot.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/zielboot.png"),
    },
  },
  {
    id: "zendmast",
    name: "zendmast",
    themes: ["algemeen"],
    excludedThemes: ["voertuigen","verkeersborden"],
    weight: 4,
    themeWeights: {},
    defaultIcon: require("../assets/images/Snelweg/zendmast.png"),
    iconsByTheme: {
    },
  },
  {
    id: "zonnepanelen",
    name: "zonnepanelen",
    themes: ["snelweg","platteland","vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2,"platteland":3,"snelweg":4},
    defaultIcon: require("../assets/images/Snelweg/zonnepanelen.png"),
    iconsByTheme: {
      snelweg: require("../assets/images/Snelweg/zonnepanelen.png"),
    },
  },
  {
    id: "zwembad",
    name: "zwembad",
    themes: ["vakantie"],
    excludedThemes: [],
    weight: 1,
    themeWeights: {"vakantie":2},
    defaultIcon: require("../assets/images/Vakantie/zwembad.png"),
    iconsByTheme: {
      vakantie: require("../assets/images/Vakantie/zwembad.png"),
    },
  },
];

const GENERAL_THEME_ID = 'algemeen';
const THEME_SPECIFIC_RATIO = 0.6;
const DEFAULT_DIFFICULTY_MIX = { easy: 9, medium: 5, hard: 2 };
const BOARD_4X4_BLOCKER_POSITIONS = [10, 12, 7, 1, 4, 13, 15];
const MIX_LIMITS_BY_THEME = {
  default: { verkeersborden: 3, voertuigen: 4 },
  verkeersborden: { voertuigen: 4 },
  voertuigen: { verkeersborden: 3 },
};
const NETHERLANDS_SPECIFIC_ITEM_IDS = new Set([
  "adviessnelheid 60",
  "ambulance",
  "afvalbak groen",
  "brandweerauto",
  "brievenbus",
  "fietspad",
  "fietspaddestoel",
  "hectometerpaal",
  "molen",
  "nederlandse vlag",
  "politie auto",
  "politie motorrijder",
  "politieagent",
  "sloot",
  "trein",
  "victor veilig",
  "weg met groene lijn",
]);

function isItemExplicitlyInTheme(item, theme) {
  return item.themes.includes(theme);
}

function isItemAvailableForTheme(item, theme) {
  if (theme === GENERAL_THEME_ID) {
    return isItemExplicitlyInTheme(item, GENERAL_THEME_ID);
  }

  if (item.excludedThemes.includes(theme)) {
    return false;
  }

  return isItemExplicitlyInTheme(item, theme) || isItemExplicitlyInTheme(item, GENERAL_THEME_ID);
}

function getIconForTheme(item, theme, options = {}) {
  if (options.nederlands === false && item.generalIcon) {
    return item.generalIcon;
  }

  return item.iconsByTheme[theme] ?? item.defaultIcon;
}

function includeItemForOptions(item, options = {}) {
  return options.nederlands !== false || !NETHERLANDS_SPECIFIC_ITEM_IDS.has(item.id) || Boolean(item.generalIcon);
}

export function getThemeItems(theme, options = {}) {
  const resolvedTheme = theme || 'snelweg';
  const directItems = ITEM_CATALOG.filter((item) => (
    isItemAvailableForTheme(item, resolvedTheme) && includeItemForOptions(item, options)
  ));

  if (directItems.length > 0) {
    return directItems;
  }

  return ITEM_CATALOG.filter((item) => (
    isItemAvailableForTheme(item, 'snelweg') && includeItemForOptions(item, options)
  ));
}

export function getThemeIcons(theme, options = {}) {
  const resolvedTheme = theme || 'snelweg';
  return getThemeItems(resolvedTheme, options).map((item) => getIconForTheme(item, resolvedTheme, options));
}

function createSeededRandom(seed = 0) {
  let state = seed >>> 0;

  return function seededRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithSeed(items, seed) {
  const next = [...items];
  const random = createSeededRandom(seed);

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function getRecentItemPenalty(item, options = {}) {
  const recentItemIds = Array.isArray(options.recentItemIds) ? options.recentItemIds : [];
  const recentIndex = recentItemIds.indexOf(item.id);

  if (recentIndex < 0) {
    return 1;
  }

  return recentIndex < 16 ? 0.32 : 0.58;
}

function getThemeSelectionWeight(item, theme) {
  return item.themeWeights[theme] ?? item.weight;
}

function getItemSelectionWeight(item, theme, options = {}) {
  return Math.max(0.05, (getThemeSelectionWeight(item, theme) / 3) * getRecentItemPenalty(item, options));
}

function getDifficultyBucket(item, theme) {
  const weight = getThemeSelectionWeight(item, theme);

  if (weight >= 4) {
    return 'easy';
  }

  if (weight <= 2) {
    return 'hard';
  }

  return 'medium';
}

function getDifficultyTargets(count) {
  if (count === 16) {
    return { ...DEFAULT_DIFFICULTY_MIX };
  }

  if (count <= 3) {
    return { easy: count, medium: 0, hard: 0 };
  }

  const hard = Math.max(1, Math.round(count * 0.125));
  const easy = Math.max(1, Math.round(count * 0.56));
  return { easy, medium: Math.max(0, count - easy - hard), hard };
}

function splitByDifficulty(items, theme) {
  return items.reduce((groups, item) => {
    groups[getDifficultyBucket(item, theme)].push(item);
    return groups;
  }, { easy: [], medium: [], hard: [] });
}

function weightedShuffleWithSeed(items, seed, theme, options = {}) {
  const random = createSeededRandom(seed);

  return [...items]
    .map((item) => ({
      item,
      rank: Math.log(Math.max(random(), 0.0000001)) / getItemSelectionWeight(item, theme, options),
    }))
    .sort((left, right) => {
      const rankDifference = right.rank - left.rank;
      if (rankDifference !== 0) {
        return rankDifference;
      }

      return left.item.id.localeCompare(right.item.id);
    })
    .map((entry) => entry.item);
}

function getBucketSeedOffset(bucket) {
  return bucket === 'easy' ? 17 : bucket === 'medium' ? 31 : 47;
}

function appendBucketItems(target, candidates, desiredCount, theme, seed, options = {}) {
  if (desiredCount <= 0) {
    return target;
  }

  const shuffledThemeItems = weightedShuffleWithSeed(
    candidates.filter((item) => isItemExplicitlyInTheme(item, theme)),
    seed,
    theme,
    options
  );
  const shuffledGeneralItems = weightedShuffleWithSeed(
    candidates.filter((item) => (
      isItemExplicitlyInTheme(item, GENERAL_THEME_ID) && !isItemExplicitlyInTheme(item, theme)
    )),
    seed + 101,
    theme,
    options
  );
  const shuffledFallbackItems = weightedShuffleWithSeed(candidates, seed + 202, theme, options);
  const targetLength = target.length + desiredCount;
  const themeTargetLength = target.length + Math.ceil(desiredCount * THEME_SPECIFIC_RATIO);

  appendBalancedUniqueItems(target, shuffledThemeItems, themeTargetLength, theme);
  appendBalancedUniqueItems(target, shuffledGeneralItems, targetLength, theme);
  appendBalancedUniqueItems(target, shuffledThemeItems, targetLength, theme);
  appendBalancedUniqueItems(target, shuffledFallbackItems, targetLength, theme);

  return target;
}

function selectBalancedItemsByDifficulty(availableItems, theme, count, seed, options = {}) {
  const targets = getDifficultyTargets(count);
  const groups = splitByDifficulty(availableItems, theme);
  const selectedItems = [];

  for (const bucket of ['easy', 'medium', 'hard']) {
    appendBucketItems(
      selectedItems,
      groups[bucket],
      targets[bucket],
      theme,
      seed + getBucketSeedOffset(bucket),
      options
    );
  }

  if (selectedItems.length < count) {
    appendBalancedUniqueItems(
      selectedItems,
      weightedShuffleWithSeed(availableItems, seed + 303, theme, options),
      count,
      theme
    );
  }

  if (selectedItems.length < count) {
    appendUniqueItems(
      selectedItems,
      weightedShuffleWithSeed(availableItems, seed + 404, theme, options),
      count
    );
  }

  return selectedItems.slice(0, count);
}

function arrangeItemsForBoard(selectedItems, theme, seed) {
  if (selectedItems.length !== 16) {
    return shuffleWithSeed(selectedItems, seed + 505);
  }

  const hardItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === 'hard');
  const mediumItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === 'medium');
  const easyItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === 'easy');
  const blockers = shuffleWithSeed([...hardItems, ...mediumItems], seed + 606);
  const easyQueue = shuffleWithSeed(easyItems, seed + 707);
  const board = Array(16).fill(null);

  for (let index = 0; index < BOARD_4X4_BLOCKER_POSITIONS.length && blockers.length > 0; index += 1) {
    board[BOARD_4X4_BLOCKER_POSITIONS[index]] = blockers.shift();
  }

  for (let index = 0; index < board.length; index += 1) {
    if (!board[index]) {
      board[index] = easyQueue.shift() ?? blockers.shift() ?? null;
    }
  }

  return board.filter(Boolean);
}

function appendUniqueItems(target, candidates, limit) {
  const usedIds = new Set(target.map((item) => item.id));

  for (const item of candidates) {
    if (target.length >= limit) {
      break;
    }

    if (!usedIds.has(item.id)) {
      target.push(item);
      usedIds.add(item.id);
    }
  }

  return target;
}

function getMixCategory(item, theme) {
  if (theme !== 'verkeersborden' && item.themes.includes('verkeersborden')) {
    return 'verkeersborden';
  }

  if (theme !== 'voertuigen' && item.themes.includes('voertuigen')) {
    return 'voertuigen';
  }

  return 'basis';
}

function getMixLimits(theme) {
  return MIX_LIMITS_BY_THEME[theme] ?? MIX_LIMITS_BY_THEME.default;
}

function createMixCounts(items, theme) {
  return items.reduce((counts, item) => {
    const category = getMixCategory(item, theme);
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
}

function canAppendForMix(item, theme, counts, limits) {
  const category = getMixCategory(item, theme);
  const limit = limits[category];
  return typeof limit !== 'number' || (counts[category] ?? 0) < limit;
}

function appendBalancedUniqueItems(target, candidates, limit, theme) {
  const usedIds = new Set(target.map((item) => item.id));
  const limits = getMixLimits(theme);
  const counts = createMixCounts(target, theme);

  for (const item of candidates) {
    if (target.length >= limit) {
      break;
    }

    if (usedIds.has(item.id) || !canAppendForMix(item, theme, counts, limits)) {
      continue;
    }

    const category = getMixCategory(item, theme);
    target.push(item);
    usedIds.add(item.id);
    counts[category] = (counts[category] ?? 0) + 1;
  }

  return target;
}

export function getRandomItems(theme, count = 16, seed = 0, options = {}) {
  const resolvedTheme = theme || 'snelweg';
  const availableItems = getThemeItems(resolvedTheme, options);

  if (availableItems.length === 0) {
    return [];
  }

  const selectedItems = selectBalancedItemsByDifficulty(availableItems, resolvedTheme, count, seed, options);
  const arrangedItems = arrangeItemsForBoard(selectedItems, resolvedTheme, seed);

  return arrangedItems.slice(0, count).map((item) => ({
    id: item.id,
    icon: getIconForTheme(item, resolvedTheme, options),
  }));
}

export function getRandomIcons(theme, count = 16, seed = 0, options = {}) {
  return getRandomItems(theme, count, seed, options).map((item) => item.icon);
}
