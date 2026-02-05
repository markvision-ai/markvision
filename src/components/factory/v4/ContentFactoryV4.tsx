import React from 'react';
import { IdeasHeader } from './IdeasHeader';
import { ScriptWorkshop } from './ScriptWorkshop';
import { CreationCenter } from './CreationCenter';
import { PostingDashboard } from './PostingDashboard';

export const ContentFactoryV4 = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-100 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      {/* Top: Ideas Feed */}
      <IdeasHeader />

      {/* Main Workspace: 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script Workshop */}
        <ScriptWorkshop />

        {/* Center: Creation Canvas */}
        <CreationCenter />

        {/* Right: Posting Dashboard */}
        <PostingDashboard />
      </div>
    </div>
  );
};
