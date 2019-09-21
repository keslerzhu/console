import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../types';

export const getLabels = (entity: K8sResourceKind, defaultValue?: any) =>
  _.get(entity, 'metadata.labels', defaultValue) as K8sResourceKind['metadata']['labels'];
export const getAnnotations = (vm: VMLikeEntityKind, defaultValue?: any) =>
  _.get(vm, 'metadata.annotations', defaultValue);
export const getDescription = (vm: VMLikeEntityKind) =>
  _.get(vm, 'metadata.annotations.description');

export const getStorageSize = (value): string => _.get(value, 'requests.storage');

export const getValueByPrefix = (obj = {}, keyPrefix: string): string => {
  const objectKey = Object.keys(obj).find((key) => key.startsWith(keyPrefix));
  return objectKey ? obj[objectKey] : null;
};

export const getAnnotationKeySuffix = (
  entity: K8sResourceKind,
  annotationPrefix: string,
): string => {
  const annotations = _.get(
    entity,
    'metadata.annotations',
  ) as K8sResourceKind['metadata']['annotations'];
  return getValueByPrefix(annotations, annotationPrefix);
};

export const getLabelValue = (entity: K8sResourceKind, label: string): string =>
  _.get(entity, ['metadata', 'labels', label]);
