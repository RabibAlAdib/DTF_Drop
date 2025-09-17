# 🚀 DTF Drop - Vercel + GitHub Deployment Guide

## 📋 **Prerequisites**
- GitHub account
- Vercel account (free tier available)
- Your API keys ready (see .env.example for complete list)

## 🔧 **Step 1: GitHub Repository Setup**

1. **Create GitHub Repository:**
   ```bash
   # Push your code to GitHub
   git init
   git add .
   git commit -m "Initial DTF Drop e-commerce application"
   git branch -M main
   git remote add origin https://github.com/USERNAME/dtf-drop.git
   git push -u origin main
   ```

2. **Verify .gitignore:**
   ```gitignore
   # Environment variables (already configured)
   .env
   .env.local
   .env.production
   ```

## 🌐 **Step 2: Vercel Deployment**

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "Next.js" framework (auto-detected)

2. **Configure Build Settings:**
   - Build Command: `npm run build` (auto-configured)
   - Output Directory: `.next` (auto-configured)
   - Install Command: `npm install` (auto-configured)

## 🔐 **Step 3: Environment Variables Setup**

In Vercel Dashboard → Project Settings → Environment Variables, add:

### **Required Variables:**
```env
# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Database (MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here

# Background Processing (Inngest)
INNGEST_SIGNING_KEY=signkey-prod-your_signing_key_here
INNGEST_EVENT_KEY=your_inngest_event_key_here

# Application Settings
NEXT_PUBLIC_CURRENCY=BDT 
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### **Optional Variables:**
```env
# Email Service (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password_here

# Payment Gateways (if using)
BKASH_API_KEY=your_bkash_api_key_here
BKASH_API_SECRET=your_bkash_api_secret_here
NAGAD_MERCHANT_ID=your_nagad_merchant_id_here
```

## 🏗️ **Step 4: Domain Configuration**

1. **Get Your Domain:**
   - Vercel provides: `https://your-app-name.vercel.app`
   - Or add custom domain in Project Settings

2. **Update Clerk Settings:**
   - Go to Clerk Dashboard
   - Add your Vercel domain to authorized origins
   - Update redirect URLs

3. **Update Application URLs:**
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
   - Update any hardcoded localhost references

## 🧪 **Step 5: Testing Deployment**

1. **Verify Build:**
   ```bash
   npm run build
   npm run start
   ```

2. **Test Key Features:**
   - User authentication (login/signup)
   - Product browsing
   - Cart functionality
   - Image uploads
   - Order processing

## 🔄 **Step 6: Continuous Deployment**

- Every push to `main` branch automatically deploys
- Use feature branches for development
- Vercel provides preview deployments for PRs

## 🛡️ **Security Best Practices**

1. **Environment Variables:**
   - Never commit .env files
   - Use different values for development/production
   - Rotate keys regularly

2. **Domain Security:**
   - Enable HTTPS (automatic on Vercel)
   - Configure proper CORS headers
   - Use secure headers (configured in next.config.mjs)

3. **API Security:**
   - All routes have authentication checks
   - Secure authentication patterns implemented
   - Protected endpoints for sensitive operations

## 📊 **Monitoring & Analytics**

- Vercel Analytics (built-in)
- Error tracking via Vercel Functions
- Performance monitoring dashboard

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **Build Fails:** Check environment variables are set
2. **Authentication Errors:** Verify Clerk domain configuration
3. **Database Connection:** Ensure MongoDB URI is correct
4. **Image Uploads:** Check Cloudinary configuration

### **Getting Help:**
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Check deployment logs in Vercel dashboard

---

## ✅ **Deployment Checklist**

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] All environment variables added
- [ ] Clerk domains configured
- [ ] Test deployment successful
- [ ] Production URL working
- [ ] Key features tested

Your DTF Drop e-commerce application is now ready for production! 🎉