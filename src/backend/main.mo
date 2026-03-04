import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  // Types
  public type Temple = {
    id : Text;
    name : Text;
    address : Text;
    appeal1 : Text;
    appeal2 : Text;
    appeal3 : Text;
    rules : Text;
    updatedAt : Time.Time;
  };

  module Temple {
    public func compare(a : Temple, b : Temple) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type Donation = {
    recNo : Nat;
    formattedId : Text;
    donorName : Text;
    amount : Nat;
    date : Text;
    time : Text;
    address : Text;
    volunteerName : Text;
    templeId : Text;
    templeType : Text;
    event : Text;
    timestamp : Time.Time;
  };

  module Donation {
    public func compare(a : Donation, b : Donation) : Order.Order {
      switch (Text.compare(a.templeId, b.templeId)) {
        case (#equal) { Nat.compare(a.recNo, b.recNo) };
        case (order) { order };
      };
    };
  };

  public type AppUser = {
    id : Text;
    name : Text;
    passcode : Text;
    status : Text;
    templeId : Text;
    role : Text;
    createdAt : Time.Time;
  };

  module AppUser {
    public func compare(a : AppUser, b : AppUser) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type AuditLog = {
    id : Text;
    logType : Text;
    reason : Text;
    actorName : Text;
    actorRole : Text;
    templeId : Text;
    receiptId : Text;
    logTimestamp : Time.Time;
    oldData : ?Text;
    newData : ?Text;
  };

  public type CreateDonationInput = {
    formattedId : Text;
    donorName : Text;
    amount : Nat;
    date : Text;
    time : Text;
    address : Text;
    volunteerName : Text;
    templeId : Text;
    templeType : Text;
    event : Text;
  };

  public type CreateUserInput = {
    id : Text;
    name : Text;
    passcode : Text;
    templeId : Text;
    role : Text;
  };

  public type UserProfile = {
    name : Text;
    appUserId : ?Text;
    templeId : ?Text;
    role : ?Text;
  };

  // State
  let temples = Map.empty<Text, Temple>();
  let donations = Map.empty<Text, Donation>();
  let users = Map.empty<Text, AppUser>();
  let auditLogs = Map.empty<Text, AuditLog>();
  let receiptCounters = Map.empty<Text, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToAppUser = Map.empty<Principal, Text>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Functions
  private func isValidMasterPin(pin : Text) : Bool {
    pin == "Shankar@123" or pin == "1234";
  };

  private func getAppUserForCaller(caller : Principal) : ?AppUser {
    switch (principalToAppUser.get(caller)) {
      case (?appUserId) { users.get(appUserId) };
      case (null) { null };
    };
  };

  private func isCallerMaster(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  private func canAccessTemple(caller : Principal, templeId : Text) : Bool {
    if (isCallerMaster(caller)) {
      return true;
    };
    switch (getAppUserForCaller(caller)) {
      case (?appUser) {
        appUser.templeId == templeId and appUser.status == "active";
      };
      case (null) { false };
    };
  };

  private func getNextReceiptNumberInternal(templeId : Text) : Nat {
    let current = switch (receiptCounters.get(templeId)) {
      case (?counter) { counter };
      case (null) { 0 };
    };
    let next = current + 1;
    receiptCounters.add(templeId, next);
    next;
  };

  private func createAuditLog(
    logType : Text,
    reason : Text,
    actorName : Text,
    actorRole : Text,
    templeId : Text,
    receiptId : Text,
    oldData : ?Text,
    newData : ?Text,
  ) : () {
    let id = receiptId.concat("-".concat(Time.now().toText()));
    let log : AuditLog = {
      id;
      logType;
      reason;
      actorName;
      actorRole;
      templeId;
      receiptId;
      logTimestamp = Time.now();
      oldData;
      newData;
    };
    auditLogs.add(id, log);
  };

  // User Profile Functions (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);

    // Link Principal to AppUser if provided
    switch (profile.appUserId) {
      case (?appUserId) {
        principalToAppUser.add(caller, appUserId);
      };
      case (null) {};
    };
  };

  // Temple Functions (ICP role-based)
  public query ({ caller }) func getTemple(id : Text) : async Temple {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view temples");
    };
    switch (temples.get(id)) {
      case (?temple) { temple };
      case (null) { Runtime.trap("Temple not found") };
    };
  };

  public query ({ caller }) func getAllTemples() : async [Temple] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view temples");
    };
    temples.values().toArray().sort();
  };

  public shared ({ caller }) func addTemple(temple : Temple) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage temples");
    };
    temples.add(temple.id, temple);
  };

  public shared ({ caller }) func updateTemple(temple : Temple) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage temples");
    };
    temples.add(temple.id, temple);
  };

  public shared ({ caller }) func deleteTemple(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage temples");
    };
    if (not temples.containsKey(id)) {
      Runtime.trap("Temple not found");
    };
    temples.remove(id);
  };

  // Temple Functions (PIN-based)
  public shared func addTempleWithPin(temple : Temple, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };
    temples.add(temple.id, temple);
  };

  public shared func updateTempleWithPin(temple : Temple, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };
    temples.add(temple.id, temple);
  };

  public shared func deleteTempleWithPin(id : Text, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };
    if (not temples.containsKey(id)) {
      Runtime.trap("Temple not found");
    };
    temples.remove(id);
  };

  // Donation Functions
  public shared ({ caller }) func createDonation(input : CreateDonationInput) : async Donation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only volunteers can create donations");
    };

    // Verify volunteer can create for this temple
    if (not canAccessTemple(caller, input.templeId)) {
      Runtime.trap("Unauthorized: You can only create donations for your assigned temple");
    };

    let recNo = getNextReceiptNumberInternal(input.templeId);
    let donation : Donation = {
      recNo;
      formattedId = input.formattedId;
      donorName = input.donorName;
      amount = input.amount;
      date = input.date;
      time = input.time;
      address = input.address;
      volunteerName = input.volunteerName;
      templeId = input.templeId;
      templeType = input.templeType;
      event = input.event;
      timestamp = Time.now();
    };

    donations.add(input.formattedId, donation);
    donation;
  };

  public shared func createDonationForTemple(input : CreateDonationInput, pin : Text) : async Donation {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    let recNo = getNextReceiptNumberInternal(input.templeId);
    let donation : Donation = {
      recNo;
      formattedId = input.formattedId;
      donorName = input.donorName;
      amount = input.amount;
      date = input.date;
      time = input.time;
      address = input.address;
      volunteerName = input.volunteerName;
      templeId = input.templeId;
      templeType = input.templeType;
      event = input.event;
      timestamp = Time.now();
    };

    donations.add(input.formattedId, donation);
    donation;
  };

  public shared ({ caller }) func updateDonation(formattedId : Text, donation : Donation, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can edit donations");
    };

    let oldDonation = switch (donations.get(formattedId)) {
      case (?d) { d };
      case (null) { Runtime.trap("Donation not found") };
    };

    donations.add(formattedId, donation);

    // Create audit log
    let actorName = switch (getAppUserForCaller(caller)) {
      case (?user) { user.name };
      case (null) { caller.toText() };
    };
    let actorRole = if (isCallerMaster(caller)) { "master" } else { "admin" };

    createAuditLog(
      "EDITED",
      reason,
      actorName,
      actorRole,
      donation.templeId,
      formattedId,
      ?("Old: " # oldDonation.donorName # ", " # oldDonation.amount.toText()),
      ?("New: " # donation.donorName # ", " # donation.amount.toText()),
    );
  };

  public shared ({ caller }) func deleteDonation(formattedId : Text, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can delete donations");
    };

    let donation = switch (donations.get(formattedId)) {
      case (?d) { d };
      case (null) { Runtime.trap("Donation not found") };
    };

    donations.remove(formattedId);

    // Create audit log
    let actorName = switch (getAppUserForCaller(caller)) {
      case (?user) { user.name };
      case (null) { caller.toText() };
    };
    let actorRole = if (isCallerMaster(caller)) { "master" } else { "admin" };

    createAuditLog(
      "DELETED",
      reason,
      actorName,
      actorRole,
      donation.templeId,
      formattedId,
      ?(donation.donorName # ", " # donation.amount.toText()),
      null,
    );
  };

  public query ({ caller }) func getDonation(formattedId : Text) : async Donation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view donations");
    };

    let donation = switch (donations.get(formattedId)) {
      case (?d) { d };
      case (null) { Runtime.trap("Donation not found") };
    };

    // Verify access to temple
    if (not canAccessTemple(caller, donation.templeId)) {
      Runtime.trap("Unauthorized: You can only view donations for your assigned temple");
    };

    donation;
  };

  public query ({ caller }) func getDonationsByTemple(templeId : Text) : async [Donation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view donations");
    };

    // Verify access to temple
    if (not canAccessTemple(caller, templeId)) {
      Runtime.trap("Unauthorized: You can only view donations for your assigned temple");
    };

    donations.values().filter(func(donation) { donation.templeId == templeId }).toArray();
  };

  // User Functions (ICP role-based)
  public query ({ caller }) func getUser(id : Text) : async AppUser {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can view user details");
    };

    switch (users.get(id)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getUsersByTemple(templeId : Text) : async [AppUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can view users");
    };

    users.values().filter(func(user) { user.templeId == templeId }).toArray();
  };

  public shared ({ caller }) func addUser(input : CreateUserInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can add users");
    };

    let user : AppUser = {
      id = input.id;
      name = input.name;
      passcode = input.passcode;
      status = "active";
      templeId = input.templeId;
      role = input.role;
      createdAt = Time.now();
    };
    users.add(input.id, user);
  };

  public shared ({ caller }) func updateUser(id : Text, input : CreateUserInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can update users");
    };

    let existingUser = switch (users.get(id)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let user : AppUser = {
      id = input.id;
      name = input.name;
      passcode = input.passcode;
      status = existingUser.status;
      templeId = input.templeId;
      role = input.role;
      createdAt = existingUser.createdAt;
    };
    users.add(id, user);
  };

  public shared ({ caller }) func toggleUserStatus(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can toggle user status");
    };

    let user = switch (users.get(id)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let newStatus = if (user.status == "active") { "inactive" } else { "active" };
    let updatedUser = { user with status = newStatus };
    users.add(id, updatedUser);
  };

  public shared ({ caller }) func deactivateUser(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can deactivate users");
    };

    let user = switch (users.get(id)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let updatedUser = { user with status = "inactive" };
    users.add(id, updatedUser);
  };

  // User Functions (PIN-based)
  public query func getUserWithPin(id : Text, pin : Text) : async AppUser {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    switch (users.get(id)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query func getUsersByTempleWithPin(templeId : Text, pin : Text) : async [AppUser] {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    users.values().filter(func(user) { user.templeId == templeId }).toArray();
  };

  public shared func addUserWithPin(input : CreateUserInput, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    let user : AppUser = {
      id = input.id;
      name = input.name;
      passcode = input.passcode;
      status = "active";
      templeId = input.templeId;
      role = input.role;
      createdAt = Time.now();
    };
    users.add(input.id, user);
  };

  public shared func updateUserWithPin(id : Text, input : CreateUserInput, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    let existingUser = switch (users.get(id)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let user : AppUser = {
      id = input.id;
      name = input.name;
      passcode = input.passcode;
      status = existingUser.status;
      templeId = input.templeId;
      role = input.role;
      createdAt = existingUser.createdAt;
    };
    users.add(id, user);
  };

  public shared func toggleUserStatusWithPin(id : Text, pin : Text) : async () {
    if (not isValidMasterPin(pin)) {
      Runtime.trap("Unauthorized: Invalid master PIN");
    };

    let user = switch (users.get(id)) {
      case (?u) { u };
      case (null) { Runtime.trap("User not found") };
    };

    let newStatus = if (user.status == "active") { "inactive" } else { "active" };
    let updatedUser = { user with status = newStatus };
    users.add(id, updatedUser);
  };

  // Audit Log Functions
  public query ({ caller }) func getAuditLogsByTemple(templeId : Text) : async [AuditLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can view audit logs");
    };

    auditLogs.values().filter(func(log) { log.templeId == templeId }).toArray();
  };

  public query ({ caller }) func getAuditLogsByReceipt(receiptId : Text) : async [AuditLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Admin/Master can view audit logs");
    };

    auditLogs.values().filter(func(log) { log.receiptId == receiptId }).toArray();
  };

  // Receipt Counter Query (for frontend display)
  public query ({ caller }) func getCurrentReceiptNumber(templeId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view receipt numbers");
    };

    if (not canAccessTemple(caller, templeId)) {
      Runtime.trap("Unauthorized: You can only view receipt numbers for your assigned temple");
    };

    switch (receiptCounters.get(templeId)) {
      case (?counter) { counter };
      case (null) { 0 };
    };
  };
};
