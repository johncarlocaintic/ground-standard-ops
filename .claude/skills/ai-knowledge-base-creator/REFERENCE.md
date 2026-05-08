# Knowledge Base Creator for AI Agents - Skill Guide

## Overview

This skill enables you to build clean, factual knowledge bases for AI chatbots and voice agents (Retell AI, GoHighLevel, etc.) that provide contextual information without contaminating system instructions. The KB system supports multiple input methods, automatic validation, multi-format export, and client-specific management.

**Key Principle:** Knowledge bases contain ONLY factual information and FAQs. They never include instructions, commands, or behavioral directives for the AI agent.

---

## Core Components

### 1. Client Intake System
### 2. KB Creator Application  
### 3. Content Validation Engine
### 4. Multi-Format Exporter
### 5. Platform Integration Guides

---

## Part 1: Client Intake Questionnaire

### Purpose
Extract all necessary information from clients upfront to build comprehensive KBs without multiple revision cycles.

### Delivery Formats

**Google Form Version** (for clients to complete independently)
- Best for: Remote onboarding, clients who prefer async communication
- Includes: Help text, examples, conditional logic
- Output: Structured JSON/CSV for import

**Interview Guide PDF** (for discovery calls)
- Best for: Phone/video consultations, complex businesses
- Includes: Follow-up prompts, probing questions
- Output: Note-taking template

### Questionnaire Structure

#### Section 1: Business Fundamentals (Required)

```
BUSINESS IDENTITY
---
Q1. What is your business name?
Q2. What industry/niche are you in? (Salon, Gym, Med Spa, Restaurant, etc.)
Q3. Provide a 2-3 sentence description of your business.
    Example: "We are a luxury hair salon specializing in color treatments and extensions. 
    We serve Beverly Hills clientele and focus on personalized consultations."

LOCATION & HOURS
---
Q4. What is your primary business address?
    - Street Address
    - City, State, ZIP
    - Country

Q5. Do you have multiple locations?
    [ ] Yes → Provide all addresses
    [ ] No

Q6. What are your business hours?
    Monday: ___________
    Tuesday: ___________
    Wednesday: ___________
    Thursday: ___________
    Friday: ___________
    Saturday: ___________
    Sunday: ___________
    
Q7. Are there different hours for different services or seasons?
    [ ] Yes → Explain: ___________
    [ ] No

Q8. What are your holiday closures?
    List specific dates or patterns (e.g., "Closed Christmas Day, New Year's Day")

CONTACT INFORMATION
---
Q9. Primary phone number: ___________
Q10. Secondary phone number (if applicable): ___________
Q11. Email address: ___________
Q12. Website URL: ___________
Q13. Social media handles:
     - Instagram: ___________
     - Facebook: ___________
     - TikTok: ___________
     - Other: ___________
```

#### Section 2: Services & Offerings (Required)

```
CORE SERVICES
---
Q14. List all services you offer. For each service, provide:
     - Service name
     - Brief description (1-2 sentences)
     - Duration
     - Price or price range
     
     Template:
     Service: Women's Haircut
     Description: Customized haircut with styling, includes consultation
     Duration: 60 minutes
     Price: $85-$150 (depends on stylist level)
     
     [Repeat for all services]

Q15. Do you offer packages or bundles?
     [ ] Yes → Describe each package
     [ ] No

Q16. Do you have service tiers or levels (e.g., Junior stylist vs. Master stylist)?
     [ ] Yes → Explain the differences and pricing
     [ ] No

Q17. Are there services you DON'T offer that clients commonly ask about?
     Example: "We don't do children's haircuts" or "We don't offer walk-in services"
     
PRODUCTS
---
Q18. Do you sell products?
     [ ] Yes → List product categories and brands
     [ ] No
     
Q19. Can clients purchase products without booking a service?
     [ ] Yes
     [ ] No
```

#### Section 3: Booking & Appointments (Required)

```
BOOKING PROCESS
---
Q20. How can clients book appointments?
     [ ] Online booking system → Provide URL
     [ ] Phone only
     [ ] Text/SMS
     [ ] Email
     [ ] Social media DM
     [ ] Walk-in
     [ ] Other: ___________

Q21. How far in advance can clients book?
     Example: "Up to 3 months in advance"

Q22. What is your minimum notice for booking?
     Example: "24 hours in advance" or "Same-day appointments available based on availability"

Q23. Do you require deposits?
     [ ] Yes → Amount/percentage: ___________
     [ ] No
     [ ] Only for certain services → Specify: ___________

Q24. Are deposits refundable?
     [ ] Yes → Under what conditions: ___________
     [ ] No
     [ ] Partial → Explain: ___________

CANCELLATION & RESCHEDULING
---
Q25. What is your cancellation policy?
     Example: "24-hour cancellation notice required or 50% fee applies"
     
Q26. How should clients cancel or reschedule?
     [ ] Call/text
     [ ] Through booking system
     [ ] Email
     [ ] Other: ___________

Q27. Is there a fee for late cancellations or no-shows?
     [ ] Yes → Amount: ___________
     [ ] No

Q28. How many times can clients reschedule?
     Example: "Unlimited with proper notice" or "One free reschedule, then deposit required"

WAITLIST & AVAILABILITY
---
Q29. Do you have a waitlist system?
     [ ] Yes → How does it work: ___________
     [ ] No

Q30. What should clients do if their preferred time isn't available?
     Example: "Call us to be added to our cancellation list" or "Check back in 24 hours"
```

#### Section 4: Pricing & Payment (Required)

```
PRICING STRUCTURE
---
Q31. How is pricing determined?
     [ ] Fixed prices
     [ ] Price ranges (by stylist/tech level)
     [ ] Custom quotes (consultation required)
     [ ] Other: ___________

Q32. Do you offer any discounts or promotions?
     [ ] First-time client discount → Amount: ___________
     [ ] Referral discount → Details: ___________
     [ ] Student/Senior/Military discount → Details: ___________
     [ ] Seasonal promotions → Describe: ___________
     [ ] None

Q33. Do your prices include tax and tip?
     [ ] Prices shown include tax
     [ ] Tax added at checkout
     [ ] Tip not included
     [ ] Other: ___________

PAYMENT METHODS
---
Q34. What payment methods do you accept?
     [ ] Cash
     [ ] Credit/Debit cards
     [ ] Mobile payment (Apple Pay, Google Pay)
     [ ] Venmo/Cash App/Zelle
     [ ] Gift certificates
     [ ] Insurance (if applicable)
     [ ] Other: ___________

Q35. When is payment collected?
     [ ] At time of booking (deposit)
     [ ] After service
     [ ] Both
     [ ] Other: ___________
```

#### Section 5: Staff & Expertise (Optional but Recommended)

```
TEAM INFORMATION
---
Q36. How many staff members do you have?
     ___________

Q37. Do you want clients to be able to request specific staff members?
     [ ] Yes → Provide staff names and specialties
     [ ] No → All staff are equally qualified

Q38. Staff specialties (if applicable):
     Name: ___________
     Title/Role: ___________
     Specialties: ___________
     Years of experience: ___________
     Certifications: ___________
     
     [Repeat for each staff member]

Q39. What makes your team unique or qualified?
     Example: "All stylists are certified in Brazilian Blowout" or "Our trainers have 10+ years experience"
```

#### Section 6: Common Questions & Concerns (Required)

```
FREQUENTLY ASKED QUESTIONS
---
Q40. What are the top 10 questions clients ask you?
     List each question and provide the answer you want the AI to give.
     
     Example:
     Q: "Do you do men's haircuts?"
     A: "Yes, we offer men's haircuts starting at $45. Our stylists are experienced with all hair types."
     
     [List all 10 Q&A pairs]

Q41. What are common misconceptions about your services?
     Example: "Clients think we only do luxury services, but we have options starting at $50"

Q42. What questions should clients ask before their first appointment?
     Example: "What should I bring?" or "How should I prepare my hair?"

Q43. What should first-time clients know?
     Example: "Arrive 10 minutes early for paperwork" or "Parking is available in the rear"
```

