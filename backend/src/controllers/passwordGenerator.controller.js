import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import passwordGeneratorService from "../services/passwordGenerator.service.js";

export const generatePassword = asyncHandler(async (req, res) => {
  const data = passwordGeneratorService.generate(req.body);
  return res.status(200).json(
    new ApiResponse(200, "Password generated successfully.", data)
  );
});
