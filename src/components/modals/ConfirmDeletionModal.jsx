const ConfirmDeletionModal = ({
	confirmDeletionModal,
	setConfirmDeletionModal,
}) => {
	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-stone-900 border border-stone-750 rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4">
				<h3 className="text-[15px] font-medium text-stone-100 mb-2">
					{confirmDeletionModal.title}
				</h3>
				<p className="text-[13px] text-stone-400 mb-6 max-h-40 overflow-auto break-words whitespace-pre-wrap">
					{confirmDeletionModal.message}
				</p>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={() => setConfirmDeletionModal({ isOpen: false })}
						className="h-9 px-3.5 rounded-md text-[13px] text-stone-300 hover:bg-stone-850 hover:text-stone-100 transition-colors bg-transparent border border-stone-750 cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirmDeletionModal.onConfirm}
						className="h-9 px-3.5 rounded-md text-[13px] font-medium bg-red-600 hover:bg-red-500 text-on-red transition-colors cursor-pointer"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDeletionModal;