#### Section 7: Policies & Important Information (Required)

```
ARRIVAL & PREPARATION
---
Q44. How early should clients arrive?
     Example: "10 minutes before appointment time"

Q45. What should clients bring to their appointment?
     Example: "ID, payment method, inspiration photos (for hair services)"

Q46. Is there anything clients should do to prepare?
     Example: "Arrive with clean, dry hair" or "Remove contact lenses before treatment"

Q47. What is your late arrival policy?
     Example: "If you're more than 15 minutes late, we may need to reschedule"

AGE & ACCESSIBILITY
---
Q48. Do you serve children? What is the minimum age?
     [ ] Yes, all ages
     [ ] Yes, minimum age: ___________
     [ ] No

Q49. Do you serve seniors?
     [ ] Yes
     [ ] Yes, with special accommodations: ___________
     [ ] No

Q50. Is your location wheelchair accessible?
     [ ] Yes
     [ ] Partially → Explain: ___________
     [ ] No

Q51. Do you have parking?
     [ ] Yes, free parking
     [ ] Yes, paid parking → Cost: ___________
     [ ] Street parking only
     [ ] No parking available

HEALTH & SAFETY
---
Q52. Are there any health conditions or allergies clients should disclose?
     Example: "Please inform us of any scalp conditions, allergies, or if you're pregnant"

Q53. What is your sanitation/hygiene protocol?
     Example: "All tools are sterilized between clients, disposable supplies are used when possible"

Q54. Do you have a sick policy?
     Example: "If you're feeling unwell, please reschedule at no charge"
```

#### Section 8: Specialized/Industry-Specific (Conditional)

```
FOR SALONS/SPAS
---
Q55. Do you require consultations for certain services?
     [ ] Yes → Which services: ___________
     [ ] No

Q56. Do you offer complimentary services? (e.g., blowout with color)
     [ ] Yes → List: ___________
     [ ] No

Q57. What hair/skin types do you specialize in?
     Example: "All hair types including curly, coily, textured hair"

FOR FITNESS/GYMS
---
Q58. Do you offer free trials or introductory sessions?
     [ ] Yes → Details: ___________
     [ ] No

Q59. What equipment do you have?
     List: ___________

Q60. Do you offer personal training?
     [ ] Yes → Pricing: ___________
     [ ] No

Q61. Are there membership contracts?
     [ ] Yes → Terms: ___________
     [ ] No, month-to-month

FOR RESTAURANTS/FOOD SERVICES
---
Q62. Do you take reservations?
     [ ] Yes → How: ___________
     [ ] No, walk-in only
     [ ] Only for parties of X or more

Q63. What type of cuisine do you serve?
     ___________

Q64. Do you accommodate dietary restrictions?
     [ ] Vegetarian options
     [ ] Vegan options
     [ ] Gluten-free options
     [ ] Allergy-friendly preparations
     [ ] Other: ___________

Q65. Do you offer takeout or delivery?
     [ ] Takeout → Call ___________
     [ ] Delivery → Through: ___________
     [ ] Dine-in only

FOR MEDICAL/PROFESSIONAL SERVICES
---
Q66. Do you accept insurance?
     [ ] Yes → Which providers: ___________
     [ ] No, cash/card only

Q67. Do you require referrals?
     [ ] Yes
     [ ] No

Q68. What should clients bring to their first appointment?
     Example: "Insurance card, ID, list of current medications"
```

#### Section 9: Brand Voice & Restrictions (Required)

```
COMMUNICATION STYLE
---
Q69. How would you describe your brand personality?
     [ ] Professional and formal
     [ ] Friendly and casual
     [ ] Luxurious and sophisticated
     [ ] Fun and energetic
     [ ] Other: ___________

Q70. Are there specific words or phrases you want the AI to use?
     Example: "Say 'guest' instead of 'customer'" or "Always mention 'luxury experience'"

Q71. Are there words or phrases the AI should NEVER use?
     Example: "Don't say 'cheap' or 'discount'" or "Avoid medical terminology"

AI AGENT BOUNDARIES
---
Q72. What should the AI agent NOT do or say?
     Example: "Don't give medical advice" or "Don't quote exact prices for custom services"

Q73. When should the AI transfer to a human?
     Example: "For complaints, custom requests, or urgent matters"

Q74. Are there topics the AI should avoid entirely?
     Example: "Don't discuss competitor businesses" or "Don't offer services we don't provide"
```

#### Section 10: Additional Context (Optional)

```
COMPETITIVE ADVANTAGES
---
Q75. What makes you different from competitors?
     Example: "We use only organic products" or "We're the only gym with a sauna in the area"

Q76. What awards, certifications, or press have you received?
     List: ___________

SEASONAL INFORMATION
---
Q77. Do you have seasonal services or promotions?
     Example: "Summer special on spray tans" or "Holiday gift certificates"

Q78. Are there busy seasons when booking is harder?
     Example: "December and prom season fill up fast"

MISCELLANEOUS
---
Q79. Is there anything else clients frequently ask about that we haven't covered?
     ___________

Q80. Do you have any partnerships or affiliations clients should know about?
     Example: "10% discount at the coffee shop next door with receipt"
```

---

## Part 2: KB Creator Application

### Architecture

```
KB Creator App
├── Client Manager
│   ├── Create new client
│   ├── Switch between clients
│   └── Import/Export client data
├── Input Modules
│   ├── File Upload Processor
│   └── Manual Entry Forms
├── Content Validator
│   ├── Instruction detector
│   ├── Command sanitizer
│   └── Quality checker
├── KB Builder
│   ├── Category organizer
│   ├── Q&A manager
│   └── Metadata editor
└── Export Engine
    ├── Format selector
    ├── Platform templates
    └── Download manager
```

### Build the React Application

Create the following file structure:

```
/kb-creator/
├── index.html
├── App.jsx
├── components/
│   ├── ClientManager.jsx
│   ├── FileUploader.jsx
│   ├── ManualEntryForm.jsx
│   ├── ContentValidator.jsx
│   ├── KBPreview.jsx
│   └── ExportPanel.jsx
├── utils/
│   ├── fileProcessors.js
│   ├── validators.js
│   ├── formatters.js
│   └── exporters.js
└── styles/
    └── app.css
```

### Component Specifications

#### 1. Client Manager Component

**Purpose:** Manage multiple client knowledge bases

**Features:**
- Create new client profile
- Switch between existing clients
- Client metadata (name, industry, created date)
- Import/export client data
- Delete client with confirmation

**Data Structure:**
```javascript
const clientSchema = {
  id: "unique-id",
  name: "Arya Beverly Hills Hair Salon",
  industry: "Hair Salon",
  createdAt: "2024-11-27T00:00:00Z",
  lastModified: "2024-11-27T00:00:00Z",
  knowledgeBase: {
    // KB content here
  }
}
```

#### 2. File Upload Processor Component

**Purpose:** Extract content from uploaded documents

**Supported Formats:**
- `.txt` - Direct text extraction
- `.docx` - Use mammoth.js for conversion
- `.pdf` - Use PDF.js for text extraction
- `.md` - Direct markdown parsing

**Processing Steps:**
1. File validation (size < 10MB, allowed format)
2. Content extraction
3. Text cleaning (remove extra whitespace, special characters)
4. Structure detection (headings, lists, Q&A patterns)
5. Categorization suggestions

