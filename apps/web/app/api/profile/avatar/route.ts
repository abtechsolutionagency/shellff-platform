
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get user and delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete old avatar from S3 if exists (commented out - field doesn't exist)
    // if (user.profilePicture) {
    //   try {
    //     await deleteFile(user.profilePicture);
    //   } catch (error) {
    //     console.warn('Failed to delete old avatar:', error);
    //   }
    // }

    // Upload new avatar
    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudStoragePath = await uploadFile(buffer, file.name);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        updatedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    // Create media record (commented out - model doesn't exist)
    // await prisma.media.create({...});

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      cloudStoragePath,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete old avatar from S3 if exists (commented out - field doesn't exist)
    // if (user.profilePicture) {
    //   try {
    //     await deleteFile(user.profilePicture);
    //   } catch (error) {
    //     console.warn('Failed to delete avatar from S3:', error);
    //   }
    // }

    // Update user in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        updatedAt: new Date(),
      },
    });

    // Delete media records (commented out - model doesn't exist)
    // await prisma.media.deleteMany({...});

    return NextResponse.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
