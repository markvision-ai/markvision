import React from 'react';
import { IdeasHeader } from './IdeasHeader';
import { ScriptWorkshop } from './ScriptWorkshop';
import { CreationCenter } from './CreationCenter';
import { PostingDashboard } from './PostingDashboard';

export const ContentFactoryV4 = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-background overflow-hidden rounded-xl border border-border shadow-2xl dark:shadow-black/20 m-4">
      {/* Top: Ideas Feed */}
      <IdeasHeader />

      {/* Main Workspace: 3 Columns */}
      <div className="flex-1 flex overflow-hidden divide-x divide-border bg-muted/5 dark:bg-background">
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
