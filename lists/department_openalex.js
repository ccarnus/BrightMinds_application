const departments = [
    {
      id: "https://openalex.org/fields/27",
      display: "Medicine",
      name: "Medicine" // matches: MedicineandHealthSciences, Pediatrics
    },
    {
      id: "https://openalex.org/fields/33",
      display: "Social Sciences", 
      name: "SocialSciences", 
      // matches: Economics, Education, PoliticalScience, Psychology, Sociology
    },
    {
      id: "https://openalex.org/fields/22",
      display: "Engineering",
      name: "Engineering",
      // matches: Engineering
    },
    {
      id: "https://openalex.org/fields/12",
      display: "Arts and Humanities",
      name: "ArtsandHumanities",
      // matches: Archaeology, Art, Literature, Philosophy
    },
    {
      id: "https://openalex.org/fields/17",
      display: "Computer Science",
      name: "ComputerScience",
      // matches: ComputerScience
    },
    {
      id: "https://openalex.org/fields/13",
      display: "Biochemistry, Genetics and Molecular Biology",
      name:"Biochemistry,GeneticsandMolecularBiology",
      // matches: Genetics, Biology
    },
    {
      id: "https://openalex.org/fields/11",
      display: "Agricultural and Biological Sciences",
      name: "AgriculturalandBiologicalSciences",
      // matches: Agriculture, Biology
    },
    {
      id: "https://openalex.org/fields/23",
      display: "Environmental Science",
      name: "EnvironmentalScience",
      // matches: EnvironmentalScience, EarthSciences, Meteorology, Oceanography
    },
    {
      id: "https://openalex.org/fields/25",
      display: "Materials Science",
      name: "MaterialsScience",
      // matches: Materials
    },
    {
      id: "https://openalex.org/fields/31",
      display: "Physics and Astronomy",
      name: "PhysicsandAstronomy",
      // matches: Physics, Astronomy
    },
    {
      id: "https://openalex.org/fields/14",
      display: "Business, Management and Accounting",
      name: "Business,ManagementandAccounting",
      // matches: (no direct match from current departments; Economics is loosely related)
    },
    {
      id: "https://openalex.org/fields/36",
      display: "Health Professions",
      name: "HealthProfessions",
      // matches: MedicineandHealthSciences, Pediatrics, (possibly Nutrition)
    },
    {
      id: "https://openalex.org/fields/20",
      display: "Economics, Econometrics and Finance",
      name: "Economics,EconometricsandFinance",
      // matches: Economics
    },
    {
      id: "https://openalex.org/fields/32",
      display: "Psychology",
      name: "Psychology",
      // matches: Psychology
    },
    {
      id: "https://openalex.org/fields/16",
      display: "Chemistry",
      name: "Chemistry",
      // matches: Chemistry
    },
    {
      id: "https://openalex.org/fields/19",
      display: "Earth and Planetary Sciences",
      name: "EarthandPlanetarySciences",
      // matches: EarthSciences, Meteorology, Oceanography, SpaceExploration
    },
    {
      id: "https://openalex.org/fields/28",
      display: "Neuroscience",
      name: "Neuroscience",
      // matches: Neuroscience
    },
    {
      id: "https://openalex.org/fields/26",
      display: "Mathematics",
      name: "Mathematics",
      // matches: Mathematics
    },
    {
      id: "https://openalex.org/fields/24",
      display_name: "Immunology and Microbiology",
      // matches: Biology (by proxy)
    },
    {
      id: "https://openalex.org/fields/18",
      display_name: "Decision Sciences",
      // matches: Mathematics (or Economics/ComputerScience could also be considered)
    },
    {
      id: "https://openalex.org/fields/21",
      display: "Energy",
      name: "Energy",
      // matches: (no clear match in the current department list)
    },
    {
      id: "https://openalex.org/fields/29",
      display: "Nursing",
      name: "Nursing",
      // matches: (no matching department)
    },
    {
      id: "https://openalex.org/fields/30",
      display_name: "Pharmacology, Toxicology and Pharmaceutics",
      // matches: (no matching department)
    },
    {
      id: "https://openalex.org/fields/35",
      display: "Dentistry",
      name: "Dentistry",
      // matches: (no matching department)
    },
    {
      id: "https://openalex.org/fields/15",
      display: "Chemical Engineering",
      name: "ChemicalEngineering",
      // matches: (no direct match; could be related to Engineering but not distinct in your list)
    },
    {
      id: "https://openalex.org/fields/34",
      display: "Veterinary",
      name: "Veterinary",
      // matches: (no matching department)
    }
  ];

module.exports = departments;
