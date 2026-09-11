import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import secureNoteService from "../services/secureNote.service.js";

export const createSecureNote = asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(201, "Secure note created successfully.", await secureNoteService.create(req.user.id, req.body))));
export const getSecureNote = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "Secure note fetched successfully.", await secureNoteService.get(req.user.id, req.params.noteId))));
export const listSecureNotes = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "Secure notes fetched successfully.", await secureNoteService.list(req.user.id, req.query))));
export const updateSecureNote = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, "Secure note updated successfully.", await secureNoteService.update(req.user.id, req.params.noteId, req.body))));
export const deleteSecureNote = asyncHandler(async (req, res) => { await secureNoteService.delete(req.user.id, req.params.noteId); return res.status(200).json(new ApiResponse(200, "Secure note deleted successfully.", null)); });