**Code Template:**
```javascript
// fileProcessors.js

export async function processTextFile(file) {
  const text = await file.text();
  return cleanText(text);
}

export async function processDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return cleanText(result.value);
}

export async function processPdfFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return cleanText(fullText);
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^\x20-\x7E\n]/g, '')  // Remove non-printable chars
    .trim();
}

export function detectStructure(text) {
  const categories = [];
  const qaPairs = [];
  
  // Detect Q&A patterns
  const qaRegex = /Q:|Question:|A:|Answer:/gi;
  if (qaRegex.test(text)) {
    // Parse Q&A format
    const lines = text.split('\n');
    let currentQ = null;
    
    lines.forEach(line => {
      if (line.match(/Q:|Question:/i)) {
        currentQ = line.replace(/Q:|Question:/i, '').trim();
      } else if (line.match(/A:|Answer:/i) && currentQ) {
        const answer = line.replace(/A:|Answer:/i, '').trim();
        qaPairs.push({ question: currentQ, answer });
        currentQ = null;
      }
    });
  }
  
  // Detect categories (headers)
  const headerRegex = /^#{1,3}\s+(.+)$|^([A-Z][A-Z\s]+)$/gm;
  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    const category = match[1] || match[2];
    categories.push(category.trim());
  }
  
  return { categories, qaPairs };
}
```

#### 3. Manual Entry Form Component

**Purpose:** Structured input for KB information

**Form Categories:**

```javascript
const formCategories = [
  {
    id: 'business-info',
    name: 'Business Information',
    fields: [
      { id: 'business-name', label: 'Business Name', type: 'text', required: true },
      { id: 'industry', label: 'Industry', type: 'select', options: ['Salon', 'Gym', 'Med Spa', 'Restaurant', 'Professional Services', 'Other'], required: true },
      { id: 'description', label: 'Description', type: 'textarea', required: true },
      { id: 'website', label: 'Website URL', type: 'url', required: false }
    ]
  },
  {
    id: 'contact',
    name: 'Contact & Location',
    fields: [
      { id: 'address', label: 'Address', type: 'textarea', required: true },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'hours', label: 'Business Hours', type: 'hours-grid', required: true }
    ]
  },
  {
    id: 'services',
    name: 'Services & Pricing',
    fields: [
      { 
        id: 'services-list', 
        label: 'Services', 
        type: 'repeater',
        subfields: [
          { id: 'service-name', label: 'Service Name', type: 'text' },
          { id: 'service-description', label: 'Description', type: 'textarea' },
          { id: 'duration', label: 'Duration', type: 'text' },
          { id: 'price', label: 'Price', type: 'text' }
        ]
      }
    ]
  },
  {
    id: 'booking',
    name: 'Booking & Policies',
    fields: [
      { id: 'booking-methods', label: 'How to Book', type: 'checkbox-group', options: ['Online', 'Phone', 'Text', 'Email', 'Walk-in'] },
      { id: 'cancellation-policy', label: 'Cancellation Policy', type: 'textarea', required: true },
      { id: 'deposit-required', label: 'Deposit Required?', type: 'radio', options: ['Yes', 'No'] }
    ]
  },
  {
    id: 'faq',
    name: 'FAQs',
    fields: [
      {
        id: 'faq-list',
        label: 'Frequently Asked Questions',
        type: 'repeater',
        subfields: [
          { id: 'question', label: 'Question', type: 'text' },
          { id: 'answer', label: 'Answer', type: 'textarea' }
        ]
      }
    ]
  },
  {
    id: 'staff',
    name: 'Staff & Team',
    fields: [
      {
        id: 'staff-list',
        label: 'Team Members',
        type: 'repeater',
        subfields: [
          { id: 'name', label: 'Name', type: 'text' },
          { id: 'role', label: 'Role/Title', type: 'text' },
          { id: 'specialties', label: 'Specialties', type: 'textarea' },
          { id: 'bio', label: 'Bio', type: 'textarea' }
        ]
      }
    ]
  }
];
```

#### 4. Content Validator Component

**Purpose:** Detect and flag problematic content

**Validation Rules:**

```javascript
// validators.js

export const validationRules = {
  instructionLanguage: {
    name: 'Instruction Language Detected',
    severity: 'error',
    patterns: [
      /\byou must\b/gi,
      /\byou should always\b/gi,
      /\bnever\b.*\bsay\b/gi,
      /\balways\b.*\b(say|tell|respond|answer)\b/gi,
      /\bdon't ever\b/gi,
      /\byour role is to\b/gi,
      /\byou are (a|an)\b.*\b(assistant|agent|bot)\b/gi,
      /\bfollow these (instructions|rules|guidelines)\b/gi,
      /\bif.*then.*\b(say|respond|tell)\b/gi
    ],
    message: 'This text contains instruction-like language that could interfere with the AI agent\'s system prompt. Rewrite as factual information.'
  },
  
  commandStructures: {
    name: 'Command Structures',
    severity: 'warning',
    patterns: [
      /^(when|if)\s+.+,\s+(say|tell|respond|ask)/gi,
      /\b(do|don't)\b.*\b(mention|say|tell)\b/gi
    ],
    message: 'This appears to be a command for the AI agent. Knowledge bases should only contain facts, not instructions.'
  },
  
  imperativeVerbs: {
    name: 'Imperative Verbs',
    severity: 'warning',
    patterns: [
      /^(ensure|make sure|remember|confirm|verify|check)\b/gi
    ],
    message: 'Starts with an imperative verb. Consider rewording as factual statement.'
  },
  
  secondPersonPronouns: {
    name: 'Second-Person Addressing AI',
    severity: 'info',
    patterns: [
      /\byour (response|answer|reply|task|job|role)\b/gi,
      /\byou will\b/gi
    ],
    message: 'Contains second-person references that may be addressing the AI agent. Ensure this is factual information about the business.'
  },
  
  qualityChecks: {
    name: 'Quality Issues',
    severity: 'info',
    patterns: [
      /\b(TBD|TODO|TK|XXX|\?\?\?)\b/gi,
      /\b(insert|add|fill in)\b.*\bhere\b/gi
    ],
    message: 'Contains placeholder text that should be completed before deployment.'
  }
};

export function validateContent(text) {
  const issues = [];
  
  Object.entries(validationRules).forEach(([ruleId, rule]) => {
    rule.patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        matches.forEach(match => {
          issues.push({
            ruleId,
            severity: rule.severity,
            message: rule.message,
            matchedText: match[0],
            position: match.index,
            suggestion: getSuggestion(ruleId, match[0])
          });
        });
      }
    });
  });
  
  return issues;
}

function getSuggestion(ruleId, text) {
  const suggestions = {
    instructionLanguage: {
      'you must': 'Clients are required to...',
      'you should always': 'It is recommended that clients...',
      'never say': 'This information is not shared:',
      'always tell': 'Clients should be informed that...'
    },
    commandStructures: {
      'when someone asks': 'Question: ... Answer: ...',
      'if they mention': 'Regarding [topic]:'
    },
    imperativeVerbs: {
      'ensure that': 'It is required that...',
      'make sure': 'Please note:',
      'remember to': 'Important:'
    }
  };
  
  const ruleSuggestions = suggestions[ruleId] || {};
  for (const [pattern, replacement] of Object.entries(ruleSuggestions)) {
    if (text.toLowerCase().includes(pattern)) {
      return replacement;
    }
  }
  
  return 'Rewrite as a factual statement about the business.';
}

export function sanitizeContent(text) {
  // Auto-fix common issues
  let cleaned = text;
  
  // Remove instruction prefixes
  cleaned = cleaned.replace(/^(You must|You should|Always|Never)\s+/gim, '');
  
  // Convert imperative to declarative
  cleaned = cleaned.replace(/^(Ensure|Make sure|Remember|Confirm)\s+that\s+/gim, '');
  
  // Remove AI-addressing language
  cleaned = cleaned.replace(/your (response|answer|reply|task|job|role)\s+(is|should be)\s+/gi, '');
  
  return cleaned;
}

export function calculateQualityScore(kbData) {
  let score = 0;
  let maxScore = 0;
  
  const checks = {
    hasBusinessInfo: 10,
    hasContactInfo: 10,
    hasServices: 15,
    hasBookingInfo: 10,
    hasFAQs: 15,
    hasPolicies: 10,
    hasStaffInfo: 5,
    hasHours: 10,
    hasMinimumFAQs: 10,  // At least 5 FAQs
    hasServiceDetails: 10, // Services have descriptions and prices
    noValidationErrors: 5
  };
  
  maxScore = Object.values(checks).reduce((a, b) => a + b, 0);
  
  // Check each requirement
  if (kbData.businessInfo?.name) score += checks.hasBusinessInfo;
  if (kbData.contactInfo?.phone && kbData.contactInfo?.address) score += checks.hasContactInfo;
  if (kbData.services?.length > 0) score += checks.hasServices;
  if (kbData.bookingInfo?.methods) score += checks.hasBookingInfo;
  if (kbData.faqs?.length > 0) score += checks.hasFAQs;
  if (kbData.policies?.cancellation) score += checks.hasPolicies;
  if (kbData.staff?.length > 0) score += checks.hasStaffInfo;
  if (kbData.hours) score += checks.hasHours;
  if (kbData.faqs?.length >= 5) score += checks.hasMinimumFAQs;
  
  const servicesWithDetails = kbData.services?.filter(s => s.description && s.price).length || 0;
  if (servicesWithDetails === kbData.services?.length) score += checks.hasServiceDetails;
  
  // Check for validation errors
  const allText = JSON.stringify(kbData);
  const validationIssues = validateContent(allText);
  const errors = validationIssues.filter(issue => issue.severity === 'error');
  if (errors.length === 0) score += checks.noValidationErrors;
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    grade: getGrade(score / maxScore)
  };
}

function getGrade(percentage) {
  if (percentage >= 0.9) return 'A';
  if (percentage >= 0.8) return 'B';
  if (percentage >= 0.7) return 'C';
  if (percentage >= 0.6) return 'D';
  return 'F';
}
```

