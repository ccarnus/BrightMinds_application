const departments = [
  {
    id: "https://openalex.org/fields/27",
    display: "Medicine",
    name: "Medicine", // matches: MedicineandHealthSciences, Pediatrics
    description:
      "Medicine focuses on the diagnosis, treatment, and prevention of diseases, promoting overall health and wellness.",
    image: require('../assets/Virtual_labs/Medicine.png')
  },
  {
    id: "https://openalex.org/fields/33",
    display: "Social Sciences",
    name: "SocialSciences", // matches: Economics, Education, PoliticalScience, Psychology, Sociology
    description:
      "Social Sciences study human society and social relationships, covering topics like culture, politics, economics, and behavior.",
    image: require('../assets/Virtual_labs/SocialSciences.png')
  },
  {
    id: "https://openalex.org/fields/22",
    display: "Engineering",
    name: "Engineering", // matches: Engineering
    description:
      "Engineering applies scientific and mathematical principles to design, build, and improve technology and infrastructure.",
    image: require('../assets/Virtual_labs/Engineering.png')
  },
  {
    id: "https://openalex.org/fields/12",
    display: "Arts and Humanities",
    name: "ArtsandHumanities", // matches: Archaeology, Art, Literature, Philosophy
    description:
      "Arts and Humanities explore creative expression, culture, and human thought through disciplines like art, literature, history, and philosophy.",
    image: require('../assets/Virtual_labs/ArtsandHumanities.png')
  },
  {
    id: "https://openalex.org/fields/17",
    display: "Computer Science",
    name: "ComputerScience", // matches: ComputerScience
    description:
      "Computer Science advances the theory and application of computing, covering topics like algorithms, programming, and data structures.",
    image: require('../assets/Virtual_labs/ComputerScience.png')
  },
  {
    id: "https://openalex.org/fields/13",
    display: "Biochemistry, Genetics and Molecular Biology",
    name: "BiochemistryGeneticsandMolecularBiology", // matches: Genetics, Biology
    description:
      "This field studies the chemical processes within living organisms, focusing on genetic mechanisms and molecular interactions.",
    image: require('../assets/Virtual_labs/BiochemistryGeneticsandMolecularBiology.png')
  },
  {
    id: "https://openalex.org/fields/11",
    display: "Agricultural and Biological Sciences",
    name: "AgriculturalandBiologicalSciences", // matches: Agriculture, Biology
    description:
      "This field integrates agricultural practices and biological research to improve food production and promote sustainable farming.",
    image: require('../assets/Virtual_labs/AgriculturalandBiologicalSciences.png')
  },
  {
    id: "https://openalex.org/fields/23",
    display: "Environmental Science",
    name: "EnvironmentalScience", // matches: EnvironmentalScience, EarthSciences, Meteorology, Oceanography
    description:
      "Environmental Science examines the interactions between humans and the environment, addressing issues like pollution, climate change, and conservation.",
    image: require('../assets/Virtual_labs/EnvironmentalScience.png')
  },
  {
    id: "https://openalex.org/fields/25",
    display: "Materials Science",
    name: "MaterialsScience", // matches: Materials
    description:
      "Materials Science investigates the properties and applications of materials, driving innovations across industries such as electronics, aerospace, and biotechnology.",
    image: require('../assets/Virtual_labs/MaterialsScience.png')
  },
  {
    id: "https://openalex.org/fields/31",
    display: "Physics and Astronomy",
    name: "PhysicsandAstronomy", // matches: Physics, Astronomy
    description:
      "This field explores the fundamental principles of matter, energy, and the universe, from subatomic particles to cosmic structures.",
    image: require('../assets/Virtual_labs/PhysicsandAstronomy.png')
  },
  {
    id: "https://openalex.org/fields/14",
    display: "Business, Management and Accounting",
    name: "BusinessManagementandAccounting", // matches: (no direct match from current departments; Economics is loosely related)
    description:
      "This field studies economic systems, organizational behavior, and financial management to optimize business operations and decision-making.",
    image: require('../assets/Virtual_labs/BusinessManagementandAccounting.png')
  },
  {
    id: "https://openalex.org/fields/36",
    display: "Health Professions",
    name: "HealthProfessions", // matches: MedicineandHealthSciences, Pediatrics, (possibly Nutrition)
    description:
      "Health Professions encompass various disciplines dedicated to promoting health, delivering care, and advancing medical practice.",
    image: require('../assets/Virtual_labs/HealthProfessions.png')
  },
  {
    id: "https://openalex.org/fields/20",
    display: "Economics, Econometrics and Finance",
    name: "EconomicsEconometricsandFinance", // matches: Economics
    description:
      "This field analyzes the production, distribution, and consumption of resources, combining theory and quantitative methods to understand markets.",
    image: require('../assets/Virtual_labs/EconomicsEconometricsandFinance.png')
  },
  {
    id: "https://openalex.org/fields/32",
    display: "Psychology",
    name: "Psychology", // matches: Psychology
    description:
      "Psychology studies the human mind and behavior, exploring cognitive processes, emotions, and social interactions.",
    image: require('../assets/Virtual_labs/Psychology.png')
  },
  {
    id: "https://openalex.org/fields/16",
    display: "Chemistry",
    name: "Chemistry", // matches: Chemistry
    description:
      "Chemistry examines the composition, structure, and properties of matter, contributing to advancements in science and various industries.",
    image: require('../assets/Virtual_labs/Chemistry.png')
  },
  {
    id: "https://openalex.org/fields/19",
    display: "Earth and Planetary Sciences",
    name: "EarthandPlanetarySciences", // matches: EarthSciences, Meteorology, Oceanography, SpaceExploration
    description:
      "This field investigates the Earth and other celestial bodies, studying geological, atmospheric, and planetary processes.",
    image: require('../assets/Virtual_labs/EarthandPlanetarySciences.png')
  },
  {
    id: "https://openalex.org/fields/28",
    display: "Neuroscience",
    name: "Neuroscience", // matches: Neuroscience
    description:
      "Neuroscience explores the structure and function of the nervous system, focusing on brain function, cognition, and neurological disorders.",
    image: require('../assets/Virtual_labs/Neuroscience.png')
  },
  {
    id: "https://openalex.org/fields/26",
    display: "Mathematics",
    name: "Mathematics", // matches: Mathematics
    description:
      "Mathematics deals with abstract concepts, numbers, and patterns, providing foundational tools for science, engineering, and technology.",
    image: require('../assets/Virtual_labs/Mathematics.png')
  },
  {
    id: "https://openalex.org/fields/24",
    display: "Immunology and Microbiology",
    name: "ImmunologyandMicrobiology", // matches: Biology (by proxy)
    description:
      "This field studies the immune system and microorganisms, enhancing our understanding of infections, diseases, and health interventions.",
    image: require('../assets/Virtual_labs/ImmunologyandMicrobiology.png')
  },
  {
    id: "https://openalex.org/fields/18",
    display: "Decision Sciences",
    name: "DecisionSciences", // matches: Mathematics (or Economics/ComputerScience could also be considered)
    description:
      "Decision Sciences apply analytical and quantitative methods to support complex decision-making processes in various fields.",
    image: require('../assets/Virtual_labs/DecisionSciences.png')
  },
  {
    id: "https://openalex.org/fields/21",
    display: "Energy",
    name: "Energy", // matches: (no clear match in the current department list)
    description:
      "Energy research focuses on the production, conversion, and efficient use of energy resources, addressing sustainability and innovation challenges.",
    image: require('../assets/Virtual_labs/Energy.png')
  },
  {
    id: "https://openalex.org/fields/29",
    display: "Nursing",
    name: "Nursing", // matches: (no matching department)
    description:
      "Nursing is dedicated to patient care, health education, and improving healthcare services through clinical practice and research.",
    image: require('../assets/Virtual_labs/Nursing.png')
  },
  {
    id: "https://openalex.org/fields/30",
    display: "Pharmacology, Toxicology and Pharmaceutics",
    name: "PharmacologyToxicologyandPharmaceutics", // matches: (no matching department)
    description:
      "This field examines the effects and applications of drugs and chemical substances, focusing on therapeutic use, toxicity, and safe pharmaceutics.",
    image: require('../assets/Virtual_labs/PharmacologyToxicologyandPharmaceutics.png')
  },
  {
    id: "https://openalex.org/fields/35",
    display: "Dentistry",
    name: "Dentistry", // matches: (no matching department)
    description:
      "Dentistry focuses on the diagnosis, prevention, and treatment of oral health issues, ensuring the maintenance of dental and gum health.",
    image: require('../assets/Virtual_labs/Dentistry.png')
  },
  {
    id: "https://openalex.org/fields/15",
    display: "Chemical Engineering",
    name: "ChemicalEngineering", // matches: (no direct match; could be related to Engineering but not distinct in your list)
    description:
      "Chemical Engineering applies chemical principles to design processes that convert raw materials into valuable products, integrating both engineering and chemistry.",
    image: require('../assets/Virtual_labs/ChemicalEngineering.png')
  },
  {
    id: "https://openalex.org/fields/34",
    display: "Veterinary",
    name: "Veterinary", // matches: (no matching department)
    description:
      "Veterinary science is dedicated to the health and treatment of animals, encompassing clinical care, research, and public health initiatives.",
    image: require('../assets/Virtual_labs/Veterinary.png')
  }
];

module.exports = departments;