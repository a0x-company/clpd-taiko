export function isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?([1-9]\d{0,2})?\s?(\(\d{1,3}\)|\d{1,3})[-\s]?\d{1,14}$/;
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, "");
    return phoneRegex.test(cleanedNumber);
  }
  
  export function isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s]{2,30}$/;
    return nameRegex.test(name);
  }