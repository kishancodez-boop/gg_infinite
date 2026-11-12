import axios from 'axios';
import { CheckCircle2, ClipboardCheck, Eye, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
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
  Table,
  useToast,
} from '../ui';
import type { BadgeVariant, TableColumn } from '../ui';
import { useReaMutations, useReviewQueue } from '../../hooks/useRea';
import type { ReviewStatus, StagedRecordItem } from '../../types/rea';

function getReviewBadgeVariant(status: ReviewStatus): BadgeVariant {
  switch (status) {
    case 'approved':
      return 'success';
    case 'needs_correction':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'info';
  }
}

export function ReviewQueueTab({
  adminKey,
  onAdminKeyChange,
}: {
  adminKey: string;
  onAdminKeyChange: (value: string) => void;
}) {
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | ''>('');
  const [selectedItem, setSelectedItem] = useState<StagedRecordItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const queueQuery = useReviewQueue({ page, limit: 10, reviewStatus, adminKey });
  const { decisionMutation, publishMutation } = useReaMutations();

  const handleDecision = async (
    item: StagedRecordItem,
    decision: 'approve' | 'reject' | 'request_correction',
    publishOnApprove = false
  ) => {
    try {
      await decisionMutation.mutateAsync({
        id: item._id,
        decision,
        reviewNotes,
        publishOnApprove,
        adminKey,
      });
      pushToast({
        title: publishOnApprove
          ? 'Record approved and published to EnergyMetric.'
          : `Review decision "${decision}" saved.`,
        variant: 'success',
      });
      setSelectedItem(null);
      setReviewNotes('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
          error.message;
        pushToast({ title: msg, variant: 'error' });
      } else {
        pushToast({ title: 'Failed to submit review decision.', variant: 'error' });
      }
    }
  };

  const handlePublish = async (item: StagedRecordItem) => {
    try {
      await publishMutation.mutateAsync({ id: item._id, adminKey });
      pushToast({ title: 'Approved record published to EnergyMetric.', variant: 'success' });
      setSelectedItem(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
          error.message;
        pushToast({ title: msg, variant: 'error' });
      } else {
        pushToast({ title: 'Failed to publish record.', variant: 'error' });
      }
    }
  };

  const columns: TableColumn<StagedRecordItem>[] = [
    {
      key: 'metric',
      header: 'Proposed Metric',
      render: (row) => (
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#17231F]">{row.proposedData.metricName}</span>
            {row.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
          </div>
          <p className="text-xs text-[#64736B]">
            {row.proposedData.stateOrRegion} · {row.proposedData.observationDate.slice(0, 10)}
          </p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: (row) => (
        <span className="font-medium text-[#17231F]">
          {row.proposedData.value.toLocaleString()} {row.proposedData.unit}
        </span>
      ),
    },
    {
      key: 'changeType',
      header: 'Change',
      render: (row) => (
        <Badge variant={row.changeType === 'updated' ? 'warning' : 'info'}>
          {row.changeType}
        </Badge>
      ),
    },
    {
      key: 'reviewStatus',
      header: 'Review Status',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={getReviewBadgeVariant(row.reviewStatus)}>
            {row.reviewStatus.replace('_', ' ')}
          </Badge>
          {row.publishedRecordId ? <Badge variant="success">Published</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedItem(row);
            setReviewNotes(row.reviewNotes || '');
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Review
        </Button>
      ),
    },
  ];

  const errorStatus = axios.isAxiosError(queueQuery.error)
    ? queueQuery.error.response?.status
    : undefined;
  const isDbUnavailable = errorStatus === 503;
  const isAuthBlocked = errorStatus === 401 || errorStatus === 403;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Human Review & Approval Queue</CardTitle>
          <CardDescription>
            Records staged by REA require explicit human approval before publishing to EnergyMetric.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Filter by Review Status"
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value as ReviewStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'pending_review', label: 'Pending Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'needs_correction', label: 'Needs Correction' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <Input
              label="Admin Key (x-admin-key)"
              type="password"
              value={adminKey}
              onChange={(e) => onAdminKeyChange(e.target.value)}
              placeholder="Required for approve / reject / publish"
            />
          </div>

          {queueQuery.isLoading ? (
            <SkeletonCard />
          ) : queueQuery.isError ? (
            <ErrorState
              title={
                isDbUnavailable
                  ? 'MongoDB Not Connected (503 Service Unavailable)'
                  : isAuthBlocked
                    ? `Admin Authorization Required (${errorStatus})`
                    : 'Unable to Load Review Queue'
              }
              message={
                isDbUnavailable
                  ? 'Configure MONGODB_URI in server/.env to inspect staged REA records.'
                  : isAuthBlocked
                    ? 'Enter a valid server ADMIN_API_KEY in the Admin Key field above to inspect staged review records.'
                    : 'Could not reach /api/v1/rea/review-queue.'
              }
              onRetry={() => queueQuery.refetch()}
            />
          ) : (queueQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="No staged records in review queue"
              description="Run REA ingestion in Stage mode from the REA Ingestion tab to propose records for review."
            />
          ) : (
            <div className="space-y-3">
              <Table
                columns={columns}
                data={queueQuery.data?.data ?? []}
                rowKey={(row) => row._id}
              />
              {queueQuery.data?.meta.pagination && (
                <div className="flex items-center justify-between text-xs text-[#64736B]">
                  <span>
                    Page {queueQuery.data.meta.pagination.page} of{' '}
                    {queueQuery.data.meta.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!queueQuery.data.meta.pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!queueQuery.data.meta.pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        variant="drawer"
        title={selectedItem?.proposedData.metricName ?? 'Staged Record'}
        description={
          selectedItem
            ? `${selectedItem.proposedData.stateOrRegion} · ${selectedItem.changeType.toUpperCase()}`
            : undefined
        }
      >
        {selectedItem ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getReviewBadgeVariant(selectedItem.reviewStatus)}>
                {selectedItem.reviewStatus}
              </Badge>
              {selectedItem.isDemoData ? <Badge variant="warning">DEMO</Badge> : null}
              {selectedItem.publishedRecordId ? <Badge variant="success">Published</Badge> : null}
            </div>

            <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] p-3 space-y-1 text-xs">
              <p>
                <strong>Proposed Value:</strong> {selectedItem.proposedData.value}{' '}
                {selectedItem.proposedData.unit} ({selectedItem.proposedData.geographicScope})
              </p>
              <p>
                <strong>Change Detection:</strong> {selectedItem.changeSummary}
              </p>
              <p>
                <strong>Source:</strong> {selectedItem.sourceRef?.sourceName ?? 'Registered Source'}{' '}
                ({selectedItem.provenance.extractionMethod})
              </p>
              <p>
                <strong>Retrieved At:</strong> {selectedItem.provenance.retrievedAt}
              </p>
            </div>

            <Input
              label="Reviewer Notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional audit note for approval, rejection, or correction"
            />

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DCE6DF]">
              <Button
                size="sm"
                onClick={() => handleDecision(selectedItem, 'approve', true)}
                disabled={decisionMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Approve & Publish
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDecision(selectedItem, 'approve', false)}
                disabled={decisionMutation.isPending}
              >
                Approve Only
              </Button>
              {selectedItem.reviewStatus === 'approved' && !selectedItem.publishedRecordId ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePublish(selectedItem)}
                  disabled={publishMutation.isPending}
                >
                  Publish Approved
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDecision(selectedItem, 'request_correction')}
                disabled={decisionMutation.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Request Correction
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDecision(selectedItem, 'reject')}
                disabled={decisionMutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

