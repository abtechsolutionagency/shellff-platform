
import { Track, Playlist } from '@/lib/audio/AudioManager';

// Mock tracks data for testing
export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Digital Dreams',
    artist: 'CyberSynth',
    album: 'Future Waves',
    duration: 245, // 4:05
    audioUrl: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3', // Placeholder URL
    coverArt: 'https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png',
    genre: 'Electronic',
    releaseYear: 2024,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Neon Lights',
    artist: 'Electric Pulse',
    album: 'Cyber City',
    duration: 198, // 3:18
    audioUrl: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3', // Placeholder URL
    coverArt: 'https://cdn.abacus.ai/images/bda0d262-5d1a-4a75-a8ab-bf949dace0b8.png',
    genre: 'Synthwave',
    releaseYear: 2024,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  },
  {
    id: '3',
    title: 'Blockchain Beats',
    artist: 'DecentralizedSound',
    album: 'Web3 Chronicles',
    duration: 287, // 4:47
    audioUrl: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3', // Placeholder URL
    coverArt: 'https://cdn.abacus.ai/images/27ece972-292a-4f1c-b183-31353d8fcda6.png',
    genre: 'Tech House',
    releaseYear: 2024,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05')
  },
  {
    id: '4',
    title: 'Stellar Journey',
    artist: 'CosmicWave',
    album: 'Space Odyssey',
    duration: 312, // 5:12
    audioUrl: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3', // Placeholder URL
    coverArt: 'https://cdn.abacus.ai/images/6b98ea9b-7249-40d2-a20a-56bfcbdca00e.png',
    genre: 'Ambient',
    releaseYear: 2024,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: '5',
    title: 'Quantum Rhythm',
    artist: 'FutureBass',
    album: 'Dimension X',
    duration: 223, // 3:43
    audioUrl: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3', // Placeholder URL
    coverArt: 'https://cdn.abacus.ai/images/0235b924-29e0-45f4-b2ae-4afd28770826.png',
    genre: 'Future Bass',
    releaseYear: 2024,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  }
];

// Mock playlists data
export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Chill Vibes',
    description: 'Perfect tracks for relaxing and unwinding',
    coverArt: 'https://cdn.abacus.ai/images/53926280-0557-4f66-987f-150753d0d6cf.png',
    tracks: [mockTracks[0], mockTracks[3], mockTracks[1]],
    createdBy: 'user-123',
    isPublic: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-04-01')
  },
  {
    id: 'playlist-2',
    name: 'Electronic Fusion',
    description: 'High energy electronic tracks for any mood',
    coverArt: 'https://cdn.abacus.ai/images/bda0d262-5d1a-4a75-a8ab-bf949dace0b8.png',
    tracks: [mockTracks[1], mockTracks[2], mockTracks[4]],
    createdBy: 'user-123',
    isPublic: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-04-01')
  },
  {
    id: 'playlist-3',
    name: 'Web3 Anthems',
    description: 'The future of decentralized music',
    coverArt: 'https://cdn.abacus.ai/images/27ece972-292a-4f1c-b183-31353d8fcda6.png',
    tracks: [mockTracks[2], mockTracks[0], mockTracks[4]],
    createdBy: 'user-123',
    isPublic: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-04-01')
  },
  {
    id: 'playlist-4',
    name: 'Focus Flow',
    description: 'Instrumental tracks for deep work and concentration',
    coverArt: 'https://cdn.abacus.ai/images/6b98ea9b-7249-40d2-a20a-56bfcbdca00e.png',
    tracks: [mockTracks[3], mockTracks[0]],
    createdBy: 'user-123',
    isPublic: false,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-04-01')
  }
];
