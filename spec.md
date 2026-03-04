# Mahadev Mandir Donation Manager

## Current State

Full-stack temple donation management app with:
- Backend: Motoko with Temple, Donation, AppUser, AuditLog types
- Frontend: React + TypeScript with Master/Admin/Volunteer roles
- Master login is hardcoded (ID: "MASTER", Password: "1234" or "Shankar@123") — not ICP principal-based
- Backend `addTemple`, `updateTemple`, `deleteTemple` require `#admin` ICP role (canister deployer)
- Backend `getUser`, `addUser` also require `#admin` ICP role
- Master login session is stored in localStorage with `role: "master"`
- Anonymous ICP caller gets `#guest` role — cannot call `#admin` functions
- **BUG**: When hardcoded Master logs in and tries to add/update a temple, the backend rejects with "Unauthorized" because the ICP caller is anonymous, not a canister-level admin

## Requested Changes (Diff)

### Add
- Backend: `masterPin` state variable (hardcoded as "Shankar@123" and "1234" accepted)
- Backend: New `addTempleWithPin(temple, pin)` function that accepts master PIN instead of ICP admin role
- Backend: New `updateTempleWithPin(temple, pin)` function with PIN auth
- Backend: New `deleteTempleWithPin(id, pin)` function with PIN auth
- Backend: New `addUserWithPin(input, pin)` function with PIN auth
- Backend: New `updateUserWithPin(id, input, pin)` function with PIN auth
- Backend: New `toggleUserStatusWithPin(id, pin)` function with PIN auth
- Backend: New `getUserWithPin(id, pin)` function with PIN auth — for login lookup
- Backend: New `getUsersByTempleWithPin(templeId, pin)` function with PIN auth
- Backend: New `createDonationWithPin(input, pin)` function — for master creating donations without temple access check
- Frontend: Pass `user.passcode` (master PIN) to all temple management and user management functions
- Frontend: `TempleManagement` — use `addTempleWithPin` / `updateTempleWithPin` when `user.role === "master"`
- Frontend: `UserManagement` — use `addUserWithPin` / `toggleUserStatusWithPin` / `getUsersByTempleWithPin`
- Frontend: `App.tsx` login — use `getUserWithPin` with master PIN for admin/volunteer lookup
- Frontend: Update `backend.d.ts` types to include new PIN-based functions

### Modify
- Backend: Keep all existing functions unchanged for backward compatibility
- Backend: `isCallerMasterByPin(pin)` private helper — returns true if pin matches MASTER_PIN_1 or MASTER_PIN_2

### Remove
- Nothing removed

## Implementation Plan

1. Regenerate backend with PIN-based auth functions added alongside existing ICP role-based functions
2. Update `backend.d.ts` with new function signatures
3. Update `TempleManagement.tsx` to call `addTempleWithPin`/`updateTempleWithPin` passing `user.passcode` from session
4. Update `UserManagement.tsx` to use PIN-based functions
5. Update `App.tsx` login handler to use `getUserWithPin` for volunteer/admin lookup
6. Build and deploy
