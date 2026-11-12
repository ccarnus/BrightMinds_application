// The lab map is a fixed place: every department keeps its spot, grouped in four regions, so users
// build a mental map. Positions are in map units (about one lab per unit); sizes come from the API.
export const REGIONS = ['science', 'life', 'health', 'society'];

const LABS = [
  // Science, engineering and computing
  { name: 'Mathematics', short: 'Mathematics', region: 'science', x: 1.0, y: 0.6 },
  { name: 'ComputerScience', short: 'Computer Science', region: 'science', x: 2.3, y: 0.1 },
  { name: 'DecisionSciences', short: 'Decision Sciences', region: 'science', x: 3.6, y: 0.7 },
  { name: 'PhysicsandAstronomy', short: 'Physics', region: 'science', x: 2.4, y: 1.4 },
  { name: 'Chemistry', short: 'Chemistry', region: 'science', x: 0.5, y: 1.8 },
  { name: 'ChemicalEngineering', short: 'Chemical Eng.', region: 'science', x: 1.4, y: 2.5 },
  { name: 'MaterialsScience', short: 'Materials', region: 'science', x: 3.6, y: 2.1 },
  { name: 'Engineering', short: 'Engineering', region: 'science', x: 4.9, y: 1.2 },
  { name: 'Energy', short: 'Energy', region: 'science', x: 2.9, y: 3.0 },
  { name: 'EarthandPlanetarySciences', short: 'Earth Sciences', region: 'science', x: 5.0, y: 2.6 },
  // Life and environment
  { name: 'AgriculturalandBiologicalSciences', short: 'Agriculture', region: 'life', x: 1.0, y: 4.2 },
  { name: 'EnvironmentalScience', short: 'Environment', region: 'life', x: 2.4, y: 4.0 },
  {
    name: 'BiochemistryGeneticsandMolecularBiology',
    short: 'Biochemistry',
    region: 'life',
    x: 0.1,
    y: 5.4,
  },
  { name: 'ImmunologyandMicrobiology', short: 'Immunology', region: 'life', x: 1.4, y: 5.5 },
  { name: 'Neuroscience', short: 'Neuroscience', region: 'life', x: 2.7, y: 5.2 },
  // Health
  { name: 'Medicine', short: 'Medicine', region: 'health', x: 4.3, y: 4.1 },
  { name: 'Nursing', short: 'Nursing', region: 'health', x: 5.5, y: 3.7 },
  { name: 'HealthProfessions', short: 'Health Professions', region: 'health', x: 5.5, y: 5.0 },
  {
    name: 'PharmacologyToxicologyandPharmaceutics',
    short: 'Pharmacology',
    region: 'health',
    x: 4.0,
    y: 5.4,
  },
  { name: 'Dentistry', short: 'Dentistry', region: 'health', x: 4.8, y: 6.2 },
  { name: 'Veterinary', short: 'Veterinary', region: 'health', x: 3.1, y: 6.4 },
  // Society, mind and business
  { name: 'SocialSciences', short: 'Social Sciences', region: 'society', x: 1.0, y: 7.4 },
  { name: 'Psychology', short: 'Psychology', region: 'society', x: 2.4, y: 7.7 },
  { name: 'ArtsandHumanities', short: 'Arts & Humanities', region: 'society', x: 3.8, y: 7.7 },
  { name: 'BusinessManagementandAccounting', short: 'Business', region: 'society', x: 0.2, y: 8.6 },
  {
    name: 'EconomicsEconometricsandFinance',
    short: 'Economics',
    region: 'society',
    x: 1.7,
    y: 8.9,
  },
];

export default LABS;
