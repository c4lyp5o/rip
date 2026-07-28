import { ChevronDown } from "lucide-react";

const CompactSelect = ({ value, onChange, options, className = "" }) => {
	return (
		<div className={`relative h-full flex items-center ${className}`}>
			<select
				value={value}
				onChange={onChange}
				className="h-full bg-transparent text-stone-200 pl-2 pr-6 text-xs font-semibold focus:outline-none cursor-pointer appearance-none z-10"
			>
				{options.map((opt) => (
					<option key={opt} value={opt} className="bg-stone-800">
						{opt}
					</option>
				))}
			</select>
			<ChevronDown className="w-3 h-3 text-stone-500 absolute right-2 pointer-events-none" />
		</div>
	);
};

export default CompactSelect;
