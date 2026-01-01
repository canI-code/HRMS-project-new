import { Info } from "lucide-react";

export function TemplateGuide() {
    return (
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 mb-3 text-blue-900 font-semibold">
                <Info className="h-5 w-5" />
                <h3>Template Creation Guide</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 text-sm text-zinc-700">
                <div>
                    <h4 className="font-medium text-zinc-900 mb-2">1. System Template Names</h4>
                    <p className="mb-2">The system looks for exact names to trigger notifications automatically. Use these names:</p>
                    <ul className="list-disc pl-4 space-y-1 bg-white/50 p-2 rounded border border-blue-100">
                        <li><code className="text-blue-700 font-mono text-xs">LEAVE_REQUESTED</code> <span className="text-xs text-zinc-500">- Sent to Admins when leave is created</span></li>
                        <li><code className="text-blue-700 font-mono text-xs">LEAVE_APPROVED</code> <span className="text-xs text-zinc-500">- Sent to User when leave is approved</span></li>
                        <li><code className="text-blue-700 font-mono text-xs">LEAVE_REJECTED</code> <span className="text-xs text-zinc-500">- Sent to User when leave is rejected</span></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-medium text-zinc-900 mb-2">2. Using Placeholders</h4>
                    <p className="mb-2">Wrap variable names in double curly braces to insert dynamic data:</p>
                    <div className="bg-white/50 p-2 rounded border border-blue-100 font-mono text-xs text-zinc-600 mb-2">
                        Your {'{{type}}'} leave for {'{{days}}'} days starting {'{{startDate}}'} has been approved.
                    </div>
                    <div className="text-xs">
                        <span className="font-semibold">Common Variables:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {['startDate', 'endDate', 'type', 'days', 'reason', 'employeeId', 'approverComments'].map(v => (
                                <span key={v} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{v}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
