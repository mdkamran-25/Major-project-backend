# Login Fix Guide - Tsunami Alert System

## ⚠️ Problem Summary

You cannot login to your existing account even with the correct password. The error message says "Invalid email or password".

---

## ✅ IMMEDIATE SOLUTION - Option 1: CLI Password Reset (Quickest)

If you have access to your terminal, use this command to reset your password immediately:

### Step 1: Navigate to Backend Directory

```bash
cd /Users/kamran/Major-Project/tsunami-alert-backend
```

### Step 2: Check Your Account Status (Optional - Diagnostic)

```bash
npm run diagnose-login your-email@example.com your-password
```

This will tell you:

- ✅ If your account exists
- ✅ If your password is set correctly
- ✅ If your account is active
- ✅ Exact reason for login failure

### Step 3: Reset Your Password

```bash
npm run reset-password your-email@example.com your-new-password
```

**Example:**

```bash
npm run reset-password kamran@example.com newPassword123
```

**Requirements:**

- New password must be at least 6 characters
- After reset, all previous login sessions are invalidated

### Step 4: Login with New Password

- Go to: http://localhost:3000/auth/signin (or your frontend URL)
- Email: `your-email@example.com`
- Password: `your-new-password`

---

## ✅ SOLUTION - Option 2: Use Forgot Password Page (Web)

Once the backend is updated (run `npm run dev` in the backend directory):

### Step 1: Go to Forgot Password

- Navigate to: `/auth/forgot-password`
- Or click "Forgot password?" link on the signin page

### Step 2: Reset Via Web Interface

- Enter your email address
- Click "Send Reset Link"
- Follow the instructions

**Note:** This option will be fully functional after the backend starts

---

## 🔍 Why This Is Happening

Your account login is failing because of one of these reasons:

1. **Password Field is NULL**
   - Account was created without password (OAuth/Firebase)
   - Solution: Set a password with the reset commands above

2. **Account is INACTIVE**
   - Your account has been disabled
   - Solution: Reset password will reactivate it automatically

3. **Password Mismatch**
   - Password was changed or forgotten
   - Solution: Reset to a new password

4. **Account Doesn't Exist**
   - Email is not registered
   - Solution: Create a new account at /auth/signup

---

## 📋 Step-by-Step Instructions

### For the Diagnostic Script:

```bash
cd /Users/kamran/Major-Project/tsunami-alert-backend
npm run diagnose-login your-email password
```

You'll see output like:

```
🔍 Checking account for: kamran@example.com

✅ User found
   ID: abc123...
   Email: kamran@example.com
   Name: Kamran
   Role: VIEWER
   Active: false             ← Account inactive!
   Has password: true
   Last login: Never

❌ ACCOUNT INACTIVE
   Solution: Run: npm run reset-password kamran@example.com newPassword123
```

### For the Password Reset Script:

```bash
npm run reset-password your-email new-password
```

You'll see:

```
🔄 Resetting password for: kamran@example.com

✅ PASSWORD RESET SUCCESSFUL

   Email: kamran@example.com
   New password has been set
   Account is now active

📝 You can now login with your new password
```

---

## 🎯 Quick Checklist

- [ ] Run diagnostic: `npm run diagnose-login <email> <password>`
- [ ] Note the error message
- [ ] Run reset: `npm run reset-password <email> <newPassword>`
- [ ] Go to signin page
- [ ] Enter email and new password
- [ ] Should login successfully ✅

---

## ❓ Troubleshooting

### "User not found" error

- Email is not registered
- Create a new account at `/auth/signup`

### "Account inactive" error

- Run password reset, it will reactivate the account

### "Password must be at least 6 characters"

- Enter a password with 6+ characters

### Still can't login after reset?

1. Clear browser cache: `Cmd + Shift + Delete`
2. Try a different password
3. Check backend logs: `npm run dev`

---

## 📞 Still Having Issues?

1. Check the diagnostic output carefully
2. Ensure you're using the exact email and password
3. Clear browser cache and cookies
4. Try in an incognito/private window
5. Check backend console for error messages

---

Generated: March 26, 2026
