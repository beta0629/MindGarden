# Core Solution (MindGarden) Logo Design Spec

## 1. Overview
- **Brand**: Core Solution (Product Brand for MindGarden SaaS)
- **Role**: B2B SaaS Product Identity
- **Relation to Trinity**: Trinity (e-trinity) is the company/operation brand. Core Solution is the product brand. They share a visual lineage but maintain distinct identities.
- **Design System**: B0KlA (Pencil Design Guide)
  - Primary: `var(--mg-color-primary-main)` (#3D5246)
  - Secondary: `var(--mg-color-secondary-main)` (#6B7F72)
  - Accent: `var(--mg-color-accent-main)` (#8B7355)
  - Text: `var(--mg-color-text-main)` (#2C2C2C)
  - Background: `var(--mg-color-background-main)` (#FAF9F7)

## 2. Concepts (v1)

### Concept G1: C+S Geometric Monogram (Finalized Master)
- **Concept**: A modern, geometric monogram combining 'C' and 'S'. It represents the structured, systematic nature of the B2B SaaS solution.
- **Colors**: Primary Green (#3D5246) and Accent Brown (#8B7355).
- **Wordmark**: `CoreSolution` (no space, per `BRAND_DECISIONS_TRINITY_CORESOLUTION.md`)
- **Vibe**: Professional, structured, reliable.

### Concept G2: Abstract Mind/Garden Motif (Rejected)
- **Concept**: An abstract representation of a leaf or neural network (Mind + Garden), symbolizing growth, care, and intelligence.
- **Colors**: Primary Green (#3D5246) and Secondary Green (#6B7F72).
- **Vibe**: Organic, intelligent, nurturing.

### Concept G3: Modern Typographic "Core" (Rejected)
- **Concept**: A bold, typographic approach where the "C" in Core encompasses a central dot (the solution/core).
- **Colors**: Primary Green (#3D5246) and Dark Navy/Black (#2C2C2C).
- **Vibe**: Direct, bold, contemporary.

## 3. Usage Mapping

| Type | Context | Color Profile |
|------|---------|---------------|
| **Primary** | Light backgrounds (Dashboards, Landing Pages) | Green/Accent mark + Dark text (#2C2C2C) |
| **Inverse** | Dark backgrounds (Sidebars, Dark mode) | Green/Accent mark + Light text (#FAF9F7) |
| **Icon** | Avatars, App icons, Collapsed sidebars | Mark only (No wordmark) |
| **Favicon** | Browser tabs | Simplified mark (Optimized for 16x16 / 32x32) |

## 4. Trinity vs Core Solution Placement Guide

| Context | Trinity (e-trinity) | Core Solution (MindGarden) |
|---------|---------------------|----------------------------|
| **Global Header (apply.e-trinity)** | Left-aligned, Primary Logo | N/A |
| **Landing Page Hero** | Footer or "Powered by" mention | Centered or Left-aligned, Hero presence |
| **Pricing Page** | Footer | Main Header |
| **Onboarding Step Panel** | N/A | Top of the panel, Primary Logo |
| **Admin Dashboard** | N/A | Top-left of Sidebar (Inverse Logo) |

## 5. core-coder Handoff Guide

Once a concept is finalized, the SVG assets should be exported and placed in the following directories:

1. **Frontend (MindGarden CRA)** (Optional, if applicable):
   - `frontend/public/assets/logo-core-solution-primary.svg`
   - `frontend/public/assets/logo-core-solution-inverse.svg`
   - `frontend/public/assets/icon-core-solution.svg`
   - `frontend/public/favicon.ico`

2. **Frontend-Trinity (Next.js)**:
   - `frontend-trinity/public/assets/logo-core-solution-primary.svg` (For Welcome, Step 3/5/6, Hero, Powered by)
   - `frontend-trinity/public/assets/logo-core-solution-inverse.svg`
   - `frontend-trinity/public/assets/icon-core-solution.svg`

*Note: Replace existing placeholder logos and update references in `frontend/src/components/` and `frontend-trinity/src/components/`. No code changes are made by the designer agent.*
