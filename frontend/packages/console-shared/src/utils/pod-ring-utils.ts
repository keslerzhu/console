import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  DeploymentConfigModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  PodModel,
  JobModel,
  CronJobModel,
} from '@console/internal/models';
import { ChartLabel } from '@patternfly/react-charts';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
  HorizontalPodAutoscalerKind,
} from '@console/internal/module/k8s';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { PodRCData, PodRingResources, PodRingData, ExtPodKind } from '../types';
import { checkPodEditAccess, getPodStatus } from './pod-utils';
import { RevisionModel } from '@console/knative-plugin';
import {
  getPodsForDeploymentConfigs,
  getPodsForDeployments,
  getPodsForStatefulSets,
  getPodsForDaemonSets,
} from './resource-utils';
import { AllPodStatus } from '../constants';

import './pod-ring-text.scss';

type PodRingLabelType = {
  subTitle: string;
  title: string;
  titleComponent: React.ReactElement;
};

type PodRingLabelData = {
  title: string;
  longTitle: boolean;
  subTitle: string;
  longSubtitle: boolean;
  reversed: boolean;
};

export const podRingFirehoseProps = {
  [PodModel.kind]: 'pods',
  [ReplicaSetModel.kind]: 'replicaSets',
  [ReplicationControllerModel.kind]: 'replicationControllers',
  [DeploymentModel.kind]: 'deployments',
  [DeploymentConfigModel.kind]: 'deploymentConfigs',
  [StatefulSetModel.kind]: 'statefulSets',
  [DaemonSetModel.kind]: 'daemonSets',
};

const applyPods = (podsData: PodRingData, dc: PodRCData) => {
  const {
    pods,
    current,
    previous,
    isRollingOut,
    obj: {
      metadata: { uid },
    },
  } = dc;
  podsData[uid] = {
    pods,
    current,
    previous,
    isRollingOut,
  };
  return podsData;
};

const podKindString = (count: number) =>
  (count === 1 ? PodModel.label : PodModel.plural).toLowerCase();

const isPendingPods = (
  pods: ExtPodKind[],
  currentPodCount: number,
  desiredPodCount: number,
): boolean =>
  (pods?.length === 1 && pods[0].status?.phase === 'Pending') ||
  (!currentPodCount && !!desiredPodCount);

export const getFailedPods = (pods: ExtPodKind[]): number => {
  if (!pods?.length) {
    return 0;
  }

  return pods.reduce((acc, currValue) => {
    if ([AllPodStatus.CrashLoopBackOff, AllPodStatus.Failed].includes(getPodStatus(currValue))) {
      return acc + 1;
    }
    return acc;
  }, 0);
};

const getTitleAndSubtitle = (
  isPending: boolean,
  currentPodCount: number,
  desiredPodCount: number,
) => {
  let titlePhrase;
  let subTitlePhrase = '';
  let longTitle = false;
  let longSubtitle = false;

  // handles the initial state when the first pod is coming up and the state for no pods(scaled to zero)
  if (!currentPodCount) {
    titlePhrase = isPending ? '0' : `Scaled to 0`;
    longTitle = !isPending;
    if (desiredPodCount) {
      subTitlePhrase = `scaling to ${desiredPodCount}`;
      longSubtitle = true;
    }
  }

  // handles the idle state or scaling to desired no. of pods
  if (currentPodCount) {
    titlePhrase = currentPodCount.toString();
    if (currentPodCount === desiredPodCount) {
      subTitlePhrase = podKindString(currentPodCount);
    } else {
      subTitlePhrase = `scaling to ${desiredPodCount}`;
      longSubtitle = true;
    }
  }

  return { title: titlePhrase, longTitle, subTitle: subTitlePhrase, longSubtitle };
};

const getTitleComponent = (
  longTitle: boolean = false,
  longSubtitle: boolean = false,
  reversed: boolean = false,
) => {
  const labelClasses = classNames('pf-chart-donut-title', {
    'pod-ring__center-text--reversed': reversed,
    'pod-ring__center-text': !reversed,
    'pod-ring__long-text': longTitle,
  });
  return React.createElement(ChartLabel, {
    dy: longSubtitle ? -5 : 0,
    style: { lineHeight: '11px' },
    className: labelClasses,
  });
};

