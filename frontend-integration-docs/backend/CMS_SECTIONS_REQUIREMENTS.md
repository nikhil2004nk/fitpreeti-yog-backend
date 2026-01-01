# CMS Sections Requirements - Complete List

## Overview

This document lists ALL sections in your website that need backend CMS support, organized by page/location. Each section indicates what content is currently hardcoded and what needs to come from the backend.

---

## ✅ Already Coming from Backend

| Section | Current Source | Status |
|---------|---------------|--------|
| Services Section | `serviceService.getAllServices()` | ✅ Already from backend |
| Testimonials/Reviews | `reviewService.getApprovedReviews()` | ✅ Already from backend |
| Trainers | `trainerService.getAllTrainers()` | ✅ Already from backend |

---

## 🔴 Currently Hardcoded - NEEDS Backend CMS

### 📄 **Page: Home Page** (`/`)

#### 1. **Hero Section** (`HeroSection.tsx`)
**Current Status:** Hardcoded content
**Location:** `src/components/sections/HeroSection.tsx`

**Hardcoded Content:**
- Title: "FitPreeti Yog Institute"
- Subtitle: "Yoga for calm. Zumba for energy. Dance for joy. Fitness for transformation."
- Button text: "Book Your Class", "Explore Classes"

**Required Backend Section Key:** `hero`

**Content Structure Needed:**
```json
{
  "section_key": "hero",
  "content": {
    "title": "FitPreeti Yog Institute",
    "subtitle": "Yoga for calm. Zumba for energy. Dance for joy. Fitness for transformation.",
    "cta_primary": {
      "text": "Book Your Class",
      "link": "/booking",
      "action": "navigate"
    },
    "cta_secondary": {
      "text": "Explore Classes",
      "link": "/services",
      "action": "navigate"
    },
    "background_image": "https://example.com/hero-bg.jpg",
    "background_color": "#000000"
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🔴 HIGH - Main landing section

---

#### 2. **CTA Section** (`CTASection.tsx`)
**Current Status:** Hardcoded content
**Location:** `src/components/sections/CTASection.tsx`

**Hardcoded Content:**
- Title: "Begin Your Journey Towards a Healthier & Balanced Life"
- Description: "At FitPreeti Yog Institute, we blend traditional yoga with modern fitness techniques..."
- Button text: "Book a Free Trial Class", "Talk to Us on WhatsApp"
- WhatsApp link: Hardcoded `https://wa.me/917039142314`
- Social proof text: "Trusted by 500+ Happy Students"

**Required Backend Section Key:** `cta_home` or `cta`

