import { Book, Layers, GitBranch, Zap, Circle } from 'lucide-react';

export function SyntaxGuide() {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-gray-900">BPMN Markdown Syntax Guide</h1>
          </div>
          <p className="text-gray-600">
            Learn how to create BPMN diagrams using our simple Markdown-like syntax.
            Each element type has a specific format, and flows are defined using arrows.
          </p>
        </div>

        {/* Introduction */}
        <Section
          icon={<Book className="w-5 h-5" />}
          title="Introduction"
          description="BPMN diagrams are defined using a simple text-based syntax. Start by defining your pools and lanes, then add tasks, gateways, and flows to connect them."
        >
          <SyntaxExample
            title="Basic Structure"
            code={`# Process Title

pool: Pool Name
lane: Pool Name > Lane Name
task: taskId [Pool Name] Task Description
flow: taskId1 -> taskId2`}
            description="Every diagram starts with pools and lanes, followed by tasks and their connections."
          />
        </Section>

        {/* Pools and Lanes */}
        <Section
          icon={<Layers className="w-5 h-5" />}
          title="Pools & Lanes"
          description="Pools represent participants or organizations. Lanes subdivide pools to show different roles or departments."
        >
          <SyntaxExample
            title="Defining Pools"
            code={`pool: Customer Service
pool: Backend Systems
pool: Warehouse Department`}
            description="Use the 'pool:' keyword followed by the pool name. Each pool appears as a horizontal swimlane."
          />

          <SyntaxExample
            title="Defining Lanes"
            code={`lane: Customer Service > Level 1 Support
lane: Customer Service > Level 2 Support
lane: Warehouse Department > Picking Team
lane: Warehouse Department > Packing Team`}
            description="Use 'lane:' followed by 'Pool Name > Lane Name'. Lanes are nested within their parent pool."
          />
        </Section>

        {/* Tasks */}
        <Section
          icon={<Layers className="w-5 h-5" />}
          title="Tasks & Activities"
          description="Tasks represent work to be performed. Each task has an ID, pool assignment, and description."
        >
          <SyntaxExample
            title="Task Definition"
            code={`task: submit [Customer] Submit Request
task: validate [Support] Validate Information
task: process [Backend] Process Transaction
task: notify [System] Send Notification`}
            description="Format: task: id [Pool/Lane] Description. The ID is used to connect tasks with flows."
          />

          <SyntaxExample
            title="Start and End Events"
            code={`task: start [Customer] Customer Initiates
task: process [Sales] Handle Request
task: end [Customer] Process Complete`}
            description="Use 'start' and 'end' as task IDs to create special event markers (circles) instead of rectangles."
          />
        </Section>

        {/* Gateways */}
        <Section
          icon={<GitBranch className="w-5 h-5" />}
          title="Gateways"
          description="Gateways control the flow of the process, representing decision points or parallel execution."
        >
          <SyntaxExample
            title="Exclusive Gateway (XOR)"
            code={`gateway: decide [Sales] Approve Request? (xor)
flow: review -> decide
flow: decide -> approve [Yes]
flow: decide -> reject [No]`}
            description="XOR gateways split the flow based on conditions. Only one path is taken. Marked with 'X'."
          />

          <SyntaxExample
            title="Parallel Gateway (AND)"
            code={`gateway: fork [Process] Split Work (and)
flow: start -> fork
flow: fork -> task1
flow: fork -> task2
flow: fork -> task3`}
            description="AND gateways execute all paths simultaneously. All branches must complete. Marked with '+'."
          />

          <SyntaxExample
            title="Inclusive Gateway (OR)"
            code={`gateway: check [Validation] Check Criteria (or)
flow: input -> check
flow: check -> pathA [Condition A]
flow: check -> pathB [Condition B]`}
            description="OR gateways activate one or more paths based on conditions. Marked with 'O'."
          />
        </Section>

        {/* Flows */}
        <Section
          icon={<Zap className="w-5 h-5" />}
          title="Sequence Flows"
          description="Flows connect elements together, defining the order of execution. Use arrows to show direction."
        >
          <SyntaxExample
            title="Basic Flows"
            code={`flow: start -> task1
flow: task1 -> task2
flow: task2 -> end`}
            description="Use 'flow:' followed by 'fromId -> toId'. Arrows show the direction of the process."
          />

          <SyntaxExample
            title="Labeled Flows"
            code={`flow: gateway -> approve [Approved]
flow: gateway -> reject [Rejected]
flow: gateway -> review [Needs Review]`}
            description="Add labels in square brackets after the arrow to annotate conditions or decisions."
          />
        </Section>

        {/* Events */}
        <Section
          icon={<Circle className="w-5 h-5" />}
          title="Events"
          description="Events represent things that happen during the process. They can start, end, or occur during execution."
        >
          <SyntaxExample
            title="Event Types"
            code={`task: start [Process] Order Received
task: timer [Process] Wait 24 Hours
task: message [Process] Email Sent
task: end [Process] Order Complete`}
            description="Use descriptive IDs like 'start', 'end', 'timer', or 'message' to indicate event types visually."
          />
        </Section>

        {/* Complete Example */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-gray-900 mb-4">Complete Example</h2>
          <p className="text-gray-600 mb-6">
            Here's a full example combining all syntax elements:
          </p>
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-gray-100 text-sm font-mono">
{`# Order Fulfillment Process

pool: Customer
pool: Sales
pool: Warehouse

lane: Sales > Order Processing
lane: Warehouse > Fulfillment

task: start [Customer] Place Order
task: receive [Sales] Receive Order
task: validate [Sales] Validate Order
gateway: check [Sales] Stock Available? (xor)
task: approve [Sales] Approve Order
task: backorder [Sales] Create Backorder
task: pick [Warehouse] Pick Items
task: pack [Warehouse] Pack Items
task: ship [Warehouse] Ship Order
task: end [Customer] Receive Delivery

flow: start -> receive
flow: receive -> validate
flow: validate -> check
flow: check -> approve [In Stock]
flow: check -> backorder [Out of Stock]
flow: approve -> pick
flow: pick -> pack
flow: pack -> ship
flow: ship -> end
flow: backorder -> end`}
            </pre>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TipCard
            title="Use Meaningful IDs"
            description="Choose short, descriptive task IDs like 'approve', 'review', or 'send' instead of 't1', 't2'."
          />
          <TipCard
            title="Keep It Simple"
            description="Start with a basic flow and add complexity gradually. Test each addition."
          />
          <TipCard
            title="Organize by Pool"
            description="Group related tasks within the same pool to keep your diagram organized and readable."
          />
          <TipCard
            title="Label Your Flows"
            description="Use flow labels to clarify conditions and decisions, making the process easier to understand."
          />
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon, title, description, children }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 text-blue-600">{icon}</div>
        <div>
          <h2 className="text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <div className="ml-8 space-y-6">
        {children}
      </div>
    </section>
  );
}

interface SyntaxExampleProps {
  title: string;
  code: string;
  description: string;
}

function SyntaxExample({ title, code, description }: SyntaxExampleProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-gray-900">{title}</h3>
      </div>
      <div className="grid md:grid-cols-2 divide-x divide-gray-200">
        <div className="bg-gray-900 p-4">
          <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap">
            {code}
          </pre>
        </div>
        <div className="p-4 bg-white">
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface TipCardProps {
  title: string;
  description: string;
}

function TipCard({ title, description }: TipCardProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
      <h3 className="text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
