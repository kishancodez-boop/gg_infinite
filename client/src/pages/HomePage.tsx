import { ArrowRight, Bell, CheckCircle2, Layers, ShieldCheck, SunMedium } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SystemStatusPanel } from '../components/SystemStatusPanel';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Select,
  Table,
  Tabs,
  useToast,
} from '../components/ui';
import type { TableColumn } from '../components/ui';
import { NAVIGATION_ITEMS } from '../config/navigation';
import type { NavigationItem } from '../config/navigation';

export function HomePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [previewScope, setPreviewScope] = useState('national');
  const [previewSearch, setPreviewSearch] = useState('');
  const { pushToast } = useToast();

  const moduleRows = NAVIGATION_ITEMS.filter((item) => item.to !== '/');

  const columns: TableColumn<NavigationItem>[] = [
    {
      key: 'module',
      header: 'Module',
      render: (row) => {
        const Icon = row.icon;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5F8F5] border border-[#DCE6DF] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-[#17231F] text-sm">{row.label}</p>
              <p className="text-xs text-[#64736B]">{row.group}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'purpose',
      header: 'Planned Capability',
      render: (row) => <span className="text-xs text-[#64736B]">{row.shortDescription}</span>,
    },
    {
      key: 'status',
      header: 'Current State',
      render: () => <Badge variant="neutral">UI Shell Ready</Badge>,
    },
    {
      key: 'action',
      header: 'Route',
      className: 'text-right',
      render: (row) => (
        <Link
          to={row.to}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#16A36A] hover:text-[#102A25] rounded px-1.5 py-1"
        >
          Open
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Dashboard Shell',
      icon: <SunMedium className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-6">
          <SystemStatusPanel />

          <EmptyState
            icon={<SunMedium className="w-5 h-5" aria-hidden="true" />}
            badge={<Badge variant="demo">No Live Metrics Loaded Yet</Badge>}
            title="National Renewable Energy Indicators (Awaiting Data Milestones)"
            description="Energy capacity, generation mix, and state-level comparisons will appear here once MongoDB schemas and verified source ingestion are connected in upcoming milestones. No placeholder numbers are fabricated."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSchemaModalOpen(true)}
                leftIcon={<ShieldCheck className="w-4 h-4" aria-hidden="true" />}
              >
                Inspect Provenance Standard
              </Button>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Platform Module Directory</CardTitle>
              <CardDescription>
                All seven application routes are active inside the shared Eco-Tech shell.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={moduleRows}
                rowKey={(row) => row.to}
                caption="GreenGrid India application modules"
              />
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'components',
      label: 'Design System Preview',
      icon: <Layers className="w-3.5 h-3.5" />,
      content: (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Reusable Eco-Tech UI Components</CardTitle>
              <CardDescription>
                Interactive controls verifying accessibility, focus rings, and Milestone 02 component contracts.
              </CardDescription>
            </div>
            <Badge variant="demo">DEMO UI CONTROLS</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sample Filter Input"
                placeholder="Type a keyword (e.g. Solar, Gujarat)..."
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                helperText={
                  previewSearch
                    ? `Current filter preview: "${previewSearch}"`
                    : 'Supports keyboard focus and validation messages.'
                }
              />
              <Select
                label="Geography Scope Selector"
                value={previewScope}
                onChange={(e) => setPreviewScope(e.target.value)}
                options={[
                  { value: 'national', label: 'All India (National Scope)' },
                  { value: 'state', label: 'State-Level View (Planned)' },
                ]}
                helperText="Control preview only — no statistics queried yet."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Bell className="w-3.5 h-3.5" aria-hidden="true" />}
                onClick={() =>
                  pushToast({
                    variant: 'success',
                    title: 'Eco-Tech Toast Notification',
                    description: `Preview notification triggered (scope: ${previewScope}).`,
                  })
                }
              >
                Trigger Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchemaModalOpen(true)}
              >
                Open Provenance Modal
              </Button>
              <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Verified Badge
              </Badge>
              <Badge variant="warning">Needs Review</Badge>
              <Badge variant="info">Official Source</Badge>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="National Renewable Energy Dashboard"
        description="Central intelligence workspace for India's renewable capacity, generation trends, data freshness, and verified source provenance."
        breadcrumbs={[{ label: 'National Dashboard' }]}
        badge={<Badge variant="forest">Milestone 02 &bull; Shell</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSchemaModalOpen(true)}
            leftIcon={<ShieldCheck className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />}
          >
            Data Integrity Policy
          </Button>
        }
      />

      <Tabs
        items={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="National dashboard views"
      />

      <Modal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        title="Source Provenance & Data Integrity Standard"
        description="Every record displayed on GreenGrid India will enforce these fields."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSchemaModalOpen(false)}>
            Got it
          </Button>
        }
      >
        <ul className="space-y-2.5 text-xs text-[#64736B] leading-relaxed list-disc pl-4">
          <li>
            <strong className="text-[#17231F]">Source Attribution:</strong> Official organization
            name, source URL, and extraction method (`api`, `csv`, `rss`, or permitted `html`).
          </li>
          <li>
            <strong className="text-[#17231F]">Freshness Timestamps:</strong> Publication date
            (when available) and retrieval timestamp.
          </li>
          <li>
            <strong className="text-[#17231F]">Verification &amp; Demo Separation:</strong> Explicit
            `verificationStatus` and visible `DEMO` labels whenever sample fixtures are shown.
          </li>
        </ul>
      </Modal>
    </div>
  );
}
