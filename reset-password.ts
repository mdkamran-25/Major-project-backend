import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

// @ts-ignore - Node.js globals
const email = process.argv[2];
// @ts-ignore - Node.js globals
const newPassword = process.argv[3];

async function resetPassword() {
  if (!email || !newPassword) {
    console.error('Usage: ts-node reset-password.ts <email> <newPassword>');
    // @ts-ignore - Node.js globals
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    // @ts-ignore - Node.js globals
    process.exit(1);
  }

  try {
    console.log(`\n🔄 Resetting password for: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND - Account does not exist');
      console.log('   Solution: Please sign up for a new account');
      // @ts-ignore - Node.js globals
      process.exit(1);
    }

    // Use non-null assertion since we've already checked for null
    const userData = user!;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    const updated = await prisma.user.update({
      where: { id: userData.id },
      data: {
        password: hashedPassword,
        isActive: true, // Ensure account is active
      },
    });

    // Revoke all old refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: userData.id },
    });

    console.log('✅ PASSWORD RESET SUCCESSFUL');
    console.log(`\n   Email: ${updated.email}`);
    console.log(`   New password has been set`);
    console.log(`   Account is now active`);
    console.log(`\n📝 You can now login with your new password`);
  } catch (error) {
    console.error('Error:', error);
    // @ts-ignore - Node.js globals
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
