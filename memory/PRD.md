# Camp Management System - Saveriani

## Original Problem Statement
Build a complete, local, offline-first Web App to replace ALL paper logs at a refugee camp in Italy (Saveriani). The goal is to showcase a highly efficient digital solution for the Head Office by digitalizing all paper-based management systems.

## Architecture
- **Frontend**: React 19 with Shadcn UI components, TailwindCSS
- **Backend**: FastAPI with async MongoDB (Motor)
- **Database**: MongoDB
- **Theme**: Dark mode optimized for night shifts (Swiss & High-Contrast archetype)
- **Language**: Italian only

## User Personas
1. **Operatori (Maher, Daniele, Costantino, Elena, Fabian, Alfredo, Alex, Alla, Nenad)**: Day-to-day camp management, time tracking, logbook entries
2. **Coordinatrice (Gaia)**: Oversight, report generation, staff management
3. **Head Office**: Report consumption, attendance verification

## Core Requirements (Static)
1. PIN-protected staff login (4-digit)
2. Clock-in/Clock-out time tracking
3. Digital logbook with categories (Medical, Security, General, Maintenance)
4. Shift handover with acknowledgment
5. Meal tracking (Dussmann Service) with quality/waste feedback
6. Automated laundry schedule for 32 rooms
7. Resident database with visual planimetria
8. Report generation for Head Office (PDF-ready)
9. Export/Import JSON backup for offline data protection

## What's Been Implemented (March 28, 2026)

### Backend API Endpoints
- `/api/staff` - Staff CRUD + PIN login
- `/api/time-entries` - Clock-in/out tracking with monthly hours calculation
- `/api/logs` - Digital logbook with category filtering
- `/api/handovers` - Shift handover creation and acknowledgment
- `/api/meals` - Meal records with quality/waste statistics
- `/api/residents` - Resident database with room assignments
- `/api/laundry/today` - Automated laundry schedule calculation
- `/api/reports/*` - Attendance, security, food-waste reports
- `/api/export` & `/api/import` - JSON backup functionality
- `/api/seed` - Initial data seeding

### Frontend Pages
- **Login**: PIN-based authentication with staff hints
- **Dashboard**: Real-time clock, clock-in/out, stats overview, laundry today
- **Diario Digitale**: Categorized logbook with filtering
- **Passaggio Consegne**: Shift handover with acknowledgment workflow
- **Gestione Pasti**: Meal tracking with quality stars and waste levels
- **Lavanderia**: Weekly calendar with 3-shift rotation for 32 rooms
- **Residenti**: Database + visual 32-room planimetria
- **Report**: Attendance/Security/Food-waste reports for Head Office
- **Backup Dati**: JSON export/import for USB backup

### Initial Data Seeded
- 10 Staff members with PINs (1111-0000)
- 19 Residents from original paper records (rooms 2-7)

## Prioritized Backlog

### P0 - Critical (Done)
- [x] PIN authentication
- [x] Time tracking
- [x] Logbook
- [x] Handover system
- [x] Meal tracking
- [x] Laundry schedule
- [x] Resident database
- [x] Planimetria visualization
- [x] Reports
- [x] Backup system

### P1 - High Priority (Future)
- [ ] Offline-first with service worker (PWA)
- [ ] Real PDF export (currently uses print)
- [ ] Push notifications for pending handovers
- [ ] Multi-language support option

### P2 - Medium Priority (Future)
- [ ] Dashboard charts and analytics
- [ ] Staff schedule management
- [ ] Resident medical history timeline
- [ ] Automated nightly reports

## Next Tasks List
1. Add service worker for true offline capability
2. Implement pdf-lib for proper PDF generation
3. Add data sync when connection restored
4. Consider adding resident photo support
5. Mobile-optimized views for tablet usage
