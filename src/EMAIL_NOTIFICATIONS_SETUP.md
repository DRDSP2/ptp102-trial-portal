# Email Notifications Setup Guide

## Overview
The PTP-102 Trial system now sends email notifications to **phyto2002@gmail.com** for all major site activities.

## What Triggers Notifications

1. **New Veterinarian Registration** - When a vet completes sign-up
2. **Veterinarian Approved/Rejected** - Admin approval decisions
3. **New Patient Enrolled** - When a patient is added to the trial
4. **Patient Updates** - Any patient record modifications
5. **Clinical Notes Added** - New clinical observations
6. **Treatments Added** - New treatment records
7. **Lab Results Added** - New lab data
8. **Assessments Added** - New clinical assessments

## Setup Required

### Step 1: Get EmailJS Account (FREE)
1. Go to https://www.emailjs.com/
2. Sign up for a free account (up to 200 emails/month)
3. Create a new email service (Gmail recommended)
4. Create an email template named `template_notifications`

### Step 2: Configure EmailJS Template
Create a template with these variables:
