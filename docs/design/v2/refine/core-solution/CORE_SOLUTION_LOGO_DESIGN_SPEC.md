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

## 2. Concepts (v1 - All Rejected)

### Concept G1: C+S Geometric Monogram (Rejected)
- **Status**: Rejected. The user did not select this concept.
- **Concept**: A modern, geometric monogram combining 'C' and 'S'.

### Concept G2: Abstract Mind/Garden Motif (Rejected)
- **Status**: Rejected.
- **Concept**: An abstract representation of a leaf or neural network (Mind + Garden).

### Concept G3: Modern Typographic "Core" (Rejected)
- **Status**: Rejected.
- **Concept**: A bold, typographic approach where the "C" in Core encompasses a central dot.

## 2.1 Concepts (v2 - Pending Selection)

### Concept H1: Platform & Core (Nexus)
- **Concept**: A solid horizontal base (platform) with a geometric core resting on it. Represents the stability and connectivity of a multi-tenant SaaS.
- **Colors**: Primary Green (#3D5246), Accent Brown (#8B7355), and Background (#FAF9F7).
- **Wordmark**: `CoreSolution` (no space)
- **Vibe**: Calm, professional, foundational.

### Concept H2: Shield & Layers
- **Concept**: Overlapping geometric shield shapes forming a central core. Represents security, layers of data, and B2B reliability.
- **Colors**: Primary Green (#3D5246), Secondary Green (#6B7F72), and Accent Brown (#8B7355).
- **Wordmark**: `CoreSolution` (no space)
- **Vibe**: Secure, layered, trustworthy.

### Concept H3: Data Flow (Horizontal Rule)
- **Concept**: Horizontal data streams converging into a central processor/core. Maintains a visual lineage with Trinity F1's horizontal rule wordmark while being distinctly product-focused.
- **Colors**: Primary Green (#3D5246), Secondary Green (#6B7F72), and Accent Brown (#8B7355).
- **Wordmark**: `CoreSolution` (no space)
- **Vibe**: Modern, data-driven, systematic.

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
