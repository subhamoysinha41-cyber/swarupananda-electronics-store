import {
  Body1,
  Button,
  Card,
  Spinner,
  Title3,
} from '@fluentui/react-components';
import { ArrowClockwiseRegular, BoxRegular, WarningRegular } from '@fluentui/react-icons';

type StateViewProps = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  onRetry: () => void;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
};

export function StateView({
  loading,
  error,
  empty,
  onRetry,
  onEmptyAction,
  emptyActionLabel = 'Explore phones',
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'We will show your latest updates here.',
  children,
}: StateViewProps) {
  if (loading) {
    return (
      <Card className="state-card state-loading">
        <Spinner size="large" label="Loading your store..." />
        <div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="state-card state-error">
        <WarningRegular className="state-icon" aria-hidden="true" />
        <Title3>We hit a small snag</Title3>
        <Body1>{error}</Body1>
        <Button appearance="primary" icon={<ArrowClockwiseRegular />} onClick={onRetry}>Try loading again</Button>
      </Card>
    );
  }
  if (empty) {
    return (
      <Card className="state-card state-empty">
        <BoxRegular className="state-icon" aria-hidden="true" />
        <Title3>{emptyTitle}</Title3>
        <Body1>{emptyDescription}</Body1>
        {onEmptyAction && <Button appearance="primary" onClick={onEmptyAction}> {emptyActionLabel}</Button>}
      </Card>
    );
  }
  return <>{children}</>;
}
