import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

// @ts-ignore - Node.js globals
const email = process.argv[2];
// @ts-ignore - Node.js globals
const password = process.argv[3];

async function diagnoseLogin() {
  if (!email || !password) {
    console.error('Usage: ts-node diagnose-login.ts <email> <password>');
    // @ts-ignore - Node.js globals
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Checking account for: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND - Account does not exist in database');
      console.log('   Solution: Please sign up for a new account');
      // @ts-ignore - Node.js globals
      process.exit(1);
    }

    // Use non-null assertion since we've already checked for null
    const userData = user!;

    console.log('✅ User found');
    console.log(`   ID: ${userData.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.displayName || 'Not set'}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Active: ${userData.isActive}`);
    console.log(`   Has password: ${!!userData.password}`);
    console.log(`   Last login: ${userData.lastLoginAt || 'Never'}`);

    if (!userData.isActive) {
      console.log('\n❌ ACCOUNT INACTIVE - Your account has been disabled');
      console.log('   Solution: Contact an administrator to reactivate your account');
      // @ts-ignore - Node.js globals
      process.exit(1);
    }

    if (!userData.password) {
      console.log('\n❌ NO PASSWORD SET - Account has no password field');
      console.log('   Solution: Run: npm run reset-password <email> <newPassword>');
      // @ts-ignore - Node.js globals
      process.exit(1);
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password!);

    if (!isPasswordValid) {
      console.log('\n❌ PASSWORD MISMATCH - Password is incorrect');
      console.log('   Solution: Try the forgot password feature or run:');
      console.log('            npm run reset-password <email> <newPassword>');
      // @ts-ignore - Node.js globals
      process.exit(1);
    }

    console.log('\n✅ PASSWORD CORRECT - Authentication should work');
    console.log('   If you still cannot login, try clearing browser cache');
  } catch (error) {
    console.error('Error:', error);
    // @ts-ignore - Node.js globals
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseLogin();