#### 5. KB Preview Component

**Purpose:** Real-time preview of KB structure and content

**Features:**
- Tabbed view (By Category, Q&A View, Full Text)
- Search functionality
- Token count estimate
- Export preview for each format

#### 6. Export Panel Component

**Purpose:** Generate KB in multiple formats

**Supported Formats:**

##### Format 1: Structured JSON (For APIs)

```javascript
// exporters.js

export function exportAsJSON(kbData) {
  const structured = {
    metadata: {
      clientName: kbData.clientName,
      industry: kbData.industry,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    },
    businessInfo: {
      name: kbData.businessInfo.name,
      description: kbData.businessInfo.description,
      website: kbData.businessInfo.website
    },
    contact: {
      address: kbData.contactInfo.address,
      phone: kbData.contactInfo.phone,
      email: kbData.contactInfo.email,
      hours: kbData.hours
    },
    services: kbData.services.map(service => ({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category
    })),
    policies: {
      booking: kbData.bookingInfo,
      cancellation: kbData.policies.cancellation,
      payment: kbData.policies.payment
    },
    faqs: kbData.faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    })),
    staff: kbData.staff.map(member => ({
      name: member.name,
      role: member.role,
      specialties: member.specialties,
      bio: member.bio
    }))
  };
  
  return JSON.stringify(structured, null, 2);
}
```

##### Format 2: Markdown (Token-Efficient & Readable)

```javascript
export function exportAsMarkdown(kbData) {
  let md = `# ${kbData.businessInfo.name} - Knowledge Base\n\n`;
  
  md += `## Business Information\n\n`;
  md += `**Industry:** ${kbData.industry}\n\n`;
  md += `${kbData.businessInfo.description}\n\n`;
  if (kbData.businessInfo.website) {
    md += `**Website:** ${kbData.businessInfo.website}\n\n`;
  }
  
  md += `## Contact & Location\n\n`;
  md += `**Address:** ${kbData.contactInfo.address}\n\n`;
  md += `**Phone:** ${kbData.contactInfo.phone}\n\n`;
  md += `**Email:** ${kbData.contactInfo.email}\n\n`;
  
  md += `### Business Hours\n\n`;
  Object.entries(kbData.hours).forEach(([day, hours]) => {
    md += `- **${day}:** ${hours}\n`;
  });
  md += `\n`;
  
  md += `## Services\n\n`;
  kbData.services.forEach(service => {
    md += `### ${service.name}\n\n`;
    md += `${service.description}\n\n`;
    md += `- **Duration:** ${service.duration}\n`;
    md += `- **Price:** ${service.price}\n\n`;
  });
  
  md += `## Booking & Policies\n\n`;
  md += `### How to Book\n\n`;
  md += `${kbData.bookingInfo.methods.join(', ')}\n\n`;
  
  md += `### Cancellation Policy\n\n`;
  md += `${kbData.policies.cancellation}\n\n`;
  
  if (kbData.policies.deposit) {
    md += `### Deposit Policy\n\n`;
    md += `${kbData.policies.deposit}\n\n`;
  }
  
  md += `## Frequently Asked Questions\n\n`;
  kbData.faqs.forEach(faq => {
    md += `**Q: ${faq.question}**\n\n`;
    md += `A: ${faq.answer}\n\n`;
  });
  
  if (kbData.staff.length > 0) {
    md += `## Our Team\n\n`;
    kbData.staff.forEach(member => {
      md += `### ${member.name} - ${member.role}\n\n`;
      if (member.specialties) {
        md += `**Specialties:** ${member.specialties}\n\n`;
      }
      if (member.bio) {
        md += `${member.bio}\n\n`;
      }
    });
  }
  
  md += `---\n\n`;
  md += `*Last updated: ${new Date().toLocaleDateString()}*\n`;
  
  return md;
}
```

##### Format 3: XML (For Legacy Systems)

```javascript
export function exportAsXML(kbData) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<knowledgeBase>\n`;
  xml += `  <metadata>\n`;
  xml += `    <clientName>${escapeXML(kbData.clientName)}</clientName>\n`;
  xml += `    <industry>${escapeXML(kbData.industry)}</industry>\n`;
  xml += `    <lastUpdated>${new Date().toISOString()}</lastUpdated>\n`;
  xml += `  </metadata>\n`;
  
  xml += `  <businessInfo>\n`;
  xml += `    <name>${escapeXML(kbData.businessInfo.name)}</name>\n`;
  xml += `    <description>${escapeXML(kbData.businessInfo.description)}</description>\n`;
  xml += `  </businessInfo>\n`;
  
  xml += `  <services>\n`;
  kbData.services.forEach(service => {
    xml += `    <service>\n`;
    xml += `      <name>${escapeXML(service.name)}</name>\n`;
    xml += `      <description>${escapeXML(service.description)}</description>\n`;
    xml += `      <duration>${escapeXML(service.duration)}</duration>\n`;
    xml += `      <price>${escapeXML(service.price)}</price>\n`;
    xml += `    </service>\n`;
  });
  xml += `  </services>\n`;
  
  xml += `  <faqs>\n`;
  kbData.faqs.forEach(faq => {
    xml += `    <faq>\n`;
    xml += `      <question>${escapeXML(faq.question)}</question>\n`;
    xml += `      <answer>${escapeXML(faq.answer)}</answer>\n`;
    xml += `    </faq>\n`;
  });
  xml += `  </faqs>\n`;
  
  xml += `</knowledgeBase>\n`;
  
  return xml;
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

##### Format 4: Plain Text (Universal)

```javascript
export function exportAsPlainText(kbData) {
  let text = `${kbData.businessInfo.name.toUpperCase()}\n`;
  text += `${'='.repeat(kbData.businessInfo.name.length)}\n\n`;
  
  text += `BUSINESS INFORMATION\n`;
  text += `-------------------\n`;
  text += `Industry: ${kbData.industry}\n`;
  text += `Description: ${kbData.businessInfo.description}\n\n`;
  
  text += `CONTACT & LOCATION\n`;
  text += `------------------\n`;
  text += `Address: ${kbData.contactInfo.address}\n`;
  text += `Phone: ${kbData.contactInfo.phone}\n`;
  text += `Email: ${kbData.contactInfo.email}\n\n`;
  
  text += `BUSINESS HOURS\n`;
  text += `--------------\n`;
  Object.entries(kbData.hours).forEach(([day, hours]) => {
    text += `${day}: ${hours}\n`;
  });
  text += `\n`;
  
  text += `SERVICES\n`;
  text += `--------\n`;
  kbData.services.forEach((service, index) => {
    text += `\n${index + 1}. ${service.name}\n`;
    text += `   ${service.description}\n`;
    text += `   Duration: ${service.duration}\n`;
    text += `   Price: ${service.price}\n`;
  });
  text += `\n`;
  
  text += `FREQUENTLY ASKED QUESTIONS\n`;
  text += `--------------------------\n`;
  kbData.faqs.forEach((faq, index) => {
    text += `\nQ${index + 1}: ${faq.question}\n`;
    text += `A: ${faq.answer}\n`;
  });
  
  return text;
}
```

---

## Part 3: Platform Integration Guides

### How to Use KBs with Different AI Platforms

#### Retell AI Integration

**Method 1: Direct Context Injection (Recommended)**

Retell AI allows you to add knowledge base content directly in the "General Prompt" or "Agent Knowledge" section.

```
Step 1: Export KB as Markdown format
Step 2: In Retell AI dashboard → Your Agent → Edit
Step 3: Add a new section in the prompt:

