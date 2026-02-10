import * as React from 'react';
import { AgentRoster } from '@/components/agents/AgentRoster';

export default function AgentsPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <AgentRoster />
            </div>
        </div>
    );
}
