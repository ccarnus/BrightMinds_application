const departments = [
  { 
    display: 'Agriculture', 
    name: 'Agriculture',
    description: 'Agriculture research focuses on improving farming techniques, enhancing crop yields, and developing sustainable practices to ensure food security for the growing global population.'
  },
  { 
    display: 'Artificial Intelligence', 
    name: 'ArtificialIntelligence',
    description: 'Artificial Intelligence explores the development of intelligent machines that can perform tasks typically requiring human intelligence, such as learning, reasoning, and problem-solving.'
  },
  { 
    display: 'Space Exploration', 
    name: 'SpaceExploration',
    description: 'Space Exploration delves into the study of outer space, aiming to understand celestial bodies, develop advanced spacecraft, and explore the possibilities of human habitation beyond Earth.'
  },
  { 
    display: 'Archaeology', 
    name: 'Archaeology',
    description: 'Archaeology uncovers the mysteries of past civilizations by excavating artifacts, analyzing historical sites, and piecing together the stories of human history.'
  },
  { 
    display: 'Art', 
    name: 'Art',
    description: 'Art research fosters creativity and innovation, exploring various mediums and techniques to express human experiences, emotions, and cultural narratives.'
  },
  { 
    display: 'Astronomy', 
    name: 'Astronomy',
    description: 'Astronomy studies celestial objects and phenomena, seeking to understand the universe’s origin, structure, and evolution through observation and theoretical models.'
  },
  { 
    display: 'Chemistry', 
    name: 'Chemistry',
    description: 'Chemistry investigates the properties, composition, and transformations of matter, contributing to advancements in medicine, materials science, and environmental sustainability.'
  },
  { 
    display: 'Computer Science', 
    name: 'ComputerScience',
    description: 'Computer Science advances the understanding of computational systems, developing software, algorithms, and technologies that drive modern innovation and digital transformation.'
  },
  { 
    display: 'Cultural Studies', 
    name: 'CulturalStudies',
    description: 'Cultural Studies examines societal norms, values, and practices, exploring the interplay between culture, identity, and power within diverse communities.'
  },
  { 
    display: 'Economics', 
    name: 'Economics',
    description: 'Economics analyzes the production, distribution, and consumption of goods and services, providing insights into market behaviors and policy-making for economic growth.'
  },
  { 
    display: 'Education', 
    name: 'Education',
    description: 'Education research seeks to enhance teaching methodologies, learning experiences, and educational policies to foster effective knowledge dissemination and lifelong learning.'
  },
  { 
    display: 'Engineering', 
    name: 'Engineering',
    description: 'Engineering applies scientific principles to design, build, and innovate structures, systems, and technologies that solve real-world problems and improve quality of life.'
  },
  { 
    display: 'Environmental Science', 
    name: 'EnvironmentalScience',
    description: 'Environmental Science studies the interactions between humans and the environment, aiming to address challenges like climate change, pollution, and conservation through sustainable solutions.'
  },
  { 
    display: 'Genetics', 
    name: 'Genetics',
    description: 'Genetics explores the blueprint of life, investigating genes and heredity to understand biological diversity, disease mechanisms, and potential genetic therapies.'
  },
  { 
    display: 'History', 
    name: 'History',
    description: 'History research delves into past events, cultures, and societies, providing valuable lessons and perspectives that shape our understanding of the present and future.'
  },
  { 
    display: 'Law', 
    name: 'Law',
    description: 'Law studies the system of rules that govern societies, analyzing legal frameworks, rights, and justice to promote equitable and orderly conduct within communities.'
  },
  { 
    display: 'Linguistics', 
    name: 'Linguistics',
    description: 'Linguistics investigates language structure, development, and usage, uncovering the complexities of human communication and its role in culture and cognition.'
  },
  { 
    display: 'Literature', 
    name: 'Literature',
    description: 'Literature research explores written works, analyzing narratives, themes, and literary techniques to understand human expression and societal reflections through storytelling.'
  },
  { 
    display: 'Materials', 
    name: 'Materials',
    description: 'Materials Science focuses on the properties and applications of materials, driving innovation in industries like electronics, aerospace, and biotechnology through advanced material development.'
  },
  { 
    display: 'Mathematics', 
    name: 'Mathematics',
    description: 'Mathematics delves into abstract concepts and logical reasoning, providing the foundational tools for advancements in science, technology, engineering, and various analytical disciplines.'
  },
  { 
    display: 'Medicine and Health Sciences', 
    name: 'MedicineandHealthSciences',
    description: 'Medicine and Health Sciences research aims to improve human health through the study of diseases, medical treatments, public health strategies, and the development of innovative healthcare technologies.'
  },
  { 
    display: 'Meteorology', 
    name: 'Meteorology',
    description: 'Meteorology examines atmospheric phenomena, weather patterns, and climate systems to enhance weather forecasting, understand climate change, and mitigate natural disasters.'
  },
  { 
    display: 'Biology', 
    name: 'Biology',
    description: 'Biology studies living organisms, their structures, functions, growth, and interactions, contributing to advancements in medicine, ecology, and biotechnology.'
  },
  { 
    display: 'Nano Technology', 
    name: 'NanoTechnology',
    description: 'Nano Technology manipulates matter at the atomic and molecular scale, creating materials and devices with unique properties for applications in medicine, electronics, and energy.'
  },
  { 
    display: 'Neuroscience', 
    name: 'Neuroscience',
    description: 'Neuroscience explores the nervous system and brain, seeking to understand neural mechanisms, cognitive functions, and the basis of neurological disorders to advance mental health and cognitive sciences.'
  },
  { 
    display: 'Nutrition', 
    name: 'Nutrition',
    description: 'Nutrition research investigates the relationship between diet, health, and disease, aiming to develop guidelines and interventions that promote optimal health and prevent nutritional deficiencies.'
  },
  { 
    display: 'Oceanography', 
    name: 'Oceanography',
    description: 'Oceanography studies the physical, chemical, and biological aspects of the ocean, contributing to our understanding of marine ecosystems, climate regulation, and sustainable ocean resource management.'
  },
  { 
    display: 'Paleontology', 
    name: 'Paleontology',
    description: 'Paleontology uncovers the history of life on Earth by studying fossils, providing insights into evolution, ancient ecosystems, and the dynamic changes that have shaped current biodiversity.'
  },
  { 
    display: 'Pediatrics', 
    name: 'Pediatrics',
    description: 'Pediatrics focuses on the medical care of infants, children, and adolescents, addressing their unique health needs, developmental milestones, and preventive healthcare to ensure their well-being.'
  },
  { 
    display: 'Philosophy', 
    name: 'Philosophy',
    description: 'Philosophy explores fundamental questions about existence, knowledge, ethics, and reason, fostering critical thinking and providing frameworks for understanding complex human experiences.'
  },
  { 
    display: 'Physics', 
    name: 'Physics',
    description: 'Physics investigates the fundamental principles governing the universe, from the tiniest particles to the largest cosmic structures, driving innovations in technology and deepening our understanding of natural phenomena.'
  },
  { 
    display: 'Political Science', 
    name: 'PoliticalScience',
    description: 'Political Science analyzes governance systems, political behaviors, and policy-making processes, striving to enhance democratic institutions and address societal challenges through informed strategies.'
  },
  { 
    display: 'Psychology', 
    name: 'Psychology',
    description: 'Psychology studies the human mind and behavior, seeking to understand cognitive processes, emotional responses, and social interactions to improve mental health and interpersonal relationships.'
  },
  { 
    display: 'Robotics', 
    name: 'Robotics',
    description: 'Robotics designs and builds intelligent machines capable of performing tasks autonomously or semi-autonomously, advancing fields like manufacturing, healthcare, and exploration.'
  },
  { 
    display: 'Sociology', 
    name: 'Sociology',
    description: 'Sociology examines the development, structure, and functioning of human society, exploring social relationships, institutions, and cultural norms to address social issues and promote community well-being.'
  },
  { 
    display: 'Earth Sciences', 
    name: 'EarthSciences',
    description: 'Earth Sciences studies the Earth’s structure, processes, and history, contributing to our understanding of natural resources, geological hazards, and environmental sustainability.'
  },
];

export default departments;
