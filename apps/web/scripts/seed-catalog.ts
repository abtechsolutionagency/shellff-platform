
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { AlbumType, TagCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCatalog() {
  console.log("🎵 Seeding music catalog...");

  // Create tags
  const genres = [
    "Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical", 
    "Blues", "Country", "Folk", "Reggae", "R&B", "Soul"
  ];
  
  const moods = [
    "Happy", "Sad", "Energetic", "Chill", "Romantic", "Aggressive",
    "Dreamy", "Nostalgic", "Uplifting", "Melancholic"
  ];

  const activities = [
    "Workout", "Study", "Party", "Sleep", "Drive", "Work",
    "Meditation", "Cooking", "Gaming", "Reading"
  ];

  // Create genre tags
  for (const genre of genres) {
    await prisma.tag.upsert({
      where: { name: genre },
      update: {},
      create: {
        name: genre,
        category: TagCategory.GENRE
      }
    });
  }

  // Create mood tags  
  for (const mood of moods) {
    await prisma.tag.upsert({
      where: { name: mood },
      update: {},
      create: {
        name: mood,
        category: TagCategory.MOOD
      }
    });
  }

  // Create activity tags
  for (const activity of activities) {
    await prisma.tag.upsert({
      where: { name: activity },
      update: {},
      create: {
        name: activity,
        category: TagCategory.ACTIVITY
      }
    });
  }

  // Create artists with sample data
  const artists = [
    {
      name: "Luna Wave",
      bio: "Indie electronic artist known for dreamy soundscapes and ethereal vocals.",
      avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
      verified: true,
      followerCount: 125000,
      monthlyListeners: 85000
    },
    {
      name: "The Midnight Collective", 
      bio: "Alternative rock band from Portland, blending nostalgic melodies with modern production.",
      avatar: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400",
      verified: true,
      followerCount: 340000,
      monthlyListeners: 220000
    },
    {
      name: "DJ Neon",
      bio: "Electronic music producer specializing in synthwave and future funk.",
      avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      verified: false,
      followerCount: 67000,
      monthlyListeners: 45000
    },
    {
      name: "Aria Rose",
      bio: "Pop singer-songwriter with powerful vocals and meaningful lyrics.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      verified: true,
      followerCount: 890000,
      monthlyListeners: 650000
    },
    {
      name: "Bass Horizons",
      bio: "Hip-hop producer creating atmospheric beats and innovative soundscapes.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      verified: false,
      followerCount: 23000,
      monthlyListeners: 18000
    }
  ];

  const createdArtists = [];
  for (const artistData of artists) {
    const artist = await prisma.artist.create({
      data: artistData
    });
    createdArtists.push(artist);
  }

  // Create albums with tracks
  const albums = [
    {
      title: "Neon Dreams",
      description: "A journey through electronic landscapes and synth-driven melodies.",
      coverArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
      releaseDate: new Date("2024-03-15"),
      albumType: AlbumType.ALBUM,
      price: 12.99,
      artistId: createdArtists[0].id,
      tracks: [
        { title: "Starlight", duration: 245, trackNumber: 1, price: 1.99 },
        { title: "Digital Hearts", duration: 198, trackNumber: 2, price: 1.99 },
        { title: "Midnight Drive", duration: 267, trackNumber: 3, price: 1.99 },
        { title: "Neon Nights", duration: 223, trackNumber: 4, price: 1.99 },
        { title: "Electric Dreams", duration: 289, trackNumber: 5, price: 1.99 }
      ]
    },
    {
      title: "Urban Echoes",
      description: "The sound of the city captured in alternative rock anthems.",
      coverArt: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600",
      releaseDate: new Date("2024-01-20"),
      albumType: AlbumType.ALBUM,
      price: 14.99,
      artistId: createdArtists[1].id,
      tracks: [
        { title: "City Lights", duration: 312, trackNumber: 1, price: 2.49 },
        { title: "Underground", duration: 278, trackNumber: 2, price: 2.49 },
        { title: "Rooftop Views", duration: 245, trackNumber: 3, price: 2.49 },
        { title: "Street Symphony", duration: 334, trackNumber: 4, price: 2.49 }
      ]
    },
    {
      title: "Synthwave Memories",
      description: "Retro-futuristic beats that transport you to the 80s.",
      coverArt: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
      releaseDate: new Date("2024-05-10"),
      albumType: AlbumType.EP,
      price: 8.99,
      artistId: createdArtists[2].id,
      tracks: [
        { title: "Neon Highway", duration: 234, trackNumber: 1, price: 1.49 },
        { title: "Cyber Love", duration: 198, trackNumber: 2, price: 1.49 },
        { title: "Future Past", duration: 267, trackNumber: 3, price: 1.49 }
      ]
    },
    {
      title: "Broken Wings",
      description: "An emotional journey through love, loss, and healing.",
      coverArt: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600",
      releaseDate: new Date("2024-02-14"),
      albumType: AlbumType.SINGLE,
      price: 2.99,
      artistId: createdArtists[3].id,
      tracks: [
        { title: "Broken Wings", duration: 289, trackNumber: 1, price: 2.99 }
      ]
    },
    {
      title: "Lo-Fi Beats Vol. 1",
      description: "Chill hip-hop instrumentals perfect for study and relaxation.",
      coverArt: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
      releaseDate: new Date("2024-04-01"),
      albumType: AlbumType.COMPILATION,
      price: 9.99,
      artistId: createdArtists[4].id,
      tracks: [
        { title: "Morning Coffee", duration: 178, trackNumber: 1, price: 1.29 },
        { title: "Study Session", duration: 203, trackNumber: 2, price: 1.29 },
        { title: "Rainy Afternoon", duration: 189, trackNumber: 3, price: 1.29 },
        { title: "Night Walk", duration: 234, trackNumber: 4, price: 1.29 },
        { title: "Dreams", duration: 267, trackNumber: 5, price: 1.29 }
      ]
    }
  ];

  const createdAlbums = [];
  const createdTracks = [];

  for (const albumData of albums) {
    const { tracks, ...albumInfo } = albumData;
    
    // Calculate album stats
    const duration = tracks.reduce((sum, track) => sum + track.duration, 0);
    const trackCount = tracks.length;

    const album = await prisma.album.create({
      data: {
        ...albumInfo,
        duration,
        trackCount
      }
    });
    createdAlbums.push(album);

    // Create tracks for this album
    for (const trackData of tracks) {
      const track = await prisma.track.create({
        data: {
          ...trackData,
          artistId: album.artistId,
          albumId: album.id,
          playCount: Math.floor(Math.random() * 50000),
          likeCount: Math.floor(Math.random() * 5000)
        }
      });
      createdTracks.push(track);

      // Add media assets for each track
      await prisma.mediaAsset.create({
        data: {
          trackId: track.id,
          type: "AUDIO",
          url: `https://example.com/audio/${track.id}.mp3`,
          quality: "320kbps",
          format: "mp3",
          size: trackData.duration * 40000 // Estimate file size
        }
      });
    }
  }

  // Add tags to albums and tracks
  const tagNames = [...genres, ...moods, ...activities];
  const tags = await prisma.tag.findMany({
    where: { name: { in: tagNames } }
  });

  // Assign random tags to albums
  for (const album of createdAlbums) {
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const tag of randomTags) {
      await prisma.albumTag.create({
        data: {
          albumId: album.id,
          tagId: tag.id
        }
      });
    }
  }

  // Assign random tags to tracks
  for (const track of createdTracks) {
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const tag of randomTags) {
      await prisma.trackTag.create({
        data: {
          trackId: track.id,
          tagId: tag.id
        }
      });
    }
  }

  console.log("✅ Catalog seeded successfully!");
  console.log(`Created ${createdArtists.length} artists, ${createdAlbums.length} albums, ${createdTracks.length} tracks`);
}

seedCatalog()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
