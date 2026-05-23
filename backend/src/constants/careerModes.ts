export interface ICareerMode {
  id: string;
  name: string;
  description: string;
  readinessWeights: {
    dsa: number;
    optimization: number;
    interviews: number;
    resume: number;
    consistency: number;
    systemDesign?: number;
    shippingVelocity?: number;
  };
  primaryFocus: string[];
}

export const CareerModeRegistry: Record<string, ICareerMode> = {
  faang_sprint: {
    id: 'faang_sprint',
    name: 'FAANG Sprint',
    description: 'Intense focus on complex Data Structures, Algorithms, and extreme optimization needed for Big Tech.',
    readinessWeights: {
      dsa: 40,
      optimization: 25,
      interviews: 20,
      resume: 10,
      consistency: 5,
    },
    primaryFocus: ['Dynamic Programming', 'Graphs', 'Advanced Optimization', 'System Design (High Scale)'],
  },
  startup_builder: {
    id: 'startup_builder',
    name: 'Startup Builder',
    description: 'Prioritizes shipping speed, full-stack architecture, and real-world system design over pure algorithms.',
    readinessWeights: {
      dsa: 15,
      optimization: 10,
      interviews: 20,
      resume: 10,
      consistency: 10,
      systemDesign: 20,
      shippingVelocity: 15,
    },
    primaryFocus: ['System Architecture', 'Full-stack Integration', 'Shipping Speed', 'Database Design'],
  },
  placement_survival: {
    id: 'placement_survival',
    name: 'Placement Survival',
    description: 'Balanced approach covering core aptitude, medium DSA, and strong behavioral presentation.',
    readinessWeights: {
      dsa: 30,
      optimization: 10,
      interviews: 30,
      resume: 20,
      consistency: 10,
    },
    primaryFocus: ['Core CS Concepts', 'Medium DSA', 'Behavioral Interviews', 'Aptitude & Logic'],
  },
  ai_engineer_track: {
    id: 'ai_engineer_track',
    name: 'AI Engineer Track',
    description: 'Focused on Machine Learning, prompt engineering, papers, and data-heavy system design.',
    readinessWeights: {
      dsa: 20,
      optimization: 15,
      interviews: 15,
      resume: 15,
      consistency: 5,
      systemDesign: 30,
    },
    primaryFocus: ['Machine Learning', 'Data Pipelines', 'Prompt Engineering', 'Research Papers'],
  },
  freelance_remote: {
    id: 'freelance_remote',
    name: 'Freelance / Remote',
    description: 'Heavy emphasis on portfolio, open-source contributions, and strong asynchronous communication.',
    readinessWeights: {
      dsa: 5,
      optimization: 5,
      interviews: 20,
      resume: 40, // Portfolio weight essentially
      consistency: 10,
      shippingVelocity: 20,
    },
    primaryFocus: ['Portfolio Building', 'Open Source', 'Async Communication', 'Client Management'],
  }
};
