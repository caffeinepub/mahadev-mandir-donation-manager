import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Donation {
    volunteerName: string;
    formattedId: string;
    date: string;
    donorName: string;
    time: string;
    templeType: string;
    event: string;
    address: string;
    timestamp: Time;
    templeId: string;
    amount: bigint;
    recNo: bigint;
}
export type Time = bigint;
export interface Temple {
    id: string;
    name: string;
    appeal1: string;
    appeal2: string;
    appeal3: string;
    updatedAt: Time;
    address: string;
    rules: string;
}
export interface AuditLog {
    id: string;
    actorName: string;
    actorRole: string;
    logTimestamp: Time;
    logType: string;
    templeId: string;
    receiptId: string;
    newData?: string;
    oldData?: string;
    reason: string;
}
export interface CreateUserInput {
    id: string;
    passcode: string;
    name: string;
    role: string;
    templeId: string;
}
export interface CreateDonationInput {
    volunteerName: string;
    formattedId: string;
    date: string;
    donorName: string;
    time: string;
    templeType: string;
    event: string;
    address: string;
    templeId: string;
    amount: bigint;
}
export interface UserProfile {
    name: string;
    role?: string;
    appUserId?: string;
    templeId?: string;
}
export interface AppUser {
    id: string;
    status: string;
    passcode: string;
    name: string;
    createdAt: Time;
    role: string;
    templeId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTemple(temple: Temple): Promise<void>;
    addTempleWithPin(temple: Temple, pin: string): Promise<void>;
    addUser(input: CreateUserInput): Promise<void>;
    addUserWithPin(input: CreateUserInput, pin: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDonation(input: CreateDonationInput): Promise<Donation>;
    createDonationForTemple(input: CreateDonationInput, pin: string): Promise<Donation>;
    deactivateUser(id: string): Promise<void>;
    deleteDonation(formattedId: string, reason: string): Promise<void>;
    deleteTemple(id: string): Promise<void>;
    deleteTempleWithPin(id: string, pin: string): Promise<void>;
    getAllTemples(): Promise<Array<Temple>>;
    getAuditLogsByReceipt(receiptId: string): Promise<Array<AuditLog>>;
    getAuditLogsByTemple(templeId: string): Promise<Array<AuditLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentReceiptNumber(templeId: string): Promise<bigint>;
    getDonation(formattedId: string): Promise<Donation>;
    getDonationsByTemple(templeId: string): Promise<Array<Donation>>;
    getTemple(id: string): Promise<Temple>;
    getUser(id: string): Promise<AppUser>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserWithPin(id: string, pin: string): Promise<AppUser>;
    getUsersByTemple(templeId: string): Promise<Array<AppUser>>;
    getUsersByTempleWithPin(templeId: string, pin: string): Promise<Array<AppUser>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleUserStatus(id: string): Promise<void>;
    toggleUserStatusWithPin(id: string, pin: string): Promise<void>;
    updateDonation(formattedId: string, donation: Donation, reason: string): Promise<void>;
    updateTemple(temple: Temple): Promise<void>;
    updateTempleWithPin(temple: Temple, pin: string): Promise<void>;
    updateUser(id: string, input: CreateUserInput): Promise<void>;
    updateUserWithPin(id: string, input: CreateUserInput, pin: string): Promise<void>;
}
