import { ArrowLeft, Construction, Info, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
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
  useToast,
} from '../components/ui';

export interface ModulePlaceholderPageProps {
  title: string;
  description: string;
  breadcrumbLabel: string;
  plannedFeatures: string[];
}

export function ModulePlaceholderPage({
  title,
  description,
  breadcrumbLabel,
  plannedFeatures,
}: ModulePlaceholderPageProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [infoOpen, setInfoOpen] = useState(false);
  const { pushToast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: breadcrumbLabel }]}
        badge={<Badge variant="warning">Module Shell</Badge>}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInfoOpen(true)}
              leftIcon={<Info className="w-3.5 h-3.5" aria-hidden="true" />}
            >
              Module Scope
            </Button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-[#102A25] text-white hover:bg-[#183C35] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Workspace Filter Shell</CardTitle>
            <CardDescription>
              Layout preview controls — data queries will be wired in upcoming milestones.
            </CardDescription>
          </div>
          <Badge variant="neutral">Ready for API Integration</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Input
            label="Keyword Search"
            placeholder={`Search ${breadcrumbLabel.toLowerCase()}...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Scope"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All India & States' },
              { value: 'central', label: 'Central Ministries / Agencies' },
              { value: 'state', label: 'State Agencies' },
            ]}
          />
          <div>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() =>
                pushToast({
                  variant: 'info',
                  title: `${title} Shell`,
                  description:
                    'Module business logic and database queries are scheduled for a later milestone.',
                })
              }
            >
              Check Module Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        icon={<Construction className="w-5 h-5" aria-hidden="true" />}
        badge={<Badge variant="demo">No Live Records Yet</Badge>}
        title={`${title} is Prepared for Upcoming Milestones`}
        description="This route renders inside the shared GreenGrid India shell with zero fabricated metrics, schemes, or listings. Click Module Scope above to inspect planned capabilities."
        action={
          <Button variant="primary" size="sm" onClick={() => setInfoOpen(true)}>
            View Planned Scope
          </Button>
        }
      />

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={`${title} — Planned Scope`}
        description="Design and data-integrity deliverables scheduled for future milestones."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setInfoOpen(false)}>
            Close
          </Button>
        }
      >
        <ul className="space-y-2 text-xs text-[#64736B] leading-relaxed list-disc pl-4">
          {plannedFeatures.map((item) => (
            <li key={item} className="text-[#17231F]">
              {item}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
