export type BankInfo = {
  bankId: string;
  accountType: string;
  name: string;
  accountNumber: string;
  rut: string;
  email: string;
  ownershipCheck: boolean;
};

export enum RedeemStatus {
  RECEIVED_NOT_BURNED = "received_not_burned",
  BURNED = "burned",
  REJECTED = "rejected",
}

export interface Redeem {
  id: string;
  createdAt: Date;
  phoneNumber: string;
  address: string;
  updatedAt: Date;
  amount: string;
  email: string;
  status: string;
  accountHolder: string;
  accountNumber: string;
  bankId: string;
  rut: string;
  userEmail: string;
}