<knowledge_base>
[Paste your Markdown KB here]
</knowledge_base>

Step 4: In the main agent instructions, add:

"Use the information in the <knowledge_base> section to answer factual questions about the business. When asked about hours, services, pricing, or policies, consult the knowledge base first. If information is not in the knowledge base, politely say you don't have that specific information and offer to transfer to a staff member."
```

**Method 2: Custom Function with KB Lookup**

For very large KBs, use Retell's custom functions:

```javascript
// Create a function called "lookup_kb"
{
  "name": "lookup_kb",
  "description": "Look up information from the business knowledge base",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "What to search for in the knowledge base"
      },
      "category": {
        "type": "string",
        "enum": ["services", "hours", "policies", "faq", "staff"],
        "description": "Category to search within"
      }
    },
    "required": ["query"]
  }
}
```

Then host your KB as JSON and have your webhook endpoint return relevant sections.

**Best Practices for Retell AI:**
- Keep KB under 4,000 tokens for optimal performance
- Use clear section headers
- Place KB after role/personality but before task instructions
- Update the KB when business info changes

#### GoHighLevel Integration

**Method 1: Conversation AI Custom Context**

```
Step 1: Export KB as Plain Text or Markdown
Step 2: GoHighLevel → Automation → Conversation AI → Your Bot
Step 3: Scroll to "Custom Context" section
Step 4: Paste your KB in the text area

Format for GHL:
---
Business Name: [Name]
Industry: [Industry]

SERVICES:
- Service 1: Description, Price, Duration
- Service 2: Description, Price, Duration

HOURS:
Monday: 9AM-6PM
Tuesday: 9AM-6PM
[etc...]

FAQs:
Q: Question 1?
A: Answer 1

Q: Question 2?
A: Answer 2
---
```

**Method 2: Custom Values (For Dynamic Lookup)**

For frequently updated info:
- Store services/pricing in GHL Custom Fields
- Use Custom Values in conversation flows
- Update via API when KB changes

**Best Practices for GHL:**
- Use bullet points and clear formatting
- Keep KB under 2,000 words
- Test bot responses after KB updates
- Use custom values for time-sensitive info (pricing, promos)

#### Voiceflow Integration

```
Step 1: Export KB as JSON
Step 2: Voiceflow → Knowledge Base → Import
Step 3: Upload JSON file or paste content
Step 4: Configure retrieval settings:
   - Similarity threshold: 0.7
   - Max chunks: 3
   - Chunk size: 500 tokens

