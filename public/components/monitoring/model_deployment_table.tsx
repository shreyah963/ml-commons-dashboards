/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import React, { useCallback, useMemo } from 'react';
import {
  Criteria,
  Direction,
  EuiBasicTable,
  EuiButton,
  EuiSmallButtonIcon,
  EuiEmptyPrompt,
  EuiHealth,
  EuiSpacer,
  EuiLink,
  EuiToolTip,
  EuiCopy,
  EuiText,
} from '@elastic/eui';

import { MODEL_STATE } from '../../../common';

/**
 * Resource type registered by the ml-commons backend plugin with the security
 * plugin's resource-sharing framework. Sharing is model-group scoped.
 */
export const ML_MODEL_GROUP_RESOURCE_TYPE = 'ml-model-group';

export interface ModelDeploymentTableSort {
  field: 'name' | 'model_state' | 'id';
  direction: Direction;
}

export interface ModelDeploymentTableCriteria {
  pagination?: { currentPage: number; pageSize: number };
  sort?: ModelDeploymentTableSort;
}

export interface ModelDeploymentItem {
  id: string;
  name: string;
  model_state?: MODEL_STATE;
  model_group_id?: string;
  respondingNodesCount: number | undefined;
  planningNodesCount: number | undefined;
  notRespondingNodesCount: number | undefined;
  planningWorkerNodes: string[];
  connector?: {
    id?: string;
    name?: string;
    description?: string;
  };
}

export interface ModelDeploymentTableProps {
  items: ModelDeploymentItem[];
  loading?: boolean;
  noTable?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number | undefined;
  };
  sort: ModelDeploymentTableSort;
  onChange: (criteria: ModelDeploymentTableCriteria) => void;
  onViewDetail?: (modelDeploymentItem: ModelDeploymentItem) => void;
  onResetSearchClick?: () => void;
  /**
   * When true, renders a Share column with resource-sharing SPI markers that
   * security-dashboards-plugin fulfills with its centralized share button.
   */
  resourceSharingEnabled?: boolean;
}

