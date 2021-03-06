import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getRevisionActions } from '../../actions/getRevisionActions';
import { useServingBreadcrumbsFor } from '../services/hooks';

const RevisionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useServingBreadcrumbsFor(kindObj, match);
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const menuActionsCreator = (kindsObj: K8sKind, obj: K8sResourceKind) =>
    getRevisionActions().map((action) => action(kindsObj, obj));

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default RevisionDetailsPage;