export const podRingLabel = (
  obj: K8sResourceKind,
  ownerKind: string,
  pods: ExtPodKind[],
): PodRingLabelData => {
  let currentPodCount;
  let desiredPodCount;
  let isPending;
  let titleData;
  const podRingLabelData: PodRingLabelData = {
    title: '',
    subTitle: '',
    longTitle: false,
    longSubtitle: false,
    reversed: false,
  };

  const failedPodCount = getFailedPods(pods);
  switch (ownerKind) {
    case DaemonSetModel.kind:
      currentPodCount = (obj.status?.currentNumberScheduled || 0) + failedPodCount;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount);
      podRingLabelData.title = titleData.title;
      podRingLabelData.subTitle = titleData.subTitle;
      podRingLabelData.longSubtitle = titleData.longSubtitle;
      break;
    case RevisionModel.kind:
      currentPodCount = (obj.status?.readyReplicas || 0) + failedPodCount;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      if (!isPending && !desiredPodCount) {
        podRingLabelData.title = 'Autoscaled';
        podRingLabelData.subTitle = 'to 0';
        podRingLabelData.reversed = true;
        break;
      }
      if (isPending) {
        podRingLabelData.title = '0';
        podRingLabelData.subTitle = `scaling to ${desiredPodCount}`;
      } else {
        podRingLabelData.title = currentPodCount;
        podRingLabelData.subTitle = podKindString(currentPodCount);
      }
      break;
    case PodModel.kind:
    case JobModel.kind:
      podRingLabelData.title = '1';
      podRingLabelData.subTitle = PodModel.label;
      break;
    case CronJobModel.kind:
      podRingLabelData.title = `${pods.length}`;
      podRingLabelData.subTitle = podKindString(currentPodCount);
      break;
    default:
      currentPodCount = (obj.status?.readyReplicas || 0) + failedPodCount;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount);
      podRingLabelData.title = titleData.title;
      podRingLabelData.subTitle = titleData.subTitle;
      podRingLabelData.longTitle = titleData.longTitle;
      podRingLabelData.longSubtitle = titleData.longSubtitle;
      break;
  }

  return podRingLabelData;
};

export const hpaPodRingLabel = (
  obj: K8sResourceKind,
  hpa: HorizontalPodAutoscalerKind,
  pods: ExtPodKind[],
): PodRingLabelData => {
  const desiredPodCount = obj.spec?.replicas;
  const desiredPods = hpa.status?.desiredReplicas || desiredPodCount;
  const currentPods = hpa.status?.currentReplicas;
  const scaling =
    (!currentPods && !!desiredPods) || !pods.every((p) => p.status?.phase === 'Running');
  return {
    title: scaling ? 'Autoscaling' : 'Autoscaled',
    subTitle: `to ${desiredPods}`,
    longTitle: false,
    longSubtitle: false,
    reversed: true,
  };
};

export const usePodRingLabel = (
  obj: K8sResourceKind,
  ownerKind: string,
  pods: ExtPodKind[],
  hpaControlledScaling: boolean = false,
  hpa?: HorizontalPodAutoscalerKind,
): PodRingLabelType => {
  const podRingLabelData = hpaControlledScaling
    ? hpaPodRingLabel(obj, hpa, pods)
    : podRingLabel(obj, ownerKind, pods);
  const { title, subTitle, longTitle, longSubtitle, reversed } = podRingLabelData;

  return React.useMemo(
    () => ({
      title,
      subTitle,
      titleComponent: getTitleComponent(longTitle, longSubtitle, reversed),
    }),
    [longSubtitle, longTitle, reversed, subTitle, title],
  );
};

export const usePodScalingAccessStatus = (
  obj: K8sResourceKind,
  resourceKind: K8sKind,
  pods: ExtPodKind[],
  enableScaling?: boolean,
  impersonate?: string,
) => {
  const [editable, setEditable] = useSafetyFirst(false);
  React.useEffect(() => {
    checkPodEditAccess(obj, resourceKind, impersonate)
      .then((resp: SelfSubjectAccessReviewKind) =>
        setEditable(_.get(resp, 'status.allowed', false)),
      )
      .catch((error) => {
        // console.log is used here instead of throw error
        // throw error will break the thread and likely end-up in a white screen
        // eslint-disable-next-line
        console.log(error);
        setEditable(false);
      });
  }, [pods, obj, resourceKind, impersonate, setEditable]);

  const isKnativeRevision = obj.kind === 'Revision';
  const isScalingAllowed = !isKnativeRevision && editable && enableScaling;
  return isScalingAllowed;
};

export const transformPodRingData = (resources: PodRingResources, kind: string): PodRingData => {
  const targetResource = podRingFirehoseProps[kind];

  if (!targetResource) {
    throw new Error(`Invalid target resource: (${targetResource})`);
  }
  if (_.isEmpty(resources[targetResource].data)) {
    return {};
  }

  const podsData: PodRingData = {};
  const resourceData = resources[targetResource].data;

  if (kind === DeploymentConfigModel.kind) {
    return getPodsForDeploymentConfigs(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === DeploymentModel.kind) {
    return getPodsForDeployments(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === StatefulSetModel.kind) {
    return getPodsForStatefulSets(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === DaemonSetModel.kind) {
    return getPodsForDaemonSets(resourceData, resources).reduce(applyPods, podsData);
  }

  return podsData;
};
