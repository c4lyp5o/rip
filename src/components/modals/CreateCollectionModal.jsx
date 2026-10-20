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
				className="bg-stone-900 border border-stone-750 rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4"
			>
				<h3 className="text-[15px] font-medium text-stone-100 mb-4">
					New collection
				</h3>
				<input
					// biome-ignore lint/a11y/noAutofocus: modals focus their first field
					autoFocus
					type="text"
					value={newCollectionName}
					onChange={(e) => setNewCollectionName(e.target.value)}
					placeholder="e.g. User API"
					aria-label="Collection name"
					className="w-full h-9 bg-stone-950 border border-stone-750 rounded-md px-3 text-[13px] text-stone-100 placeholder-stone-600 outline-none transition-colors focus:border-emerald-500 mb-6"
				/>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={() => setIsCreateModalOpen(false)}
						className="h-9 px-3.5 rounded-md text-[13px] text-stone-300 hover:bg-stone-850 hover:text-stone-100 transition-colors bg-transparent border border-stone-750 cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!newCollectionName.trim()}
						className="h-9 px-3.5 rounded-md text-[13px] font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-on-green transition-colors cursor-pointer"
					>
						Create
					</button>
				</div>
			</form>
		</div>
	);
};

export default CreateCollectionModal;
