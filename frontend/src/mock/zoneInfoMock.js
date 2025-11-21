// Mock zone info data used as an immediate UI fallback until the backend API responds.
// Each entry follows the API response shape: { zone, exhibitions: [] }

const zoneInfoMock = {
  zone1: {
    zone: 'Hospital',
    exhibitions: [
      'Emergency Medicine Expo',
      'Healthcare Robotics',
      'Telemedicine Showcase',
      'Patient Safety Workshop',
      'Public Health Posters'
    ]
  },
  zone2: {
    zone: 'ESCAL',
    exhibitions: [
      'Civil Engineering Seminar',
      'Structural Design Demos',
      'Automation & Control',
      'Sustainable Construction',
      'Materials Lab'
    ]
  },
  zone3: {
    zone: 'ACES (Association of Computer Engineering Students)',
    exhibitions: [
      'Student Robotics Showcase',
      'Embedded Systems Projects',
      'Hackathon Highlights',
      'AI & ML Demos',
      'IoT Prototype Gallery'
    ]
  },
  zone4: {
    zone: 'Gaming Zone',
    exhibitions: [
      'Indie Game Showcase',
      'VR Arena',
      'Esports Tournament',
      'Retro Arcade Corner',
      'Game Dev Workshop'
    ]
  },
  zone5: {
    zone: 'Agricultural Zone',
    exhibitions: [
      'Hydroponics Demo',
      'Precision Farming Tech',
      'Crop Drone Demonstration',
      'Soil Health Lab',
      'Organic Produce Market'
    ]
  },
  zone6: {
    zone: 'Industrial Zone',
    exhibitions: [
      'Factory Automation',
      '3D Printing Workshop',
      'CNC Demonstrations',
      'Industrial IoT Solutions',
      'Supply Chain Tech'
    ]
  },
  zone7: {
    zone: 'Smart Home',
    exhibitions: [
      'Home Automation Demos',
      'Energy Management Systems',
      'Assistive Living Tech',
      'Voice Assistant Integrations',
      'Smart Appliance Showcase'
    ]
  },
  zone8: {
    zone: 'Smart Cafe',
    exhibitions: [
      'Barista Robotics',
      'IoT Ordering Systems',
      'Advanced Coffee Brewing',
      'Sustainable Packaging',
      'Live Acoustic Sessions'
    ]
  }
};

export default zoneInfoMock;
