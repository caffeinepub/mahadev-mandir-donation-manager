# Mahadev Mandir Donation Manager

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Authentication**: Role-based login system with three roles: Master (मुख्य), Admin (प्रबंधक), Volunteer (सदस्य)
- **Temple Management** (Master only): Register and configure multiple temples with name, address, and 4 customizable appeal paragraphs/text blocks used on receipts
- **User Management** (Master + Admin): Add volunteers and admins with unique IDs, passcodes, assign to temples; toggle active/inactive status
- **Donation Form**: Receipt entry form with receipt number (auto-increment from 108), date, temple type selector, donation type selector (changes based on temple type), donor name, amount, address; supports edit mode
- **Ledger / Report**: Searchable table of all donations for user's temple, shows receipt ID, time, name, event, amount; VIEW (receipt preview), EDIT, DELETE (admin only with reason prompt)
- **Receipt Preview**: A5-sized printable/PDF-downloadable receipt in Hindi with temple name, address, appeal paragraphs, donor details, amount in words (Hindi), volunteer signature
- **Audit Log**: Track edits and deletes with reason, actor, timestamp
- **Offline Support**: App works offline; data syncs when connection is restored
- **Online indicator**: Pulsing green/red dot in header showing sync status
- **Predefined templates**: Dropdown to select preset appeal text paragraphs for temple setup
- **Amount in Hindi words**: Convert numeric amount to Hindi words (e.g. "पाँच सौ")
- **Temple Types**: Shiv, Hanuman, Durga, Ram, Kali, Ganesh, Other — each with relevant donation event types

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Backend: User authentication (Master hardcoded, Admin/Volunteer stored in DB), Temple CRUD, Donation CRUD, Volunteer/Admin CRUD, Audit log creation
2. Backend: Data model for Temple (id, name, address, appeal1-3, rules), Donation (recNo, formattedId, name, amount, date, time, address, volunteer, templeId, templeType, event, timestamp), User (name, passcode, status, templeId, role)
3. Frontend: LoginScreen with role selector, User ID, password, Google link button
4. Frontend: Main app shell with sticky nav (role-colored), tab navigation (Management/User Setup/Receipt/Report)
5. Frontend: TempleManagement component with form + predefined template selectors
6. Frontend: UserManagement component with Members/Admins toggle, add form, list with status toggle
7. Frontend: DonationForm with temple type + event type cascading selects, receipt number display, save defaults checkbox
8. Frontend: Ledger table with search, VIEW/EDIT/DELETE actions
9. Frontend: ReceiptPreview modal — A5 layout, PDF export via html2canvas + jsPDF
10. Frontend: ReasonPrompt modal for delete/edit confirmation with audit reason
11. Frontend: Hindi number-to-words converter utility
12. Frontend: Online/offline detection and display
