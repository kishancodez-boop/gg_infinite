import axios from 'axios';
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
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
  ErrorState,
  Input,
  Modal,
  Select,
  SkeletonCard,
} from '../components/ui';
import { useJobListings } from '../hooks/useFinanceJobs';
import type {
  DataModeFilter,
  GreenJobListingItem,
  JobEmploymentType,
  JobExperienceLevel,
  JobRoleCategory,
} from '../types/financeJobs';

const ROLE_CATEGORY_LABELS: Record<JobRoleCategory, string> = {
  solar_engineering: 'Solar Engineering',
  wind_engineering: 'Wind Engineering',
  grid_storage: 'Grid & Storage',
  policy_regulatory: 'Policy & Regulatory',
  green_finance: 'Green Finance',
  operations_maintenance: 'O&M',
  other: 'Other',
};

const EXPERIENCE_LABELS: Record<JobExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead_principal: 'Lead / Principal',
  all: 'All Levels',
};

const EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  full_time: 'Full-Time',
  contract: 'Contract',
  fellowship: 'Fellowship',
  internship: 'Internship',
  apprenticeship: 'Apprenticeship',
};

function formatDateLabel(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function JobsPage() {
  const [search, setSearch] = useState('');
  const [roleCategory, setRoleCategory] = useState<JobRoleCategory | ''>('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<JobExperienceLevel | ''>('');
  const [employmentType, setEmploymentType] = useState<JobEmploymentType | ''>('');
  const [dataMode, setDataMode] = useState<DataModeFilter>('all');
  const [selectedJob, setSelectedJob] = useState<GreenJobListingItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useJobListings({
    search,
    roleCategory,
    location,
    experienceLevel,
    employmentType,
    dataMode,
    limit: 50,
  });

  const isDatabaseUnavailable =
    axios.isAxiosError(error) && error.response?.status === 503;

  const items = data?.data ?? [];
  const verifiedCount = items.filter((item) => !item.isDemoData && item.verificationStatus === 'verified').length;
  const demoCount = items.filter((item) => item.isDemoData).length;
  const distinctOrgs = new Set(items.map((item) => item.organization)).size;
  const hasFilters = Boolean(
    search || roleCategory || location || experienceLevel || employmentType || dataMode !== 'all'
  );

  const resetFilters = () => {
    setSearch('');
    setRoleCategory('');
    setLocation('');
    setExperienceLevel('');
    setEmploymentType('');
    setDataMode('all');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Green Jobs Portal"
        breadcrumbs={[{ label: 'GreenGrid India', to: '/' }, { label: 'Green Jobs' }]}
        description="Directory of renewable-energy career pathways, organizations, required skills, and official application links across India."
        actions={
          <Badge variant="info" className="gap-1.5">
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            Verified Source Links
          </Badge>
        }
      />

      <div
        role="note"
        className="rounded-xl border border-[#E5B85B] bg-[#FFFBEB] px-4 py-3 text-sm text-[#7A5200] flex items-start gap-3"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" aria-hidden="true" />
        <div>
          <span className="font-semibold">Vacancy Integrity Notice:</span> GreenGrid India does not
          invent real vacancies or claim sample/DEMO records are active openings. Always verify live
          application status directly on the official employer or portal URL.
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <Input
              label="Search Role or Skills"
              placeholder="e.g. Solar, SCADA, BESS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Role Category"
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value as JobRoleCategory | '')}
              options={[
                { value: '', label: 'All Roles' },
                ...Object.entries(ROLE_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Input
              label="Location"
              placeholder="e.g. Bengaluru, Gujarat..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Select
              label="Experience Level"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as JobExperienceLevel | '')}
              options={[
                { value: '', label: 'All Experience' },
                ...Object.entries(EXPERIENCE_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Employment Type"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as JobEmploymentType | '')}
              options={[
                { value: '', label: 'All Types' },
                ...Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              label="Data Mode"
              value={dataMode}
              onChange={(e) => setDataMode(e.target.value as DataModeFilter)}
              options={[
                { value: 'all', label: 'Verified + Demo' },
                { value: 'verified', label: 'Verified Only' },
                { value: 'demo', label: 'Demo Only' },
              ]}
            />
          </div>
          {hasFilters ? (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Listings</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data?.meta.pagination.total ?? items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Matching current filters</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified Listings</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-[#16A36A]">{verifiedCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Audited official portals</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Demo / Sample Listings</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-[#D97706]">{demoCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Illustrative role profiles only</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organizations</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{distinctOrgs}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-[#64736B]">Distinct employers & agencies</CardContent>
        </Card>
      </div>

      {/* Content States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading green jobs portal">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isDatabaseUnavailable ? (
        <ErrorState
          title="Database Unavailable (503)"
          message="MongoDB is currently disconnected, so green job listings cannot be queried right now. Connect MongoDB and retry."
          onRetry={() => refetch()}
        />
      ) : isError ? (
        <ErrorState
          title="Failed to load Green Jobs Portal"
          message={error instanceof Error ? error.message : 'Unable to fetch green job listings.'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" aria-hidden="true" />}
          title="No green job listings found"
          description="Try broadening your role, location, or experience filters."
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((job) => (
            <Card key={job._id} className="flex flex-col justify-between">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{ROLE_CATEGORY_LABELS[job.roleCategory]}</Badge>
                    <Badge variant="neutral">{EXPERIENCE_LABELS[job.experienceLevel]}</Badge>
                    <Badge variant="neutral">{EMPLOYMENT_LABELS[job.employmentType]}</Badge>
                    {job.isDemoData ? (
                      <Badge variant="demo">DEMO</Badge>
                    ) : job.verificationStatus === 'verified' ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#64736B] whitespace-nowrap">
                    Verified: {formatDateLabel(job.lastVerifiedAt)}
                  </span>
                </div>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#42524A]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#17231F]">
                    <Building2 className="w-4 h-4 text-[#16A36A]" aria-hidden="true" />
                    {job.organization}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64736B]" aria-hidden="true" />
                    {job.location}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#42524A] line-clamp-2">{job.description}</p>
                {job.requiredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="neutral">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="pt-3 border-t border-[#DCE6DF] flex items-center justify-between gap-3 flex-wrap">
                  <a
                    href={job.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#16A36A] hover:underline"
                  >
                    Official Application / Source
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedJob(job)}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title ?? 'Job Details'}
        description={selectedJob ? `${selectedJob.organization} • ${selectedJob.location}` : undefined}
      >
        {selectedJob ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{ROLE_CATEGORY_LABELS[selectedJob.roleCategory]}</Badge>
              <Badge variant="neutral">{EXPERIENCE_LABELS[selectedJob.experienceLevel]}</Badge>
              <Badge variant="neutral">{EMPLOYMENT_LABELS[selectedJob.employmentType]}</Badge>
              {selectedJob.isDemoData ? (
                <Badge variant="demo">DEMO</Badge>
              ) : selectedJob.verificationStatus === 'verified' ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
              <Badge variant="neutral">
                Last verified: {formatDateLabel(selectedJob.lastVerifiedAt)}
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-[#17231F] mb-1">Role Description</h4>
              <p className="text-[#42524A] leading-relaxed">{selectedJob.description}</p>
            </div>

            {selectedJob.requiredSkills.length > 0 ? (
              <div>
                <h4 className="font-semibold text-[#17231F] mb-1">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-[#E5B85B] bg-[#FFFBEB] p-3 text-xs text-[#7A5200]">
              {selectedJob.postingStatusNote ||
                'Verify live vacancy status directly on the official employer or portal URL before applying.'}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              {selectedJob.sourceRef ? (
                <span className="text-xs text-[#64736B]">
                  Source Registry: {selectedJob.sourceRef.sourceName}
                </span>
              ) : (
                <span className="text-xs text-[#64736B]">Direct official employer/portal reference</span>
              )}
              <a
                href={selectedJob.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A36A] text-white text-xs font-medium hover:bg-[#138A59] transition-colors"
              >
                Open Official Link
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
