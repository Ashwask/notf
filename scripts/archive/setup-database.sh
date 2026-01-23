#!/bin/bash
# Setup Script for Database Migrations and Ward Assignment

echo "🚀 NOTF Database Setup Script"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create a .env file with your Supabase credentials:"
    echo "  cp .env.example .env"
    echo ""
    echo "Then edit .env and add your SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Find it at: https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm/settings/api"
    echo "Look for the 'service_role' key under 'Project API keys'"
    exit 1
fi

echo "✅ Found .env file"
echo ""

# Step 1: Run SQL Migration
echo "📊 Step 1: Running SQL Migration"
echo "--------------------------------"
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm/sql/new"
echo ""
cat add-neighborhood-ward-fields.sql
echo ""
read -p "Press Enter once you've run the SQL migration in Supabase..."
echo ""

# Step 2: Run Ward Assignment Script
echo "🗺️  Step 2: Assigning Wards from KML"
echo "-----------------------------------"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

echo "Running ward assignment script..."
python3 assign-wards-from-kml.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Your database now has:"
    echo "  • neighborhood and ward columns"
    echo "  • latitude and longitude columns"
    echo "  • Auto-populated ward names based on coordinates"
else
    echo ""
    echo "❌ Ward assignment failed. Check the error above."
    exit 1
fi
