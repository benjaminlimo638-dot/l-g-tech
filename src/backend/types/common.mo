module {
  /// Cross-cutting identifiers and primitives shared across domains.
  public type Timestamp = Int; // nanoseconds since epoch (Time.now())
  public type OrderId = Nat; // internal sequential identifier
  public type RepairCode = Text; // human-readable code, e.g. "LG-4F9K2A"
  public type Phone = Text; // normalized phone number used for customer lookup
  public type FileId = Text; // object-storage file identifier
};
