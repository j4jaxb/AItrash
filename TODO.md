# ✅ Action List - Do This Next

## 🔴 Critical (Must Do)

### 1. Remove Nodemailer from Frontend ✅ (DONE)
```bash
npm uninstall nodemailer
```
Status: ✅ Already done

### 2. Setup Backend Server ✅ (DONE)
```bash
cd backend
npm install
```
Status: ✅ Already done

### 3. Create .env File ✅ (DONE)
```bash
# backend/.env
PORT=5001  # Changed from 5000 (port conflict)
EMAIL_USER=jnp.trash@gmail.com
EMAIL_PASSWORD=sqzy gdkg nzah zftz
```
Status: ✅ Already done

### 4. Start Backend ✅ (DONE)
```bash
npm start
```
Status: ✅ Running on port 5001

### 5. Create Supabase Table (DO THIS NOW!)
Go to Supabase Dashboard → SQL Editor → Run this SQL:

```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
```

Status: ⏭️ **DO THIS NOW!**

---

## 🟡 Important (Soon)

### 6. Test Backend API ✅ (DONE)
```bash
# Open new terminal
curl http://localhost:5001/api/email/health

# Should return:
# {"status":"healthy","message":"Email service is working correctly"}
```
Status: ✅ Already tested - API is healthy!

### 7. Create Supabase Table (CRITICAL - DO THIS NOW!)
**This is why you're getting the error!**

Go to: https://supabase.com/dashboard → Your Project → SQL Editor

Copy and paste this SQL:

```sql
-- Create verification_codes table
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
```

**Click "Run" → Should see "Success"**

Status: ⏭️ **DO THIS NOW!** (This fixes your error)

### 8. Test Full System (After creating table)
```bash
# Terminal: Run React Native app
npm start

# In app:
# 1. Click "ลงทะเบียน"
# 2. Fill form with email
# 3. Click "ส่งรหัสยืนยัน"
# 4. Check email for 6-digit code
# 5. Enter code and complete registration
# 6. Try to login with new account
```

Status: ⏭️ **Test after creating Supabase table**

---

## 🔧 Network Connection Fix

### If you get "Network request failed":

**1. Check Backend Status:**
```bash
# Backend should be running on port 5001
netstat -ano | findstr :5001
```

**2. Test API from Terminal:**
```bash
Invoke-WebRequest -Uri http://172.20.10.2:5001/api/email/health -Method GET -UseBasicParsing
```

**3. Alternative IP Addresses to try:**
- `http://172.20.10.2:5001` (Current)
- `http://10.0.2.2:5001` (Android emulator)
- `http://192.168.1.xxx:5001` (Your local IP)

**4. Update emailService.js if needed:**
```javascript
const API_BASE_URL = 'http://YOUR_IP_HERE:5001';
```

**5. Test from React Native:**
```javascript
// Add to LoginScreen.js for testing
import { testEmailConnection } from '../utils/emailService';

// Call this function to test
const testConnection = async () => {
  const result = await testEmailConnection();
  console.log('Connection test:', result);
};
```

Status: ✅ **Network fixes applied + Debug tools added**

### Next Steps:
1. **Create Supabase Table** (Most Important!)
2. Test the app registration flow
3. Remove debug buttons when everything works

### 6. Test Frontend
```bash
# Terminal 3
npm start  # or expo start

# Try:
# - Register with email
# - Check if verification email arrives
# - Enter code and complete registration
# - Try to login with new account
```

### 7. Test Forgot Password
```bash
# In app:
# - Click "Forgot Password"
# - Enter email
# - Should receive code
# - Complete password reset
```

---

## 🟢 Nice to Have (Later)

### 8. Deploy Backend
Choose one:

**Option A: Heroku** (easiest)
```bash
npm install -g heroku-cli
heroku login
heroku create your-app-name
heroku config:set EMAIL_USER=jnp.trash@gmail.com
heroku config:set EMAIL_PASSWORD=sqzy gdkg nzah zftz
git push heroku main
```

**Option B: Railway** (fast)
- Go to railway.app
- Connect GitHub
- Deploy with one click

**Option C: VPS**
- Get a server (DigitalOcean, etc)
- SSH and setup Node.js
- Deploy with PM2

