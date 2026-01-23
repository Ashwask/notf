# Admin Module Setup Guide

## Current Status

✅ **Built:**
- Login page (`/admin/login.html`)
- Dashboard (`/admin/dashboard.html`)
- Organizations CRUD (`/admin/organizations.html`)
- Authentication utilities
- Protected routes

## Setup Steps

### Step 1: Enable Supabase Auth (2 minutes)

1. **Go to Supabase Authentication:**
   https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm/auth/users

2. **Click "Add user" → "Create new user"**

3. **Create your admin account:**
   - Email: `your-email@example.com`
   - Password: (choose a strong password)
   - Email Confirm: **Uncheck "Auto Confirm User"** (or check it to skip email verification)

4. **Click "Create user"**

### Step 2: Test the Admin Module

1. **Visit the login page:**
   https://notf-one.vercel.app/admin/login.html

2. **Login with your credentials**

3. **You should see the dashboard** with:
   - Total communities count
   - Total solution providers count
   - Quick action buttons

4. **Test Organizations CRUD:**
   - Click "Manage →" next to Solution Providers
   - Try adding a test organization
   - Try editing it
   - Try deleting it

### Step 3: Set Up Email Templates (Optional)

If you want password reset/email verification:

1. Go to: https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm/auth/templates

2. Customize email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## Features Available Now

### Dashboard (`/admin/dashboard.html`)
- View total counts
- See recent activity
- Quick actions for adding orgs
- Manual deployment trigger

### Organizations Management (`/admin/organizations.html`)
- **List** all solution providers
- **Search** by name, theme, location
- **Filter** by status (active/pending/archived)
- **Create** new organizations with form
- **Edit** existing organizations
- **Delete** organizations
- Auto-triggers deployment on changes

### What's Protected
- ✅ `/admin/dashboard.html` - requires login
- ✅ `/admin/organizations.html` - requires login

### What's Still Public
- ❌ `/matcher/` - currently public (can move to admin)
- ✅ `/solution-providers/` - public (correct)
- ✅ `/communities/` - public (correct)

## Next Enhancements (Future)

### 1. Communities CRUD Page
Create `/admin/communities.html` similar to organizations page.

### 2. Move Matcher to Admin
Copy `/matcher/` to `/admin/matcher.html` and add auth check.

### 3. Stories Editor
Add a rich text editor for the `stories` field in both communities and organizations.

### 4. Bulk Import
Add UI to upload Excel files and bulk import organizations.

### 5. Advanced Permissions
- Add user roles (admin, editor, viewer)
- Row-level security in Supabase

## Troubleshooting

### "Invalid login credentials" error
- Check you created the user in Supabase
- Verify email/password are correct
- Check if "Auto Confirm" was enabled

### Redirects to login immediately
- Check browser console for errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel
- Clear browser cache

### Can't see organizations
- Check Table Editor → file_metadata has data
- Verify `status = 'active'`
- Check browser console for API errors

### Changes don't trigger deployment
- This is expected - auto-deployment webhook not set up yet
- Use manual "Trigger Deployment" button on dashboard
- Or set up the Edge Function from earlier instructions

## Security Notes

✅ **Secure:**
- Login required for all admin pages
- Supabase Auth handles sessions
- Anon key only has limited permissions (defined by RLS)

⚠️ **Important:**
- Don't share your admin password
- Service role key should stay in Vercel env vars (never in client code)
- Review Supabase RLS policies to ensure data security

## URLs

- **Login**: https://notf-one.vercel.app/admin/login.html
- **Dashboard**: https://notf-one.vercel.app/admin/dashboard.html
- **Organizations**: https://notf-one.vercel.app/admin/organizations.html

## Architecture

```
Public Pages (No Auth):
├── /
├── /solution-providers/
├── /communities/
└── /about/

Admin Pages (Auth Required):
├── /admin/login.html (public - login form)
├── /admin/dashboard.html (protected)
└── /admin/organizations.html (protected)

Auth Flow:
1. User visits /admin/dashboard.html
2. auth.js checks for session
3. If no session → redirect to /admin/login.html
4. User logs in → creates session
5. Redirects to dashboard
6. Session persists across admin pages
```

## Quick Test Checklist

After deploying:
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Dashboard loads and shows counts
- [ ] Can view organizations list
- [ ] Can create new organization
- [ ] Can edit organization
- [ ] Can delete organization
- [ ] Logout works and redirects to login

---

🎉 **Your admin module is ready to use!**

Just enable Supabase Auth, create your admin user, and start managing organizations through the beautiful admin interface!
