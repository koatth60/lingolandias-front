import { MdDelete, MdEdit } from "react-icons/md";

const MessageOptionsCard = ({ onDelete, onEdit }) => {
  return (
    <div className="msg-options-card msg-fade-in">
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-150"
        >
          <MdEdit size={16} />
          <span>Edit</span>
        </button>
      )}
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