**Content Structure Needed:**
```json
{
  "section_key": "cta_home",
  "content": {
    "title": "Begin Your Journey Towards a Healthier & Balanced Life",
    "subtitle": "At FitPreeti Yog Institute, we blend traditional yoga with modern fitness techniques to help you build strength, flexibility, and inner peace — guided by certified instructors.",
    "cta_primary": {
      "text": "Book a Free Trial Class",
      "link": "/booking",
      "action": "navigate"
    },
    "cta_secondary": {
      "text": "Talk to Us on WhatsApp",
      "link": "https://wa.me/917039142314",
      "action": "external"
    },
    "social_proof": {
      "text": "Trusted by 500+ Happy Students",
      "show_avatars": true
    },
    "background_color": "#dc2626"
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🔴 HIGH - Important conversion section

---

#### 3. **Announcements Banner** (Missing - Should Add)
**Current Status:** ❌ NOT IMPLEMENTED

**Suggested Section Key:** `announcements`

**Content Structure Needed:**
```json
{
  "section_key": "announcements",
  "content": {
    "title": "New Morning Classes Available",
    "message": "Join us for our new 6 AM yoga sessions. Limited spots available!",
    "link": "/schedule",
    "link_text": "View Schedule",
    "priority": "high",
    "icon": "bell",
    "bg_color": "#dc2626",
    "text_color": "#ffffff",
    "expiry_date": "2024-12-31"
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟡 MEDIUM - Useful for promotions/notices

**Suggested Location:** After Hero Section, before Services

---

### 📄 **Page: Contact Page** (`/contact`)

#### 4. **Contact Information Section**
**Current Status:** Uses `institute.json` (static file)
**Location:** `src/pages/Contact.tsx`, `src/data/institute.json`

**Hardcoded Content (in institute.json):**
- Location: "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067"
- Phone: "+91 9876543210 / +91 7039142314"
- Email: "hello@fitpreeti.com"
- Social Media: Instagram, Facebook, YouTube links
- WhatsApp: Hardcoded in CTASection

**Required Backend Endpoint:** `GET /api/v1/institute-info`

**Content Structure Needed:**
```json
{
  "location": "D-8, Soc no.30, Kandivali, Nilkanth Nagar, Ganesh Nagar, Kandivali West, Mumbai, Maharashtra 400067",
  "phone_numbers": ["+91 9876543210", "+91 7039142314"],
  "email": "hello@fitpreeti.com",
  "social_media": {
    "instagram": "https://www.instagram.com/fitpreeti_fitness_dance_studio/",
    "facebook": "https://www.facebook.com/fitpreeti4603/",
    "youtube": "https://youtube.com/@fitpreeti",
    "whatsapp": "https://wa.me/917039142314"
  }
}
```

**Priority:** 🔴 HIGH - Core contact information

**Note:** This is already documented in the Institute Info API spec.

---

#### 5. **Contact Page Hero Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/Contact.tsx` (lines 86-98)

**Hardcoded Content:**
- Title: "Let's Connect"
- Description: "Have questions or want to book a class? Reach out to us..."

**Required Backend Section Key:** `contact_hero`

**Content Structure Needed:**
```json
{
  "section_key": "contact_hero",
  "content": {
    "title": "Let's Connect",
    "description": "Have questions or want to book a class? Reach out to us and our team will get back to you as soon as possible."
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟢 LOW - Can remain hardcoded, but nice to have CMS control

---

#### 6. **Contact Page CTA Banner**
**Current Status:** Hardcoded content
**Location:** `src/pages/Contact.tsx` (lines 332-361)

**Hardcoded Content:**
- Title: "Ready to Start Your Fitness Journey?"
- Description: "Join our community and experience the transformation"
- Button texts

**Required Backend Section Key:** `contact_cta`

**Priority:** 🟢 LOW - Similar to other CTA sections

---

### 📄 **Page: About Page** (`/about`)

#### 7. **About Page Hero Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/About.tsx` (lines 196-253)

**Hardcoded Content:**
- Badge: "About Our Journey"
- Title: "Empowering Lives Through Fitness & Wellness"
- Description: "For over a decade, FitPreeti Yog Institute has been transforming lives..."

**Required Backend Section Key:** `about_hero`

**Content Structure Needed:**
```json
{
  "section_key": "about_hero",
  "content": {
    "badge": "About Our Journey",
    "title": "Empowering Lives Through Fitness & Wellness",
    "description": "For over a decade, FitPreeti Yog Institute has been transforming lives in Narnaund and beyond through our passionate approach to yoga, dance, and holistic fitness. What started as a small neighborhood studio has grown into a thriving wellness community.",
    "cta_primary": {
      "text": "Start Your Journey Today",
      "link": "/booking"
    },
    "cta_secondary": {
      "text": "Our Story",
      "action": "scroll",
      "target": "our-story"
    }
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟡 MEDIUM

---

#### 8. **Statistics Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/About.tsx` (lines 256-281)

**Hardcoded Stats:**
```javascript
const stats = [
  { name: 'Years of Excellence', value: '10+' },
  { name: 'Happy Students', value: '500+' },
  { name: 'Classes Taught', value: '5000+' },
  { name: 'Programs Offered', value: '10+' }
];
```

**Required Backend Section Key:** `about_stats`

**Content Structure Needed:**
```json
{
  "section_key": "about_stats",
  "content": {
    "stats": [
      {
        "name": "Years of Excellence",
        "value": "10+",
        "icon": "award"
      },
      {
        "name": "Happy Students",
        "value": "500+",
        "icon": "heart"
      },
      {
        "name": "Classes Taught",
        "value": "5000+",
        "icon": "users"
      },
      {
        "name": "Programs Offered",
        "value": "10+",
        "icon": "activity"
      }
    ]
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟡 MEDIUM - Stats change over time

---

#### 9. **Milestones/Timeline Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/About.tsx` (lines 17-54, 283-379)

**Hardcoded Milestones:**
- 2014: Humble Beginnings
- 2016: Expanding Horizons
- 2018: Dance & Fitness
- 2020: Digital Transformation
- 2022: Corporate Wellness
- Today: 10+ Years Strong

**Required Backend Section Key:** `about_timeline` or `milestones`

**Content Structure Needed:**
```json
{
  "section_key": "about_timeline",
  "content": {
    "title": "A Decade of Transformation",
    "description": "From our humble beginnings to becoming a cornerstone of the Narnaund community, our journey has been one of passion, dedication, and countless success stories.",
    "milestones": [
      {
        "year": "2014",
        "title": "Humble Beginnings",
        "description": "Started as a small neighborhood studio in Narnaund, bringing yoga to the community with personalized attention and care."
      },
      {
        "year": "2016",
        "title": "Expanding Horizons",
        "description": "Introduced specialized yoga programs for different age groups and fitness levels..."
      }
      // ... more milestones
    ]
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟡 MEDIUM - Timeline will grow over time

---

#### 10. **Philosophy Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/About.tsx` (lines 382-467)

**Hardcoded Content:**
- Title: "More Than Just Fitness"
- Two cards: "Why We Exist" and "Our Promise"
- Promise list items (4 bullet points)

**Required Backend Section Key:** `about_philosophy`

**Content Structure Needed:**
```json
{
  "section_key": "about_philosophy",
  "content": {
    "title": "More Than Just Fitness",
    "description": "At FitPreeti Yog Institute, we believe in a holistic approach to wellness that nurtures the body, mind, and spirit through movement, community, and self-discovery.",
    "cards": [
      {
        "icon": "heart",
        "title": "Why We Exist",
        "description": "We created FitPreeti Yog Institute to be more than just a fitness center..."
      },
      {
        "icon": "users",
        "title": "Our Promise",
        "promise_items": [
          "Expert, personalized attention in every class",
          "Safe, progressive training methods that respect your body",
          "A supportive community that celebrates every achievement",
          "Programs that evolve with your fitness journey"
        ]
      }
    ]
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟢 LOW - Philosophy doesn't change often

---

#### 11. **Programs Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/About.tsx` (lines 617-722)

**Hardcoded Programs:**
- Yoga & Meditation
- Zumba & Dance Fitness
- Strength & Conditioning
- Prenatal & Postnatal
- Kids & Teens
- Senior Wellness

**Required Backend Section Key:** `about_programs`

**Content Structure Needed:**
```json
{
  "section_key": "about_programs",
  "content": {
    "title": "Transformative Programs for Everyone",
    "description": "From high-energy dance workouts to mindful yoga practices, our diverse range of programs is designed to meet you where you are in your fitness journey.",
    "programs": [
      {
        "title": "Yoga & Meditation",
        "description": "From gentle Hatha to dynamic Vinyasa, find your perfect practice...",
        "icon": "🧘‍♀️",
        "color": "amber"
      }
      // ... more programs
    ]
  },
  "order": 0,
  "is_active": true
}
```

**Priority:** 🟢 LOW - Similar to services, but this is more general

---

#### 12. **About Page CTA Section**
**Current Status:** Hardcoded content (same as Home CTA)
**Location:** `src/pages/About.tsx` (lines 725-795)

**Priority:** 🟢 LOW - Can reuse `cta_home` section or create `cta_about`

---

### 📄 **Page: Online Classes Page** (`/online-classes`)

#### 13. **Online Classes Hero Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/OnlineClasses.tsx` (lines 86-140)

**Hardcoded Content:**
- Badge: "Join Us From Anywhere"
- Title: "Live Online Yoga & Fitness Classes That Inspire"
- Description: "Practice yoga, dance, and fitness from the comfort of your home..."
- Button texts

**Required Backend Section Key:** `online_classes_hero`

**Priority:** 🟡 MEDIUM

---

#### 14. **Online Classes Stats Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/OnlineClasses.tsx` (lines 75-80, 124-139)

**Hardcoded Stats:**
- Live Sessions: 1000+
- Happy Students: 500+
- Years Experience: 8+
- Satisfaction: 98%

**Required Backend Section Key:** `online_classes_stats`

**Priority:** 🟡 MEDIUM - Stats change over time

---

#### 15. **Features Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/OnlineClasses.tsx` (lines 210-266)

**Hardcoded Features:**
- How it Works
- Who Should Join
- Benefits list (6 items)

**Required Backend Section Key:** `online_classes_features`

**Priority:** 🟢 LOW

---

#### 16. **Online Classes CTA Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/OnlineClasses.tsx` (lines 269-288)

**Priority:** 🟢 LOW

---

### 📄 **Page: Corporate Wellness Page** (`/corporate-yoga`)

#### 17. **Corporate Wellness Hero Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/CorporateWellness.tsx` (lines 63-131)

**Hardcoded Content:**
- Badge: "Corporate Wellness Programs"
- Title: "Transform Your Workplace Through Wellness"
- Description: "On-site and online yoga sessions designed to reduce stress..."
- Stats: 50+ Corporate Clients, 1000+ Sessions, 8+ Years, 96% Satisfaction

**Required Backend Section Key:** `corporate_hero`

**Priority:** 🟡 MEDIUM

---

#### 18. **Corporate Features Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/CorporateWellness.tsx` (lines 43-47, 134-149)

**Hardcoded Features:**
- For HR & Leaders
- Flexible Formats
- Custom for Your Team

**Required Backend Section Key:** `corporate_features`

**Priority:** 🟢 LOW

---

#### 19. **Corporate Benefits Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/CorporateWellness.tsx` (lines 49-56, 152-165)

**Hardcoded Benefits:**
- Reduced stress & anxiety
- Improved team cohesion
- Better communication
- Increased productivity
- Enhanced wellbeing
- Flexible scheduling

**Required Backend Section Key:** `corporate_benefits`

**Priority:** 🟢 LOW

---

#### 20. **Corporate CTA Section**
**Current Status:** Hardcoded content
**Location:** `src/pages/CorporateWellness.tsx` (lines 170-192)

**Priority:** 🟢 LOW

---

### 📄 **Page: Footer** (All Pages)

#### 21. **Footer Content**
**Current Status:** Uses `institute.json` (static file)
**Location:** `src/components/layout/Footer.tsx`

**Hardcoded Content:**
- Description: "Yoga, Zumba, dance and fitness studio in Narnaund..."
- Quick Links: Navigation links (hardcoded)
- Contact info: From institute.json
- Social media: From institute.json
- Copyright: "© 2025 FitPreeti Yog Institute. All rights reserved."

**Required Backend:**
- Contact info: `GET /api/v1/institute-info` ✅ (Already planned)
- Footer description: Could be in institute-info or separate section
- Quick Links: Usually hardcoded (navigation), but description can be CMS

**Priority:** 🟢 LOW - Contact info is high priority, description is low

---

## ❌ Missing Sections (Recommended to Add)

### 1. **Announcements Banner** (Global)
**Priority:** 🟡 MEDIUM
**Suggested Key:** `announcements`

**Use Cases:**
- Special promotions
- New class announcements
- Holiday schedules
- Important notices

**Suggested Location:** After hero section, before main content

---

### 2. **FAQ Section**
**Priority:** 🟡 MEDIUM
**Suggested Key:** `faq`

**Use Cases:**
- Common questions
- Booking process
- Class information
- Pricing queries

**Suggested Locations:**
- Dedicated FAQ page (`/faq`)
- Or accordion section on relevant pages

---

### 3. **Special Offers/Promotions Section**
**Priority:** 🟢 LOW
**Suggested Key:** `offers` or `promotions`

**Use Cases:**
- Discount codes
- Limited-time offers
- Package deals
- Trial class promotions

**Suggested Location:** Home page or dedicated Offers page

---

### 4. **Blog/News Section** (Optional)
**Priority:** 🟢 LOW
**Suggested Key:** `blog_posts` or `news`

**Use Cases:**
- Health tips
- Success stories
- Event announcements
- Educational content

**Suggested Location:** Dedicated Blog page (`/blog`)

---

### 5. **Gallery Section** (Optional)
**Priority:** 🟢 LOW
**Suggested Key:** `gallery`

**Use Cases:**
- Class photos
- Event photos
- Before/after transformations
- Studio images

**Suggested Location:** Dedicated Gallery page (`/gallery`) or About page

---

### 6. **Events Section** (Optional)
**Priority:** 🟢 LOW
**Suggested Key:** `events`

**Use Cases:**
- Workshops
- Special classes
- Community events
- Seasonal programs

**Suggested Location:** Dedicated Events page (`/events`) or Home page

---

## 📊 Priority Summary

### 🔴 HIGH Priority (Implement First)
1. ✅ Contact Information (Institute Info API)
2. Hero Section
3. CTA Section (Home)

### 🟡 MEDIUM Priority (Implement Next)
4. Announcements Banner
5. About Page Hero & Stats
6. About Timeline/Milestones
7. Online Classes Hero & Stats
8. Corporate Wellness Hero

### 🟢 LOW Priority (Nice to Have)
9. All other hero sections
10. Philosophy, Programs sections
11. Features/Benefits sections
12. FAQ Section
13. Other optional sections

---

## 🎯 Implementation Recommendation

### Phase 1: Critical Content (Week 1)
1. **Institute Info API** - Contact information ✅
2. **Hero Section** (`hero`) - Main landing content
3. **CTA Section** (`cta_home`) - Conversion optimization
4. **Announcements** (`announcements`) - Important notices

### Phase 2: Page-Specific Content (Week 2)
5. **About Page Sections** - Hero, Stats, Timeline
6. **Online Classes Hero** - Page-specific hero
7. **Corporate Wellness Hero** - Page-specific hero

### Phase 3: Enhancement (Week 3+)
8. **FAQ Section** - User support
9. **Philosophy & Programs** - About page details
10. **Other optional sections** - As needed

---

## 📝 Notes for Backend Team

1. **Section Keys:** Use descriptive keys like `hero`, `cta_home`, `about_stats`, etc.
2. **Flexible Content:** The `content` JSON field should be flexible to accommodate different structures
3. **Multiple Items:** Sections like `announcements` should support multiple items (array)
4. **Sorting:** Use `order` field for sorting within the same section_key
5. **Active/Inactive:** Use `is_active` flag to show/hide sections without deleting
6. **Soft Delete:** Never hard delete - always use `is_active = false`

---

## 🔗 Related Documentation

- **CMS_API_SPECIFICATION.md** - Complete API specification
- **CMS_API_QUICK_REFERENCE.md** - Quick reference guide
- **CMS_UI_REQUIREMENTS.md** - UI requirements mapping

---

**Last Updated:** 2025-01-XX
**Status:** Ready for Backend Implementation

