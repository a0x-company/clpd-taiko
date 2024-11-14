// react
import { useState, useEffect, useRef } from "react";

// axios
import axios from "axios";

// context
import { useUserStore } from "@/context/global-store";

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const { user } = useUserStore();

  const hasFetchedContacts = useRef(false);

  const fetchContacts = async (phoneNumber: string) => {
    setLoadingContacts(true);
    try {
      const response = await axios.get<Contact[]>(`/api/contacts?phoneNumber=${phoneNumber}`);
      if (response.status === 200) {
        setContacts(response.data);
        hasFetchedContacts.current = true;
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const addContact = async (newContact: Contact) => {
    try {
      const response = await axios.post("/api/contacts", newContact);
      await fetchContacts(user?.phoneNumber || "");
      return response;
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  useEffect(() => {
    if (!hasFetchedContacts.current && user?.phoneNumber) {
      fetchContacts(user.phoneNumber);
    }
  }, [user]);

  return { contacts, loadingContacts, fetchContacts, addContact };
};

export default useContacts;
