# CCS Connect

CCS Connect is a centralized digital platform for modern campus communication, assistance, navigation, and service coordination within the College of Computer Studies environment.

Campus service workflows often become inefficient when announcements, messages, technical assistance, room guidance, and administrative requests are spread across disconnected channels. Traditional processes usually depend on manual routing, paper-based approvals, informal messaging groups, and delayed follow-ups. This fragmentation makes it harder for students to find the right office, for faculty to reach the right audience, for IT Support to respond quickly, and for administrators to maintain a clear operational view of campus activity.

CCS Connect addresses these gaps through a single web and mobile-ready system. It brings authentication, role-based access, messaging, notifications, assistance tracking, indoor navigation, analytics, and mobile app support into one coordinated platform. The result is a more accessible, responsive, and structured digital experience for students, faculty, IT Support personnel, and administrators.

## Table of Contents

- [System Overview](#system-overview)
- [Core Capabilities](#core-capabilities)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Security Model](#security-model)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Mobile Build Workflow](#mobile-build-workflow)
- [Database and Supabase Setup](#database-and-supabase-setup)
- [Deployment](#deployment)
- [Project Status](#project-status)
- [Future Roadmap](#future-roadmap)

## System Overview

CCS Connect is a platform-oriented campus service application designed for the operational needs of the College of Computer Studies. It provides a unified interface for authenticated users to communicate, receive announcements, request support, navigate campus spaces, manage profiles, and access role-specific services.

The system is intended for four primary audiences:

- **Students**, who need access to announcements, messaging, assistance requests, indoor navigation, notifications, and account services.
- **Faculty**, who need controlled communication tools, student-facing announcements, messaging, and access to approved campus services.
- **IT Support**, who need a dedicated queue for technical assistance requests and the ability to update request status.
- **Administrators**, who need tools for user approval, role management, institutional announcements, document review, analytics, and operational oversight.

The platform supports a responsive web application and a Capacitor-based mobile application structure for Android, with an iOS project structure included for future native deployment. It was developed to reduce communication delays, improve request visibility, support mobile-first access, and consolidate campus service interactions into a single controlled environment.

## Core Capabilities

### Authentication System

CCS Connect includes a complete authentication workflow backed by Supabase Authentication and application-level profile records. Users can register, sign in, maintain persistent sessions, and manage their profile information after account approval.

Registration supports role-aware onboarding for student and faculty users, including profile details and supporting document uploads where required. Newly registered accounts pass through an approval workflow before they can access the authenticated application area. This allows administrators to verify users before granting access to campus services.

Authentication features include:

- User registration through the application interface.
- Login through Supabase Authentication.
- Persistent sessions for web and native mobile contexts.
- Account approval and rejection workflow.
- Profile hydration from Supabase profile records.
- Role-based application routing.
- Profile editing and account settings.
- Online status and profile visibility preferences.

### User Roles

CCS Connect organizes access around four operational roles. Each role receives a different experience based on its responsibilities.

#### Student

Students can access the main dashboard, messaging, notifications, indoor navigation, profile management, help and support pages, and assistance request submission. Students can communicate with other approved users where messaging is available and can track the status of their submitted assistance requests.

#### Faculty

Faculty users can access standard user functionality, messaging, notifications, profile management, and faculty announcement tools. The faculty announcement workflow is designed for student-facing announcements and is constrained by database policies.

#### IT Support

IT Support users have access to the IT Support dashboard, where submitted assistance requests can be reviewed, tracked, and updated. IT Support can change request states such as pending, in progress, resolved, or rejected/closed, and can notify requesters about updates.

#### Admin

Administrators have access to the administrative dashboard, account approval tools, role management, document review, announcement management, analytics, and platform oversight features. Admin routes are separated in the application and backed by Supabase role checks where database policies are present.

### Messaging System

The messaging system supports direct conversations, group conversations, real-time updates, and notification integration. Users can compose new messages, open conversation threads, view message histories, and participate in group chat flows.

Implemented messaging capabilities include:

- Direct user-to-user conversations.
- Group chat conversations.
- Conversation member management during compose flows.
- Real-time message list refresh through Supabase channels.
- Online status indicators based on profile presence data.
- Message notification creation through a Supabase RPC workflow.
- Admin messaging support through the same conversation infrastructure.

### Notification System

CCS Connect includes both in-app and mobile-oriented notification flows. Notifications are used for announcements, assistance updates, message alerts, and operational communication.

Notification capabilities include:

- In-app notification list.
- Notification categories and filtering.
- Message notification integration.
- Assistance-related notifications.
- Announcement delivery.
- Read and unread state handling.
- Realtime notification refresh.
- Mobile local notification support through Capacitor.
- Android notification channel configuration.
- Background-style polling support for Android local notifications.

The mobile implementation includes safe platform checks so browser mode can continue operating when native notification APIs are unavailable.

### Complaint and Request Management

The current codebase focuses on structured assistance request handling. This request workflow covers many operational complaint scenarios, particularly technical issues, equipment problems, software concerns, internet issues, and laboratory-related incidents.

The request workflow supports:

- Request submission by approved users.
- Title, category, description, location, priority, and optional evidence.
- Request tracking by the submitting user.
- IT Support review and status updates.
- Administrative visibility through analytics and request data.
- Notification generation when new requests are submitted or updated.

A dedicated standalone complaints module is not currently separated from the assistance workflow in this repository. Complaint-style tracking is represented through the assistance request system and analytics surfaces.

### Assistance Request System

The assistance module is designed to route operational and technical concerns to IT Support. Students, faculty, and administrators can file requests with contextual information, while IT Support users manage the support queue.

Supported request categories include system or application errors, broken computers, internet issues, peripheral problems, software issues, hardware problems, laboratory equipment issues, and other technical concerns.

Assistance features include:

- Assistance request form.
- Priority assignment.
- Optional location or room information.
- Optional image evidence upload.
- Request history for the requester.
- Status lifecycle management.
- IT Support dashboard.
- Requester notifications after updates.
- Analytics integration.

### Indoor Navigation System

CCS Connect includes an interactive indoor navigation experience for St. Benedict Hall and CCS-related spaces. The map is implemented as a custom SVG-based interface with multi-floor data, categorized rooms, clickable room areas, search, filters, route visualization, and mobile gesture support.

Indoor map capabilities include:

- Multi-floor room layouts.
- SVG-rendered indoor maps.
- Interactive room selection.
- Category-based room coloring.
- Search across rooms, laboratories, offices, facilities, and floors.
- Room category filtering.
- Selected-room details.
- Route lines, arrows, and route dots.
- Current-location pin support.
- Elevator and staircase transition handling.
- Floor picker.
- 3D-inspired tilt and rotation visuals.
- Touch-friendly zoom, pan, rotation, and two-finger tilt gestures.
- Voice route guidance with browser speech synthesis and Android native TTS fallback.

The repository does not currently include a dedicated QR scanner or checkpoint verification module. The map data and navigation model can be extended for QR checkpoint support in a future iteration.

### Mobile Application Features

The mobile layer uses Capacitor to package the Vite web application into native app projects. Android support is actively represented in the repository, while the iOS structure is present for future build and deployment work.

Mobile-focused capabilities include:

- Capacitor Android project.
- Capacitor iOS project structure.
- Native Android local notification support.
- Android text-to-speech bridge for route guidance.
- Android file sharing support for analytics exports.
- Pull-to-refresh gesture for mobile app data refresh.
- Responsive layouts for small screens.
- Touch-compatible indoor map controls.
- Native-feeling interaction patterns.
- App icon and notification icon assets.

### Analytics Dashboard

The admin analytics dashboard gives administrators a consolidated view of platform activity. It aggregates user, notification, message, and assistance request data, then presents them through charts and summary cards.

Analytics capabilities include:

- User account statistics.
- Announcement and notification activity.
- Message volume tracking.
- Assistance request counts.
- Assistance status distribution.
- Assistance category and priority breakdowns.
- Time period filtering by date, week, month, year, or custom range.
- Charts powered by Recharts.
- Excel workbook export.
- Android-compatible export sharing through the native bridge.

### UI and User Experience

CCS Connect uses a mobile-first interface with responsive layouts, bottom navigation, role-aware screens, theme handling, and interaction patterns optimized for both browser and mobile app usage.

UI and UX capabilities include:

- Responsive web layout.
- Mobile-first navigation.
- Light mode and dark mode support.
- Branded CCS color palette.
- Interactive transitions and animations.
- Touch-friendly controls.
- Accessible labels on key interactive elements.
- Profile avatars and fallback initials.
- Toast feedback for important actions.
- Dedicated screens for settings, security, legal pages, and help.

### Help and Support Pages

The application includes supporting pages for user guidance and institutional documentation. These pages help users understand how to use the assistance workflow, navigation tools, account services, and platform policies.

Included support surfaces:

- Help and support page.
- Security settings page.
- Notification settings page.
- Privacy policy page.
- Terms and conditions page.

## Technology Stack

### Frontend

- **React** for the application interface.
- **TypeScript** for typed application development.
- **Vite** for development and production builds.
- **React Router** for route management.
- **Recharts** for analytics visualization.
- **Lucide React** for application icons.
- **Motion** for interface transitions.

### Styling and UI

- **Tailwind CSS** and project-level CSS files for styling.
- **Radix UI primitives** for accessible interaction components.
- **Material UI packages** where applicable.
- **Custom CCS theme system** for brand colors, fonts, spacing, shadows, and responsive styling.

### Backend and Database

- **Supabase Authentication** for user sign-up, login, and session handling.
- **Supabase Postgres** for application data.
- **Supabase Row Level Security** for database access control.
- **Supabase Storage** for uploaded documents, profile assets, announcement images, and assistance evidence.
- **Supabase RPC functions** for selected server-side workflows.

### Realtime

- **Supabase Realtime** channels for live message, notification, assistance, and analytics updates.
- Client-side listeners for unread counts, conversation refresh, notifications, and dashboard updates.

### Mobile

- **Capacitor** for native Android and iOS project generation.
- **Capacitor Android** for the Android app shell.
- **Capacitor iOS** for the iOS app structure.
- **Capacitor Local Notifications** for native notification delivery.
- **Capacitor Preferences** for native session persistence.
- Native Android bridge code for local notifications, text-to-speech, and export sharing.

### Deployment and Tooling

- **Vercel-compatible Vite build output** for web deployment.
- **Gradle** and Android Studio for Android builds.
- **Capacitor Assets** for icon and splash generation.
- **Supabase migrations** for database policy and schema evolution.

## System Architecture

CCS Connect follows a client-driven architecture backed by Supabase services.

### Frontend Layer

The frontend is a React application built with Vite. It manages routing, screen rendering, form handling, realtime subscriptions, theme state, and platform-specific behavior. The same frontend codebase is used for the web deployment and the Capacitor mobile shell.

### Backend Layer

Supabase provides authentication, database access, storage, and realtime infrastructure. Application screens interact with Supabase through the JavaScript client. Sensitive database operations are intended to be controlled through Row Level Security policies and selected RPC functions.

### Database Layer

Postgres tables store profiles, notifications, assistance requests, message-related records, and other platform data. The repository includes Supabase migration files that define policies for profiles, storage, announcements, assistance requests, and message notification helpers.

### Mobile Layer

Capacitor wraps the web application in native Android and iOS projects. Android includes additional native code for local notifications, file sharing, text-to-speech, and background-style notification polling. Platform checks are used so browser execution does not depend on native-only APIs.

### Notification Flow

Notifications can originate from announcements, message activity, or assistance request events. They are stored in Supabase, displayed in the in-app notification center, counted for unread badge state, and surfaced as mobile local notifications when native support is available.

### Realtime Communication Flow

Supabase realtime channels notify the client when relevant rows change. The application uses these events to refresh messages, notifications, unread counts, assistance queues, and analytics data without requiring a full page reload.

## Security Model

CCS Connect uses several security-oriented mechanisms, but the system should not be considered fully hardened without a production security review and policy verification.

Current security controls include:

- Supabase Authentication for identity management.
- Role-based application routing.
- Account approval before authenticated app access.
- Profile-based role and status checks.
- Row Level Security policies for several database areas.
- Storage policies for user-owned upload paths.
- Admin-only and role-specific dashboard routes.
- Notification ownership fields such as recipient and target role.
- Session persistence through Supabase client storage.

Security-sensitive areas that require continued review include database policies, messaging access control, file upload validation, native mobile bridge exposure, mobile token storage, notification abuse prevention, and production dependency management.

## Project Structure

```text
CCS/
|-- android/                     # Capacitor Android project
|-- ios/                         # Capacitor iOS project structure
|-- public/                      # Public assets and branding resources
|-- scripts/                     # Build and mobile utility scripts
|-- src/
|   |-- app/
|   |   |-- components/          # Shared layout, navigation, guards, and UI components
|   |   |-- context/             # Application state and auth context
|   |   |-- screens/             # Route-level application screens
|   |   |-- App.tsx              # App shell and mobile pull-to-refresh wrapper
|   |   `-- routes.ts            # Route definitions and protected route structure
|   |-- data/                    # Indoor map and campus location data
|   |-- lib/                     # Supabase and mobile notification utilities
|   |-- styles/                  # Global theme and CSS files
|   `-- main.tsx                 # React entry point
|-- supabase/
|   `-- migrations/              # Database schema, policy, and RPC migrations
|-- package.json
`-- README.md
```

## Environment Configuration

Create a local `.env` file with the Supabase project settings required by the Vite application:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These values are compiled into the frontend bundle. The Supabase anon key is expected to be public in a browser-based Supabase application, so database security must be enforced through Row Level Security policies and server-side checks.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

The web build output is generated in `dist/`.

## Mobile Build Workflow

### Prerequisites

For Android builds, install:

- Node.js 20 or newer.
- Android Studio.
- Android SDK.
- Java 17.

Set one of the following environment variables to your Android SDK path:

```bash
ANDROID_HOME
ANDROID_SDK_ROOT
```

The project includes scripts that can generate `android/local.properties` from the configured SDK path.

### Android Commands

Sync the latest web build into Android:

```bash
npm run android:sync
```

Open the Android project in Android Studio:

```bash
npm run android:open
```

Run the Android app:

```bash
npm run android:run
```

Build a debug APK:

```bash
npm run android:build:debug
```

Build a release Android App Bundle:

```bash
npm run android:build:release
```

### iOS Commands

Sync the web build into the iOS project:

```bash
npm run cap:sync:ios
```

Open the iOS project:

```bash
npm run cap:open:ios
```

The iOS project structure is included, but full iOS signing, provisioning, App Store configuration, and device validation are future deployment tasks.

### App Icon Generation

Generate Android and iOS app icons from the branding logo:

```bash
npm run icon:generate
```

Generate Android icons only:

```bash
npm run icon:generate:android
```

The icon generation workflow uses the school branding asset located at:

```text
public/branding/school-logo.png
```

## Database and Supabase Setup

Supabase migrations are stored in:

```text
supabase/migrations/
```

Apply the migrations to the target Supabase project using the Supabase workflow appropriate for the deployment environment. The migrations cover profile policies, student document storage policies, notification image handling, faculty announcement policies, assistance request policies, and message notification support.

After initial account creation, an administrator account must be promoted and approved in the `profiles` table:

```sql
update public.profiles
set role = 'admin',
    status = 'approved',
    approved_at = now()
where email = 'admin@yourdomain.com';
```

Student or faculty accounts can also be approved manually during setup:

```sql
update public.profiles
set status = 'approved',
    approved_at = now()
where email = 'student@yourdomain.com';
```

Storage buckets referenced by the application include:

- `student-documents`
- `avatar`

Storage access, upload limits, allowed MIME types, and production privacy settings should be reviewed carefully before deployment.

## Deployment

The web application builds as a standard Vite application and can be deployed to platforms such as Vercel.

Production deployment checklist:

- Configure Supabase environment variables in the deployment provider.
- Apply all database migrations to the production Supabase project.
- Verify Row Level Security policies before exposing the application.
- Configure storage buckets and file validation rules.
- Build the project with `npm run build`.
- Test authenticated routes, role-specific routes, mobile layouts, messaging, notifications, assistance requests, indoor map navigation, and analytics export.

## Project Status

CCS Connect is under active development. The current implementation includes the core web application, Android Capacitor support, authentication, role-based routing, messaging, notifications, assistance request handling, indoor navigation, profile management, admin tooling, and analytics.

Current active areas include:

- Mobile notification behavior.
- Android notification icon and native notification handling.
- Pull-to-refresh behavior.
- Indoor map mobile gestures and voice guidance.
- Assistance and notification workflows.
- Admin analytics export behavior.
- Supabase policy hardening.

## Future Roadmap

Planned and recommended improvements include:

- Full iOS build validation and deployment.
- Production push notification infrastructure.
- More advanced indoor positioning.
- QR-based checkpoint verification for indoor navigation.
- AI-assisted route guidance.
- Offline mode for selected campus information.
- Expanded complaint management as a dedicated module.
- More granular analytics and reporting.
- Stronger mobile security hardening.
- Additional backend-side validation for high-risk workflows.
- Automated test coverage for authentication, messaging, notifications, and assistance flows.

## License and Ownership

This repository is maintained for the CCS Connect system. Confirm institutional licensing, deployment ownership, and distribution rules before using the project in production or publishing native mobile builds.
