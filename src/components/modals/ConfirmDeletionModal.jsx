const confirmDeletionModal = ({
	confirmDeletionModal,
	setConfirmDeletionModal,
}) => {
	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-5 max-w-sm w-full mx-4">
				<h3 className="text-lg font-medium text-stone-200 mb-2">
					{confirmDeletionModal.title}
				</h3>
				<p className="text-sm text-stone-400 mb-6 max-h-40 overflow-auto wrap-break-word whitespace-pre-wrap">
					{confirmDeletionModal.message}
				</p>
				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={() => setConfirmDeletionModal({ isOpen: false })}
						className="px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 rounded-md transition"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirmDeletionModal.onConfirm}
						className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-md transition shadow-md shadow-red-900/20"
					>
						YES!
					</button>
				</div>
			</div>
		</div>
	);
};

export default confirmDeletionModal;
