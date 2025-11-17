import { observer } from "mobx-react";
import {
  type ElementProps,
  SegmentedControl,
  Table,
  Text,
} from "@mantine/core";
import { useMemo } from "react";
import { useAppState } from "@/stores/appState.ts";
import classes from "./TableWidget.module.css";
import type { tableContents } from "@/stores/uiState.ts";

const DocumentHeader = (
  <Table.Tr>
    <Table.Th className={classes.idColumn}>ID</Table.Th>
    <Table.Th className={classes.titleColumn}>Title</Table.Th>
    <Table.Th className={classes.contentColumn}>Content</Table.Th>
  </Table.Tr>
);

const EntityHeader = (
  <Table.Tr>
    <Table.Th className={classes.idColumn}>ID</Table.Th>
    <Table.Th className={classes.typeColumn}>Type</Table.Th>
    <Table.Th className={classes.nameColumn}>Name</Table.Th>
  </Table.Tr>
);

const MentionHeader = (
  <Table.Tr>
    <Table.Th className={classes.idColumn}>ID</Table.Th>
    <Table.Th className={classes.documentColumn}>Document</Table.Th>
    <Table.Th className={classes.typeColumn}>Type</Table.Th>
    <Table.Th className={classes.nameColumn}>Name</Table.Th>
  </Table.Tr>
);

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

const TableWidget = observer(() => {
  const appState = useAppState();

  const documentRows = useMemo(() => {
    return appState.dataset.documentList.map((document) => {
      return (
        <TableRow id={document.id} key={document.id}>
          <Table.Td className={classes.idColumn}>
            <TableText>{document.internal_id}</TableText>
          </Table.Td>
          <Table.Td className={classes.titleColumn}>
            <TableText>{document.title}</TableText>
          </Table.Td>
          <Table.Td className={classes.contentColumn}>
            <TableText>{document.text}</TableText>
          </Table.Td>
        </TableRow>
      );
    });
  }, [appState.dataset.documentList]);

  const entityRows = useMemo(() => {
    return appState.dataset.entityList.map((entity) => {
      return (
        <TableRow id={entity.id} key={entity.id}>
          <Table.Td className={classes.idColumn}>
            <TableText>{entity.internal_id}</TableText>
          </Table.Td>
          <Table.Td className={classes.typeColumn}>
            <TableText>{entity.type}</TableText>
          </Table.Td>
          <Table.Td className={classes.nameColumn}>
            <TableText>{entity.name}</TableText>
          </Table.Td>
        </TableRow>
      );
    });
  }, [appState.dataset.entityList]);

  const mentionRows = useMemo(() => {
    return appState.dataset.mentionList.map((mention) => {
      return (
        <TableRow id={mention.id} key={mention.id}>
          <Table.Td className={classes.idColumn}>
            <TableText>{mention.internal_id}</TableText>
          </Table.Td>
          <Table.Td className={classes.documentColumn}>
            <TableText> {mention.document.title}</TableText>
          </Table.Td>
          <Table.Td className={classes.typeColumn}>
            <TableText>{mention.type}</TableText>
          </Table.Td>
          <Table.Td className={classes.nameColumn}>
            <TableText>{mention.name}</TableText>
          </Table.Td>
        </TableRow>
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
            {appState.uiState.tableContents === "documents"
              ? DocumentHeader
              : appState.uiState.tableContents === "entities"
                ? EntityHeader
                : MentionHeader}
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
