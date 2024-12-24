import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, addNote, updateNote, deleteNote } from "../api/notes";
import { useState, useEffect } from "react";

type Note = {
  id: string;
  title: string;
  body: string;
};

const Home = () => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    title: "",
    body: "",
  });

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
    initialData: [],
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: (note: { title: string; body: string }) => addNote(note),
    onMutate: async (newNote) => {
      console.log("onMutate");
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData(["notes"]);
      queryClient.setQueryData(["notes"], (old: Note[]) => [...old, newNote]);
      return { previousNotes };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["notes"], context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      closeModal();
    },
  });

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      note,
    }: {
      id: string;
      note: { title: string; body: string };
    }) => updateNote({ id, ...note }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Handle online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Open modal for creating a note
  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentNote({ id: "", title: "", body: "" });
    setIsFormVisible(true);
  };

  // Open modal for editing a note
  const openEditModal = (note: Note) => {
    setIsEditing(true);
    setCurrentNote(note);
    setIsFormVisible(true);
  };

  // Close the modal and reset states
  const closeModal = () => {
    setIsFormVisible(false);
    setCurrentNote({ id: "", title: "", body: "" });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentNote.id) {
      updateMutation.mutate({ id: currentNote.id, note: currentNote });
    } else {
      createMutation.mutate({
        title: currentNote.title,
        body: currentNote.body,
      });
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-gray-700">Loading notes...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Online/Offline Indicator */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold">Connection Status:</span>
          <span
            className={`px-4 py-2 rounded-lg text-white font-bold ${
              isOnline ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Notes</h1>

        {/* Add Note Button */}
        <button
          onClick={openCreateModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition mb-4"
        >
          Add Note
        </button>

        {/* Modal Form */}
        {isFormVisible && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Edit Note" : "Add Note"}
              </h2>
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={currentNote.title}
                    onChange={(e) =>
                      setCurrentNote({ ...currentNote, title: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter title"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="body"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Body
                  </label>
                  <textarea
                    id="body"
                    value={currentNote.body}
                    onChange={(e) =>
                      setCurrentNote({ ...currentNote, body: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter note content"
                    rows={4}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note: Note, index: number) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <h2 className="text-lg font-bold text-gray-800">{note.title}</h2>
              <p className="text-gray-600">{note.body}</p>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => openEditModal(note)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(note.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
