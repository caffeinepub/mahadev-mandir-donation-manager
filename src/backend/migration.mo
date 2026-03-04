import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  type Temple = {
    id : Text;
    name : Text;
    address : Text;
    appeal1 : Text;
    appeal2 : Text;
    appeal3 : Text;
    rules : Text;
    updatedAt : Time.Time;
  };

  type Donation = {
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

  type AppUser = {
    id : Text;
    name : Text;
    passcode : Text;
    status : Text;
    templeId : Text;
    role : Text;
    createdAt : Time.Time;
  };

  type AuditLog = {
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

  type OldActor = {
    temples : Map.Map<Text, Temple>;
    donations : Map.Map<Text, Donation>;
    users : Map.Map<Text, AppUser>;
    auditLogs : Map.Map<Text, AuditLog>;
    receiptCounters : Map.Map<Text, Nat>;
  };

  type NewActor = {
    temples : Map.Map<Text, Temple>;
    donations : Map.Map<Text, Donation>;
    users : Map.Map<Text, AppUser>;
    auditLogs : Map.Map<Text, AuditLog>;
    receiptCounters : Map.Map<Text, Nat>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