### 9. Update API URL in App
Once backend is deployed, update:
```javascript
// utils/emailService.js
const API_BASE_URL = 'https://your-backend-domain.com';
```

---

## 📋 Verification Checklist

### Backend Working?
- [ ] `npm start` runs without errors
- [ ] No error messages in console
- [ ] Port 5000 is listening
- [ ] `curl /api/email/health` returns 200

### Email Working?
- [ ] Verification code email arrives
- [ ] Welcome email arrives (if enabled)
- [ ] Emails have correct format
- [ ] Links work if included

### Frontend Working?
- [ ] No iOS/Android build errors
- [ ] Registration → get email code
- [ ] Enter code → create account
- [ ] Login with new account ✓
- [ ] Forgot password → reset works

### Security OK?
- [ ] .env is in .gitignore
- [ ] Credentials not in code
- [ ] HTTPS in production

---

## 🚨 Troubleshooting

### Build fails with "events module"
```bash
# If error still appears:
npm install --save react-native
npm audit fix
npm start
```

### Backend won't start
```bash
# Check if port 5000 is in use
# Mac/Linux:
lsof -i :5000

# Windows:
netstat -ano | findstr :5000

# Change PORT in .env if needed
```

### Emails not sending
```bash
# Check:
1. .env credentials correct?
2. Gmail App Password (not regular password)?
3. Backend running? (npm start)
4. Check console.log for errors
```

### API connection fails
```bash
# Make sure:
1. Backend is running
2. API_BASE_URL correct in emailService.js
3. Backend and app on same network
4. Firewall not blocking port 5000
```

---

## 📚 Documentation to Read

**In order of importance:**

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ← START HERE (2 mins)
2. **[FIX_SUMMARY.md](./FIX_SUMMARY.md)** (5 mins)
3. **[backend/README.md](./backend/README.md)** (5 mins)
4. **[IOS_BUNDLING_FIX.md](./IOS_BUNDLING_FIX.md)** (10 mins)
5. **[backend/SETUP.md](./backend/SETUP.md)** (deployment)

---

## 🎯 Quick Commands

```bash
# Frontend
cd AItrash
npm uninstall nodemailer  # If not done
npm start                  # Run app

# Backend
cd AItrash/backend
npm install               # First time only
npm start                 # Run server
npm run dev              # Run with auto-reload

# Testing
curl http://localhost:5000/api/email/health
```

---

## 📱 Testing Email Flows

### Registration Flow
1. Open app
2. Click "ลงทะเบียน"
3. Fill form
4. Click "ส่งรหัสยืนยัน"
5. Check email for code
6. Enter code in app
7. Click "ยืนยัน"
8. Success: "ลงทะเบียนเรียบร้อยแล้ว"

### Forgot Password Flow
1. Open app
2. Click "ลืมรหัสผ่าน?"
3. Enter email
4. Click "ส่งรหัสยืนยัน"
5. Check email for code
6. Enter code in app
7. Click "ยืนยัน"
8. Enter new password
9. Click "เปลี่ยนรหัสผ่าน"
10. Success: "เปลี่ยนเรียบร้อยแล้ว"

---

## ✅ Success Indicators

You know everything is working when:

✅ Backend starts without errors
✅ Health check returns "healthy"
✅ Register email arrives in <10 seconds
✅ Verification code is 6 digits
✅ Code expires after 10 minutes
✅ App creates account after verification
✅ Login works with new account
✅ Forgot password flow completes
✅ No iPhone build errors
✅ No Android build errors

---

## 🎓 Learning Path

If you want to understand what happened:

1. **Why error?** Read: [IOS_BUNDLING_FIX.md](./IOS_BUNDLING_FIX.md)
2. **How fixed?** Read: [FIX_SUMMARY.md](./FIX_SUMMARY.md)
3. **How to use?** Read: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
4. **Full details?** Read: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## 🚀 You're Ready!

Everything is set up. Just follow these steps:

1. ✅ Remove Nodemailer (done)
2. ⏭️ Setup backend (5 mins)
3. ⏭️ Test API (2 mins)
4. ⏭️ Test app (10 mins)
5. ⏭️ Deploy (optional, 30 mins)

**Total time: ~30 minutes to full working system!**

---

Start with: `cd backend && npm install && npm start`

Then: Open new terminal and `curl http://localhost:5000/api/email/health`

Good luck! 🎉
