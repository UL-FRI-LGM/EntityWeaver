import { observer } from "mobx-react";
import {
  type ElementProps,
  SegmentedControl,
  Table,
  Text,
} from "@mantine/core";
import { useMemo } from "react";
import { type NodeSource, useAppState } from "@/stores/appState.ts";
import classes from "./TableWidget.module.css";
import type { tableContents } from "@/stores/uiState.ts";
import type { Attribute } from "@/stores/nodeAttributes.ts";

const DataHeader = observer(({ attributes }: { attributes: Attribute[] }) => {
  return (
    <Table.Tr>
      <Table.Th className={classes.idColumn}>ID</Table.Th>
      {attributes.map((attribute) => (
        <Table.Th key={attribute.id}>{attribute.displayName}</Table.Th>
      ))}
    </Table.Tr>
  );
});

const TableText = ({ ...props }: ElementProps<typeof Text>) => {
  return <Text lineClamp={2} {...props} />;
};

const TableRow = observer(
  ({ id, ...props }: ElementProps<typeof Table.Tr> & { id: string }) => {
    const appState = useAppState();

    return (
      <Table.Tr
        {...props}
        style={{
          backgroundColor:
            appState.selectedNode === id
              ? "var(--mantine-color-blue-light-hover)"
              : undefined,
        }}
        onClick={() => {
          appState.setSelectedNode(id);
        }}
      />
    );
  },
);

const DataRow = observer(
  ({
    nodeSource,
    attributes,
  }: {
    nodeSource: NodeSource;
    attributes: Attribute[];
  }) => {
    return (
      <TableRow id={nodeSource.id}>
        <Table.Td className={classes.idColumn}>
          <TableText>{nodeSource.internal_id}</TableText>
        </Table.Td>
        {attributes.map((attribute) => (
          <Table.Td key={attribute.id}>
            <TableText>
              {attribute.name in nodeSource.allAttributes
                ? nodeSource.allAttributes[attribute.name]
                : "-"}
            </TableText>
          </Table.Td>
        ))}
      </TableRow>
    );
  },
);

const TableWidget = observer(() => {
  const appState = useAppState();

  const documentRows = useMemo(() => {
    return appState.dataset.documentList.map((document) => {
      return (
        <DataRow
          key={document.id}
          nodeSource={document}
          attributes={
            document.dataset.attributeManager.documentProperties.attributes
          }
        />
      );
    });
  }, [appState.dataset.documentList]);

  const entityRows = useMemo(() => {
    return appState.dataset.entityList.map((entity) => {
      return (
        <DataRow
          key={entity.id}
          nodeSource={entity}
          attributes={
            entity.dataset.attributeManager.entityProperties.attributes
          }
        />
      );
    });
  }, [appState.dataset.entityList]);

  const mentionRows = useMemo(() => {
    return appState.dataset.mentionList.map((mention) => {
      return (
        <DataRow
          key={mention.id}
          nodeSource={mention}
          attributes={
            mention.dataset.attributeManager.mentionProperties.attributes
          }
        />
      );
    });
  }, [appState.dataset.mentionList]);

  return (
    <div className={classes.container}>
      <div>
        {/*Total Documents: {appState.dataset.documentList.length}*/}
        <SegmentedControl
          value={appState.uiState.tableContents}
          onChange={(value) => {
            appState.uiState.setTableContents(value as tableContents);
          }}
          data={[
            { label: "Documents", value: "documents" },
            { label: "Entities", value: "entities" },
            { label: "Mentions", value: "mentions" },
          ]}
          classNames={{ label: classes.controlLabel }}
          orientation="vertical"
        />
      </div>
      <div className={classes.tableWrapper}>
        <Table
          striped
          highlightOnHover
          withTableBorder
          stickyHeader
          className={classes.table}
        >
          <Table.Thead>
            {appState.uiState.tableContents === "documents" ? (
              <DataHeader
                attributes={
                  appState.dataset.attributeManager.documentProperties
                    .attributes
                }
              />
            ) : appState.uiState.tableContents === "entities" ? (
              <DataHeader
                attributes={
                  appState.dataset.attributeManager.entityProperties.attributes
                }
              />
            ) : (
              <DataHeader
                attributes={
                  appState.dataset.attributeManager.mentionProperties.attributes
                }
              />
            )}
          </Table.Thead>
          <Table.Tbody>
            {appState.uiState.tableContents === "documents"
              ? documentRows
              : appState.uiState.tableContents === "entities"
                ? entityRows
                : mentionRows}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
});

export default TableWidget;