Step 5: In your agent flow, use "Knowledge Base" block to query
```

#### Chatbase Integration

```
Step 1: Export KB as Markdown or upload original documents
Step 2: Chatbase → Sources → Add Source
Step 3: Choose "Text" or "File Upload"
Step 4: Paste or upload KB
Step 5: Click "Train" to index content
Step 6: Chatbase will automatically use KB to answer questions
```

#### Custom API/RAG Systems

For advanced implementations with vector databases:

```javascript
// Format: JSON with embeddings
export function exportForRAG(kbData) {
  const chunks = [];
  
  // Chunk services
  kbData.services.forEach(service => {
    chunks.push({
      id: `service-${service.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'service',
      content: `${service.name}: ${service.description}. Duration: ${service.duration}. Price: ${service.price}.`,
      metadata: {
        category: 'services',
        serviceName: service.name,
        price: service.price
      }
    });
  });
  
  // Chunk FAQs
  kbData.faqs.forEach((faq, index) => {
    chunks.push({
      id: `faq-${index}`,
      type: 'faq',
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      metadata: {
        category: 'faq',
        question: faq.question
      }
    });
  });
  
  // Chunk policies
  chunks.push({
    id: 'policy-cancellation',
    type: 'policy',
    content: `Cancellation Policy: ${kbData.policies.cancellation}`,
    metadata: {
      category: 'policies',
      policyType: 'cancellation'
    }
  });
  
  return {
    chunks,
    metadata: {
      clientName: kbData.clientName,
      totalChunks: chunks.length,
      categories: ['services', 'faq', 'policies']
    }
  };
}
```

**Vector DB Setup (Pinecone/Weaviate):**
1. Convert chunks to embeddings using OpenAI/Cohere
2. Store in vector database with metadata
3. Query with semantic search during conversations
4. Return top 3-5 most relevant chunks

---

## Part 4: Best Practices & Guidelines

### Writing Effective KB Content

#### DO:
✅ **Use declarative, factual statements**
- Good: "Appointments can be booked online at [URL] or by calling [PHONE]."
- Bad: "You should tell them to book online or call us."

✅ **Provide specific, complete information**
- Good: "Haircut services range from $45 (junior stylist) to $120 (master stylist) and include consultation, cut, and style."
- Bad: "We offer haircuts at various prices."

✅ **Organize by user intent**
- Group related info together
- Use clear categories
- Anticipate common questions

✅ **Include edge cases and exceptions**
- "Services are non-refundable except in cases of stylist illness or emergency closures."

✅ **Use consistent terminology**
- If you call them "guests" in marketing, use "guests" in KB (not "customers" or "clients")

#### DON'T:
❌ **Include instructions for the AI**
- Bad: "When asked about pricing, always mention that we offer discounts."
- Good: "First-time clients receive 20% off their first service."

❌ **Use second-person addressing the AI**
- Bad: "Your job is to help book appointments."
- Good: [This belongs in system prompt, not KB]

❌ **Include conditional logic**
- Bad: "If they ask about X, then say Y."
- Good: Create separate Q&A: "Q: [Question about X]? A: [Information Y]"

❌ **Embed commands**
- Bad: "Never mention competitor names."
- Good: [This is a system rule, not knowledge]

❌ **Use vague language**
- Bad: "We're usually open most days."
- Good: "Open Monday-Friday 9AM-6PM, Saturday 10AM-4PM, Closed Sunday."

### Token Optimization Tips

**Problem:** Large KBs can consume valuable context window space.

**Solutions:**

1. **Abbreviate repetitive content**
   ```
   Before (150 tokens):
   "Women's Haircut: A customized haircut with styling. Includes consultation. Duration: 60 minutes. Price: $85-$150.
   Men's Haircut: A customized haircut with styling. Includes consultation. Duration: 45 minutes. Price: $45-$95."
   
   After (80 tokens):
   "Haircuts (includes consultation + styling):
   - Women's: 60min, $85-$150
   - Men's: 45min, $45-$95"
   ```

2. **Use structured formats**
   - Tables use fewer tokens than prose
   - Bullet lists > paragraphs for lists
   - Abbreviations for units (min vs minutes, $ vs dollars)

3. **Remove redundancy**
   - Don't repeat business name in every entry
   - Use "same" or "as above" for duplicate info
   - Consolidate similar FAQs

4. **Prioritize high-value information**
   - Essential: Hours, services, booking process, key policies
   - Important: Pricing, FAQs, contact info
   - Nice-to-have: Staff bios, detailed history, awards

5. **Estimate before deploying**
   ```javascript
   function estimateTokens(text) {
     // Rough estimate: 1 token ≈ 4 characters for English
     return Math.ceil(text.length / 4);
   }
   ```

### Update & Maintenance Workflow

**Weekly:**
- Check for expired/outdated info (seasonal hours, promotions)
- Review new common questions from call logs
- Update pricing if changed

**Monthly:**
- Validate all contact info still accurate
- Add new services or staff
- Remove discontinued services
- Refresh FAQs based on actual customer questions

**Quarterly:**
- Complete KB audit
- Run validation check
- Re-export and re-deploy to all platforms
- Quality score assessment

**Version Control:**
```javascript
// Include in KB metadata
{
  version: "1.3.2",
  lastUpdated: "2024-11-27",
  changelog: [
    {
      version: "1.3.2",
      date: "2024-11-27",
      changes: ["Added holiday hours", "Updated cancellation policy"]
    },
    {
      version: "1.3.1",
      date: "2024-11-15",
      changes: ["New service: Balayage", "Updated stylist bios"]
    }
  ]
}
```

---

## Part 5: Complete Example KB

Here's a fully-built knowledge base for reference:

### Arya Beverly Hills Hair Salon - Complete KB

#### JSON Format:
```json
{
  "metadata": {
    "clientName": "Arya Beverly Hills Hair Salon",
    "industry": "Hair Salon",
    "version": "1.0.0",
    "lastUpdated": "2024-11-27T00:00:00Z",
    "tokenEstimate": 1850
  },
  "businessInfo": {
    "name": "Arya Beverly Hills Hair Salon",
    "description": "A luxury hair salon in Beverly Hills specializing in color treatments, extensions, and precision cuts. We serve discerning clients who value personalized consultations and high-end results.",
    "website": "https://aryabeverlyhills.com",
    "established": "2015",
    "specialties": ["Color treatments", "Hair extensions", "Precision cuts", "Balayage", "Brazilian Blowout"]
  },
  "contact": {
    "address": "123 Rodeo Drive, Beverly Hills, CA 90210",
    "phone": "+1 (310) 555-0123",
    "email": "hello@aryabeverlyhills.com",
    "socialMedia": {
      "instagram": "@aryabeverlyhills",
      "facebook": "AryaBeverlyHills"
    }
  },
  "hours": {
    "monday": "9:00 AM - 7:00 PM",
    "tuesday": "9:00 AM - 7:00 PM",
    "wednesday": "9:00 AM - 7:00 PM",
    "thursday": "9:00 AM - 8:00 PM",
    "friday": "9:00 AM - 8:00 PM",
    "saturday": "10:00 AM - 6:00 PM",
    "sunday": "Closed",
    "holidays": "Closed on major holidays (Christmas, New Year's Day, Thanksgiving)"
  },
  "services": [
    {
      "name": "Women's Haircut",
      "description": "Customized haircut with styling, includes consultation with stylist to determine best cut for your face shape and hair type",
      "duration": "60 minutes",
      "price": "$85-$150",
      "priceNote": "Price varies by stylist level (Junior, Senior, Master)",
      "category": "Cut & Style"
    },
    {
      "name": "Men's Haircut",
      "description": "Precision men's cut with styling, includes consultation and neck cleanup",
      "duration": "45 minutes",
      "price": "$45-$95",
      "category": "Cut & Style"
    },
    {
      "name": "Color Service (Full)",
      "description": "Complete hair coloring service, includes consultation, custom color formulation, application, and toning",
      "duration": "2.5-3 hours",
      "price": "$200-$450",
      "priceNote": "Price depends on hair length and complexity",
      "category": "Color"
    },
    {
      "name": "Balayage/Highlights",
      "description": "Hand-painted highlights for natural, sun-kissed dimension. Includes toning and styling.",
      "duration": "3-4 hours",
      "price": "$250-$550",
      "category": "Color"
    },
    {
      "name": "Hair Extensions",
      "description": "Professional hair extension application using tape-in, keratin bond, or hand-tied methods",
      "duration": "2-4 hours",
      "price": "$600-$2,500",
      "priceNote": "Price includes consultation, does not include hair cost",
      "category": "Extensions"
    },
    {
      "name": "Brazilian Blowout",
      "description": "Smoothing treatment that eliminates frizz and reduces styling time for 8-12 weeks",
      "duration": "2 hours",
      "price": "$350-$450",
      "category": "Treatment"
    },
    {
      "name": "Deep Conditioning Treatment",
      "description": "Intensive moisture treatment for damaged or dry hair",
      "duration": "30 minutes",
      "price": "$45-$75",
      "priceNote": "Can be added to any service",
      "category": "Treatment"
    }
  ],
  "booking": {
    "methods": ["Online booking system", "Phone", "Text message", "Instagram DM"],
    "onlineBookingURL": "https://aryabeverlyhills.com/book",
    "advanceBooking": "Appointments can be booked up to 3 months in advance",
    "minimumNotice": "We recommend booking at least 48 hours in advance, though same-day appointments may be available",
    "depositRequired": true,
    "depositAmount": "$50-$100 depending on service",
    "depositPolicy": "Deposits are required for first-time clients and services over $200. Applied to final service cost."
  },
  "policies": {
    "cancellation": "We require 24-hour notice for cancellations or rescheduling. Cancellations with less than 24 hours notice will forfeit the deposit. No-shows will be charged 50% of the service cost.",
    "lateness": "Please arrive 10 minutes before your appointment time. If you arrive more than 15 minutes late, we may need to reschedule or shorten your service.",
    "payment": "We accept cash, all major credit cards, Apple Pay, and Google Pay. Gratuity is not included in service prices.",
    "firstTimeClients": "First-time clients receive a complimentary consultation before their service. We recommend arriving 15 minutes early to complete intake forms.",
    "children": "We love kids! However, we cannot provide services for children under 12. For children 12-16, parental consent is required.",
    "refunds": "Services are non-refundable once completed. If you're unsatisfied with your service, please speak with your stylist immediately or contact our manager within 7 days for a complimentary adjustment."
  },
  "faqs": [
    {
      "question": "How do I book an appointment?",
      "answer": "You can book online at aryabeverlyhills.com/book, call us at (310) 555-0123, text us, or message us on Instagram @aryabeverlyhills.",
      "category": "Booking"
    },
    {
      "question": "Do you take walk-ins?",
      "answer": "We operate by appointment only to ensure each client receives dedicated time and attention. However, if we have a last-minute opening, we're happy to accommodate walk-ins when possible.",
      "category": "Booking"
    },
    {
      "question": "How far in advance should I book?",
      "answer": "For popular stylists and weekend appointments, we recommend booking 2-4 weeks in advance. Weekday appointments often have more availability with 1-2 weeks notice.",
      "category": "Booking"
    },
    {
      "question": "What is your cancellation policy?",
      "answer": "We require 24-hour notice for cancellations. Late cancellations result in forfeited deposits, and no-shows are charged 50% of the service cost.",
      "category": "Policies"
    },
    {
      "question": "Do I need a consultation before my first appointment?",
      "answer": "First-time clients receive a complimentary consultation as part of their service. For complex services like extensions or major color changes, we recommend scheduling a separate 15-minute consultation beforehand.",
      "category": "Services"
    },
    {
      "question": "What should I bring to my appointment?",
      "answer": "Please bring inspiration photos if you have a specific look in mind, and arrive with clean, dry hair unless your service includes a wash. First-time clients should arrive 15 minutes early for paperwork.",
      "category": "Appointments"
    },
    {
      "question": "Can I request a specific stylist?",
      "answer": "Absolutely! When booking, you can select your preferred stylist. Each stylist has different specialties and experience levels, which is reflected in pricing.",
      "category": "Staff"
    },
    {
      "question": "Do you offer color consultations?",
      "answer": "Yes, we offer complimentary 15-minute color consultations. This is recommended for first-time color clients or those considering a major change.",
      "category": "Services"
    },
    {
      "question": "How long do hair extensions last?",
      "answer": "Tape-in extensions last 6-8 weeks before needing repositioning. Keratin bonds last 3-4 months. Hand-tied wefts last 6-8 weeks. All methods require proper home care.",
      "category": "Services"
    },
    {
      "question": "What is your parking situation?",
      "answer": "We have valet parking available ($10), or street parking is available nearby. There's also a public parking structure two blocks east on Canon Drive.",
      "category": "Location"
    },
    {
      "question": "Do you sell hair products?",
      "answer": "Yes, we carry professional-grade products from brands including Olaplex, Kevin Murphy, and R+Co. Your stylist can recommend products based on your hair needs.",
      "category": "Products"
    },
    {
      "question": "What payment methods do you accept?",
      "answer": "We accept cash, all major credit cards (Visa, Mastercard, Amex, Discover), Apple Pay, and Google Pay. We cannot accept checks.",
      "category": "Payment"
    },
    {
      "question": "Is gratuity included in the price?",
      "answer": "No, gratuity is not included in service prices. Tips are appreciated and can be added to your card payment or given in cash.",
      "category": "Payment"
    },
    {
      "question": "Can I bring my child to my appointment?",
      "answer": "We understand childcare can be challenging! However, for safety and to maintain a peaceful environment for all clients, we ask that you arrange childcare. We cannot provide services to children under 12.",
      "category": "Policies"
    },
    {
      "question": "Do you do men's color?",
      "answer": "Yes! We offer color services for all genders, including gray coverage, highlights, and fashion colors.",
      "category": "Services"
    }
  ],
  "staff": [
    {
      "name": "Sarah Chen",
      "role": "Master Stylist & Owner",
      "specialties": "Color specialist, Balayage expert, Extensions",
      "experience": "15 years",
      "bio": "Sarah opened Arya in 2015 after training in Paris and New York. She specializes in lived-in color and hand-tied extensions.",
      "certifications": ["Redken Master Colorist", "Brazilian Blowout Certified"]
    },
    {
      "name": "Marcus Rodriguez",
      "role": "Senior Stylist",
      "specialties": "Precision cutting, Men's grooming, Razor cuts",
      "experience": "8 years",
      "bio": "Marcus brings editorial experience from working with fashion photographers. Known for architectural cuts and modern men's styles.",
      "certifications": ["Vidal Sassoon Trained"]
    },
    {
      "name": "Lily Nakamura",
      "role": "Senior Stylist",
      "specialties": "Asian hair specialist, Keratin treatments, Styling",
      "experience": "10 years",
      "bio": "Lily specializes in working with Asian hair textures and is our go-to for special event styling.",
      "certifications": ["Brazilian Blowout Certified", "Olaplex Trained"]
    },
    {
      "name": "David Kim",
      "role": "Junior Stylist",
      "specialties": "Cuts, Color, Blowouts",
      "experience": "3 years",
      "bio": "David recently joined our team after completing his cosmetology degree. He offers quality services at accessible prices.",
      "certifications": ["California Cosmetology License"]
    }
  ],
  "additionalInfo": {
    "awards": [
      "Best of Beverly Hills 2023 - Hair Salon",
      "Top Rated on Yelp (4.8 stars)",
      "Featured in LA Magazine 2022"
    ],
    "features": [
      "Complimentary beverages (coffee, tea, wine)",
      "Free WiFi",
      "Luxury hair care product boutique",
      "Private styling suites available"
    ],
    "accessibility": "Wheelchair accessible entrance and restrooms",
    "parking": "Valet parking available ($10) or street parking nearby"
  }
}
```

#### Markdown Format (for Retell AI):

```markdown
# Arya Beverly Hills Hair Salon - Knowledge Base

## Business Overview

**Industry:** Luxury Hair Salon  
**Established:** 2015  
**Specialties:** Color treatments, Hair extensions, Precision cuts, Balayage, Brazilian Blowout

Arya Beverly Hills is a luxury hair salon specializing in color treatments, extensions, and precision cuts. We serve discerning clients who value personalized consultations and high-end results.

## Contact & Location

**Address:** 123 Rodeo Drive, Beverly Hills, CA 90210  
**Phone:** (310) 555-0123  
**Email:** hello@aryabeverlyhills.com  
**Website:** https://aryabeverlyhills.com  
**Instagram:** @aryabeverlyhills

### Business Hours
- Monday-Wednesday: 9:00 AM - 7:00 PM
- Thursday-Friday: 9:00 AM - 8:00 PM
- Saturday: 10:00 AM - 6:00 PM
- Sunday: Closed
- Closed on major holidays (Christmas, New Year's Day, Thanksgiving)

## Services & Pricing

### Cut & Style
- **Women's Haircut**: $85-$150 | 60min | Customized cut + styling with consultation
- **Men's Haircut**: $45-$95 | 45min | Precision cut with styling + neck cleanup

### Color Services
- **Full Color**: $200-$450 | 2.5-3hrs | Complete coloring with custom formulation + toning
- **Balayage/Highlights**: $250-$550 | 3-4hrs | Hand-painted highlights with toning + styling

### Extensions
- **Hair Extensions**: $600-$2,500 | 2-4hrs | Tape-in, keratin bond, or hand-tied methods
  - Note: Price includes application consultation, hair cost separate

### Treatments
- **Brazilian Blowout**: $350-$450 | 2hrs | Frizz-eliminating smoothing treatment (lasts 8-12 weeks)
- **Deep Conditioning**: $45-$75 | 30min | Intensive moisture treatment (add to any service)

*Prices vary by stylist level: Junior, Senior, Master*

## Booking & Appointments

**How to Book:**
- Online: https://aryabeverlyhills.com/book
- Phone: (310) 555-0123
- Text message
- Instagram DM: @aryabeverlyhills

**Booking Guidelines:**
- Book up to 3 months in advance
- Recommended: 48 hours notice (same-day may be available)
- Deposits: $50-$100 required for first-time clients and services over $200
- Walk-ins: By appointment only, but we accommodate when possible

## Policies

### Cancellation Policy
24-hour notice required. Late cancellations forfeit deposit. No-shows charged 50% of service cost.

### Lateness Policy
Arrive 10 minutes early. More than 15 minutes late may require rescheduling or shortened service.

### Payment
Accept: Cash, all major credit cards, Apple Pay, Google Pay. Gratuity not included.

### First-Time Clients
Complimentary consultation included. Arrive 15 minutes early for intake forms.

### Age Policy
Services for ages 12+ only (parental consent required for ages 12-16).

### Refund Policy
Services non-refundable once completed. Unsatisfied? Contact manager within 7 days for complimentary adjustment.

## Frequently Asked Questions

**Q: How do I book an appointment?**  
A: Book online at aryabeverlyhills.com/book, call (310) 555-0123, text us, or message @aryabeverlyhills on Instagram.

**Q: Do you take walk-ins?**  
A: We operate by appointment only, but can accommodate walk-ins if we have last-minute openings.

**Q: How far in advance should I book?**  
A: For popular stylists/weekends, book 2-4 weeks ahead. Weekdays often available with 1-2 weeks notice.

**Q: What is your cancellation policy?**  
A: 24-hour notice required. Late cancellations forfeit deposits; no-shows charged 50% of service cost.

**Q: Do I need a consultation?**  
A: First-time clients get complimentary consultation with service. For extensions or major color changes, book separate 15-min consultation.

**Q: What should I bring?**  
A: Bring inspiration photos if desired. Arrive with clean, dry hair unless service includes wash. First-timers: arrive 15 minutes early for paperwork.

**Q: Can I request a specific stylist?**  
A: Yes! Select your preferred stylist when booking. Stylists have different specialties and experience levels reflected in pricing.

**Q: Do you offer color consultations?**  
A: Yes, complimentary 15-minute color consultations available. Recommended for first-time color clients or major changes.

**Q: How long do extensions last?**  
A: Tape-in: 6-8 weeks. Keratin bonds: 3-4 months. Hand-tied: 6-8 weeks. All require proper home care.

**Q: What about parking?**  
A: Valet parking available ($10). Street parking nearby. Public structure two blocks east on Canon Drive.

**Q: Do you sell products?**  
A: Yes! We carry Olaplex, Kevin Murphy, and R+Co. Your stylist can recommend products for your hair needs.

**Q: What payment methods?**  
A: Cash, all major credit cards, Apple Pay, Google Pay. No checks.

**Q: Is tip included?**  
A: No, gratuity not included in prices. Tips appreciated (add to card or give cash).

**Q: Can I bring my child?**  
A: For safety and peaceful environment, please arrange childcare. We cannot service children under 12.

**Q: Do you do men's color?**  
A: Yes! We offer color for all genders: gray coverage, highlights, fashion colors.

## Our Team

### Sarah Chen - Master Stylist & Owner
**Specialties:** Color specialist, Balayage expert, Extensions  
**Experience:** 15 years  
Sarah opened Arya in 2015 after training in Paris and New York. Specializes in lived-in color and hand-tied extensions.

### Marcus Rodriguez - Senior Stylist
**Specialties:** Precision cutting, Men's grooming, Razor cuts  
**Experience:** 8 years  
Brings editorial experience from fashion photography. Known for architectural cuts and modern men's styles.

### Lily Nakamura - Senior Stylist
**Specialties:** Asian hair specialist, Keratin treatments, Styling  
**Experience:** 10 years  
Specializes in Asian hair textures. Go-to stylist for special event styling.

### David Kim - Junior Stylist
**Specialties:** Cuts, Color, Blowouts  
**Experience:** 3 years  
Recently joined after cosmetology degree. Offers quality services at accessible prices.

## Additional Information

**Awards:**
- Best of Beverly Hills 2023 - Hair Salon
- Top Rated on Yelp (4.8 stars)
- Featured in LA Magazine 2022

**Amenities:**
- Complimentary beverages (coffee, tea, wine)
- Free WiFi
- Luxury product boutique
- Private styling suites available
- Wheelchair accessible

---
*Last updated: November 27, 2024 | Version 1.0.0*
```

---

## Part 6: Implementation Checklist

Use this checklist when creating a KB for a new client:

### Pre-Build Phase
- [ ] Send client intake questionnaire
- [ ] Schedule discovery call (if needed)
- [ ] Receive completed questionnaire or interview notes
- [ ] Gather any existing documents (website, brochures, menus)
- [ ] Clarify ambiguous information

### Build Phase
- [ ] Create client profile in KB Creator
- [ ] Upload any documents for processing
- [ ] Complete manual entry forms (all required sections)
- [ ] Review auto-extracted content for accuracy
- [ ] Organize into logical categories
- [ ] Write/refine FAQs based on common questions
- [ ] Add staff information (if applicable)

### Validation Phase
- [ ] Run content validator
- [ ] Fix all "error" severity issues
- [ ] Review "warning" severity issues
- [ ] Calculate quality score (target: 85%+)
- [ ] Check token count (target: <3,000 tokens)
- [ ] Preview in all export formats

### Client Review Phase
- [ ] Export preview version (Markdown recommended)
- [ ] Send to client for approval
- [ ] Collect feedback and corrections
- [ ] Make revisions
- [ ] Get final sign-off

### Deployment Phase
- [ ] Export in required format(s) for target platform(s)
- [ ] Upload/inject KB into AI agent(s)
- [ ] Test agent responses with sample questions
- [ ] Verify accuracy of key information
- [ ] Make any final adjustments
- [ ] Document version and deployment date

### Post-Deployment
- [ ] Set calendar reminders for updates (monthly minimum)
- [ ] Provide client with update instructions
- [ ] Monitor agent conversations for gaps in KB
- [ ] Collect new FAQs from actual customer questions
- [ ] Schedule quarterly comprehensive review

---

## Part 7: Troubleshooting Common Issues

### Issue: AI Agent Ignores KB Content

**Symptoms:**
- Agent gives incorrect information
- Agent says "I don't have that information" when it's in the KB

**Solutions:**
1. Check KB placement in prompt (should be after role, before tasks)
2. Verify KB format is supported by platform
3. Ensure KB is within token limits
4. Add explicit instruction: "Consult the knowledge base before answering factual questions"
5. For Retell AI: Use `<knowledge_base>` tags
6. Test with simple factual question (e.g., "What are your hours?")

### Issue: Agent Treats KB as Instructions

**Symptoms:**
- Agent starts behaving differently
- Agent mentions "you told me to" or references the KB as commands

**Solutions:**
1. Run content validator on KB
2. Remove any instruction-like language
3. Sanitize content using sanitizer function
4. Separate KB from system prompt entirely
5. Frame KB clearly: "The following is factual information about the business, not instructions"

### Issue: Token Limits Exceeded

**Symptoms:**
- KB gets truncated
- Agent can't see full KB
- Platform shows "context too long" error

**Solutions:**
1. Optimize KB using token reduction techniques
2. Remove redundant information
3. Use abbreviations and structured formats
4. Split KB into multiple smaller KBs by category
5. Use RAG/vector search instead of full KB injection
6. Prioritize essential information only

### Issue: Outdated Information

**Symptoms:**
- Agent gives old pricing
- Hours/services no longer accurate
- Client complains about incorrect info

**Solutions:**
1. Implement update schedule (weekly/monthly)
2. Version control system
3. Quick-update process for time-sensitive changes
4. Automated alerts for expiring promotions
5. Client notification system for needed updates

### Issue: Inconsistent Answers

**Symptoms:**
- Agent gives different answers to same question
- Information conflicts within KB

**Solutions:**
1. Search KB for duplicate/conflicting information
2. Consolidate related FAQs
3. Use consistent terminology throughout
4. Create single source of truth for each data point
5. Review KB for logical consistency

---

## Summary

You now have everything needed to build professional knowledge bases for AI agents:

1. **Client Intake Questionnaire** - Comprehensive 80-question form to extract all necessary information upfront
2. **KB Creator Application** - React app with file upload, manual entry, validation, and multi-format export
3. **Content Validation System** - Automatic detection of instruction-like language and quality scoring
4. **Multi-Format Export** - JSON, Markdown, XML, Plain Text outputs optimized for different platforms
5. **Platform Integration Guides** - Step-by-step instructions for Retell AI, GoHighLevel, Voiceflow, Chatbase
6. **Best Practices** - Writing guidelines, token optimization, maintenance workflows
7. **Complete Example** - Full reference KB for a hair salon
8. **Implementation Checklist** - Step-by-step process for creating client KBs
9. **Troubleshooting Guide** - Solutions to common issues

**Next Steps:**
1. Build the React application using the component specifications provided
2. Customize the client intake questionnaire for your specific needs
3. Create your first KB using the Arya example as a template
4. Test integration with your target AI platforms
5. Iterate based on real-world usage

The key principle to remember: **Knowledge bases are pure information repositories, completely separate from AI instructions.** This architectural separation ensures clean, maintainable, and effective AI agent knowledge management.