export const ModelDeploymentTable = ({
  sort,
  items,
  loading,
  noTable,
  pagination: paginationInProps,
  onChange,
  onViewDetail,
  onResetSearchClick,
  resourceSharingEnabled,
}: ModelDeploymentTableProps) => {
  const columns = useMemo(
    () => [
      {
        field: 'name',
        name: 'Name',
        width: '26.13%',
        sortable: true,
        truncateText: true,
      },
      {
        field: 'id',
        name: 'Source',
        width: '14%',
        sortable: false,
        truncateText: true,
        render: (_id: string, modelDeploymentItem: ModelDeploymentItem) => {
          return modelDeploymentItem.connector ? 'External' : 'Local';
        },
      },
      {
        field: 'id',
        name: 'Connector name',
        width: '22%',
        truncateText: true,
        textOnly: true,
        render: (_id: string, modelDeploymentItem: ModelDeploymentItem) => {
          return modelDeploymentItem.connector?.name || '\u2014';
        },
      },
      {
        field: 'model_state',
        name: 'Status',
        width: '14%',
        sortable: true,
        truncateText: true,
        render: (
          _model_state: string,
          { planningNodesCount, respondingNodesCount, notRespondingNodesCount }: ModelDeploymentItem
        ) => {
          if (
            planningNodesCount === undefined ||
            respondingNodesCount === undefined ||
            notRespondingNodesCount === undefined
          ) {
            return '\u2014';
          }
          if (respondingNodesCount === 0) {
            return (
              <EuiHealth className="ml-modelStatusCell" color="danger">
                <div className="eui-textTruncate">Not responding</div>
              </EuiHealth>
            );
          }
          if (notRespondingNodesCount === 0) {
            return (
              <EuiHealth className="ml-modelStatusCell" color="success">
                <div className="eui-textTruncate">Responding</div>
              </EuiHealth>
            );
          }
          return (
            <EuiHealth className="ml-modelStatusCell" color="warning">
              <div className="eui-textTruncate">Partially responding</div>
            </EuiHealth>
          );
        },
      },
      {
        field: 'id',
        name: 'Model ID',
        width: '18%',
        sortable: true,
        render: (id: string) => (
          <>
            <EuiCopy
              className="ml-modelModelIdCellTextWrapper"
              textToCopy={id}
              beforeMessage="Copy model ID"
              anchorClassName="ml-modelModelIdCell"
            >
              {(copy) => (
                <EuiSmallButtonIcon
                  aria-label="Copy ID to clipboard"
                  color="text"
                  iconType="copy"
                  onClick={copy}
                />
              )}
            </EuiCopy>
            <EuiText className="eui-textTruncate ml-modelModelIdText" size="s">
              {id}
            </EuiText>
          </>
        ),
      },
      ...(resourceSharingEnabled
        ? [
            {
              // Resource-sharing SPI marker column: the centralized Share
              // button (for the model's model group) is mounted here by
              // security-dashboards-plugin when installed and enabled.
              field: 'model_group_id',
              name: 'Access',
              width: '5%',
              render: (modelGroupId: string | undefined) =>
                modelGroupId ? (
                  <div
                    data-resource-share-button
                    data-resource-id={modelGroupId}
                    data-resource-type={ML_MODEL_GROUP_RESOURCE_TYPE}
                    data-resource-share-display="icon"
                  />
                ) : null,
            },
          ]
        : []),
      {
        field: 'id',
        name: 'Action',
        align: 'right' as const,
        width: '5.87%',
        render: (id: string, modelDeploymentItem: ModelDeploymentItem) => {
          return (
            <EuiToolTip content="View status details">
              <EuiSmallButtonIcon
                onClick={() => {
                  onViewDetail?.(modelDeploymentItem);
                }}
                role="button"
                aria-label="view detail"
                iconType="inspect"
              />
            </EuiToolTip>
          );
        },
      },
    ],
    [onViewDetail, resourceSharingEnabled]
  );
  const sorting = useMemo(() => ({ sort }), [sort]);

  const pagination = useMemo(
    () =>
      paginationInProps
        ? {
            pageIndex: paginationInProps.currentPage - 1,
            pageSize: paginationInProps.pageSize,
            totalItemCount: paginationInProps.totalRecords || 0,
            pageSizeOptions: [10, 20, 50],
            showPerPageOptions: true,
          }
        : undefined,
    [paginationInProps]
  );

  const handleChange = useCallback(
    (criteria: Criteria<ModelDeploymentItem>) => {
      onChange({
        ...(criteria.page
          ? { pagination: { currentPage: criteria.page.index + 1, pageSize: criteria.page.size } }
          : {}),
        ...(criteria.sort ? { sort: criteria.sort as ModelDeploymentTableSort } : {}),
      });
    },
    [onChange]
  );

  return (
    <>
      {noTable ? (
        <div style={{ paddingTop: 48, paddingBottom: 32 }}>
          <EuiEmptyPrompt
            style={{ maxWidth: 528 }}
            body={
              <EuiText size="s">
                <EuiSpacer size="l" />
                Deployed models will appear here. For more information, see{' '}
                <EuiLink
                  role="link"
                  href="https://opensearch.org/docs/latest/ml-commons-plugin/ml-dashboard/"
                  external
                  target="_blank"
                >
                  Machine Learning Documentation
                </EuiLink>
                .
                <EuiSpacer size="xl" />
              </EuiText>
            }
            aria-label="no deployed models"
          />
        </div>
      ) : (
        <EuiBasicTable
          columns={columns}
          sorting={sorting}
          onChange={handleChange}
          items={items}
          pagination={items.length > 0 ? pagination : undefined}
          noItemsMessage={
            <div style={{ padding: 40 }}>
              {loading ? (
                <EuiEmptyPrompt
                  body={
                    <EuiText size="s">
                      <EuiSpacer size="l" />
                      Loading deployed models...
                      <EuiSpacer size="xl" />
                    </EuiText>
                  }
                  aria-label="loading models"
                />
              ) : (
                <EuiEmptyPrompt
                  title={<EuiSpacer size="s" />}
                  body={
                    <EuiText size="s">
                      There are no results to your search. Reset the search criteria to view the
                      deployed models.
                    </EuiText>
                  }
                  actions={
                    <>
                      <EuiSpacer size="s" />
                      <EuiButton role="button" onClick={onResetSearchClick} size="m">
                        Reset search
                      </EuiButton>
                    </>
                  }
                  aria-label="no models results"
                />
              )}
            </div>
          }
        />
      )}
    </>
  );
};
