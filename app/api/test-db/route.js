import { NextResponse } from 'next/server';
import testConnection from '../../../lib/db-test';

export async function GET() {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({ message: 'MongoDB connection successful!' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Test DB API error:', error);
    return NextResponse.json({ error: 'An error occurred while testing the database connection' }, { status: 500 });
  }
} 