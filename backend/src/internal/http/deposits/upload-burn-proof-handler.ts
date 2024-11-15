import multer from "multer";
import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { User } from "@internal/users/types";

type RequestWithUser = Request & {
  user?: User;
  file?: multer.Multer.File;
};

function validateBurnProofUploadRequest(req: RequestWithUser): { burnRequestId: string; file: multer.Multer.File } | { error: string } {
  const { burnRequestId } = req.params;
  const file = req.file;

  if (!burnRequestId) {
    return { error: "Burn request ID is required" };
  }

  if (!file) {
    return { error: "Proof image is required" };
  }

  return { burnRequestId, file };
}

export function uploadBurnProofHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
      const validationResult = validateBurnProofUploadRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { burnRequestId, file } = validationResult;

      await depositService.uploadBurnProof(
        burnRequestId,
        file.buffer,
        file.originalname
      );

      return res.status(200).json({
        message: "Proof of burn uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading proof of burn:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}