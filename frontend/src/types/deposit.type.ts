export enum DepositStatus {
  PENDING = "pending",
  ACCEPTED_NOT_MINTED = "accepted_not_minted",
  ACCEPTED_MINTED = "accepted_minted",
  REJECTED = "rejected",
}

export interface Deposit {
  id: string;
  createdAt: Date;
  phoneNumber: string;
  address: string;
  updatedAt: Date;
  amount: string;
  email: string;
  status: string;
}
