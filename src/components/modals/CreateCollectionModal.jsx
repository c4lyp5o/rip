import { useState } from "react";
import { createCollection } from "../../utils/ripDb";
import { useRip } from "../../context/RIPContext";
import { useToast } from "../../context/ToastContext";

const CreateCollectionModal = ({ setIsCreateModalOpen }) => {
	const { refreshCollections } = useRip();
	const { showToast } = useToast();

	const [newCollectionName, setNewCollectionName] = useState("");

	const handleCreateCollection = async (e) => {
		if (e) e.preventDefault();
		if (!newCollectionName.trim()) return;

		try {
			await createCollection(newCollectionName.trim());
			setNewCollectionName("");
			setIsCreateModalOpen(false);
			await refreshCollections();
			showToast("Collection created", "success");
		} catch (error) {
			if (import.meta.env.DEV)
				console.error("Failed to create collection:", error);
			showToast("Failed to create collection", "error");
		}
	};

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<form
				onSubmit={handleCreateCollection}
				className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-5 max-w-sm w-full mx-4"
			>
				<h3 className="text-lg font-medium text-stone-200 mb-4">
					New Collection
				</h3>
				<input
					// biome-ignore lint/a11y/noAutofocus: nanti
					autoFocus
					type="text"
					value={newCollectionName}
					onChange={(e) => setNewCollectionName(e.target.value)}
					placeholder="e.g. User API"
					className="w-full bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-6"
				/>
				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={() => setIsCreateModalOpen(false)}
						className="px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-md transition"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!newCollectionName.trim()}
						className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition shadow-md shadow-emerald-900/20"
					>
						Create
					</button>
				</div>
			</form>
		</div>
	);
};

export default CreateCollectionModal;
