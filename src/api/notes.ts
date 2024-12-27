import axios from "axios";

export const BASE_URL = "http://localhost:3000/notes";

// Fetch notes
export const fetchNotes = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

// Add a new note
export const addNote = async (note: { title: string; body: string }) => {
  const response = await axios.post(BASE_URL, note);
  return response.data;
};

// Update an existing note
export const updateNote = async (note: {
  id: string;
  title: string;
  body: string;
}) => {
  const response = await axios.put(`${BASE_URL}/${note.id}`, note);
  return response.data;
};

// Delete a note
export const deleteNote = async (id: string) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
