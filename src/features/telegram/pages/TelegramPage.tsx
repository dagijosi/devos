import { FaTelegram } from 'react-icons/fa';
import { TelegramConnector } from '../../utilities/components/tools/TelegramConnector';

export function TelegramPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/15 flex items-center justify-center shrink-0">
          <FaTelegram className="w-6 h-6 text-[#229ED9]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-theme-text">Telegram Bot</h1>
          <p className="text-sm text-theme-text/50 mt-0.5">
            Import messages, create tasks, save notes, run workflows, and control your workspace from Telegram.
          </p>
        </div>
      </div>

      {/* Telegram connector with all controls */}
      <TelegramConnector />
    </div>
  );
}