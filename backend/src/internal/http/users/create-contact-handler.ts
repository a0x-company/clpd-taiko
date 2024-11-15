import { UserService } from "@internal/users";
import { Request, Response } from "express";

export function createContactHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { phoneNumber, name } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await userService.createContact(user, phoneNumber, name);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error creating contact:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
