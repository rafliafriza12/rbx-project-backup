/**
 * Script untuk menghapus semua chat rooms dan messages
 * Jalankan dengan: node --env-file=.env.local scripts/clear-all-chats.mjs
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI tidak ditemukan di environment variables');
  process.exit(1);
}

async function clearAllChats() {
  try {
    console.log('🔌 Menghubungkan ke MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');

    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Hapus semua messages
    console.log('\n📧 Menghapus semua messages...');
    const messagesResult = await db.collection('messages').deleteMany({});
    console.log(`   ✅ ${messagesResult.deletedCount} messages dihapus`);

    // Hapus semua chat rooms
    console.log('\n💬 Menghapus semua chat rooms...');
    const roomsResult = await db.collection('chatrooms').deleteMany({});
    console.log(`   ✅ ${roomsResult.deletedCount} chat rooms dihapus`);

    console.log('\n🎉 Semua chat data berhasil dihapus!');
    console.log('   - Messages: ' + messagesResult.deletedCount);
    console.log('   - Chat Rooms: ' + roomsResult.deletedCount);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Terputus dari MongoDB');
    process.exit(0);
  }
}

clearAllChats();
