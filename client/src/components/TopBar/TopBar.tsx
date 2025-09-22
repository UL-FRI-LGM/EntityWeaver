import { observer } from "mobx-react";
import classes from "./TopBar.module.css";
import { Group, Switch } from "@mantine/core";
import { useMst } from "@/stores/rootStore.ts";

const TopBar = observer(() => {
  const rootStore = useMst();
  return (
    <Group justify={"space-between"} className={classes.container}>
      <Switch
        label={"Entity View"}
        checked={rootStore.entityView}
        className={classes.switch}
        onChange={(event) =>
          rootStore.setEntityView(event.currentTarget.checked)
        }
      />
      <Group>
        <Switch
          label={"Highlight Hovered Node"}
          checked={rootStore.highlightOnHover}
          className={classes.switch}
          onChange={(event) =>
            rootStore.setHighlightOnHover(event.currentTarget.checked)
          }
        />
        <Switch
          label={"Highlight Selected Node"}
          checked={rootStore.highlightOnSelect}
          className={classes.switch}
          onChange={(event) =>
            rootStore.setHighlightOnSelect(event.currentTarget.checked)
          }
        />
      </Group>
    </Group>
  );
});

export default TopBar;
