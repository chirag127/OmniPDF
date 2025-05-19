import { ReactNode } from 'react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  className?: string;
}

const ToolCard = ({ title, description, icon, to, className = '' }: ToolCardProps) => {
  return (
    <a 
      href={to}
      className={`block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors ${className}`}
    >
      <div className="flex items-center mb-3">
        <div className="mr-3 text-blue-600 text-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </a>
  );
};

export default ToolCard;
