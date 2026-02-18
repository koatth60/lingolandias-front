import { MdDelete } from "react-icons/md";

const MessageOptionsCard = ({ onDelete, onEdit }) => {
  return (
    <div className="msg-options-card msg-fade-in">
      <button
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
      >
        <MdDelete size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
};

export default MessageOptionsCard;
