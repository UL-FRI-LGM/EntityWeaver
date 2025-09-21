import { observer } from "mobx-react";
import classes from "./TopBar.module.css";
import { Group, Switch } from "@mantine/core";
import { useMst } from "@/stores/rootStore.ts";

const TopBar = observer(() => {
  const rootStore = useMst();
  return (
    <Group justify={"end"} className={classes.container}>
      <Switch
        label={"Highlight Selected Node"}
        checked={rootStore.highlightOnSelect}
        className={classes.switch}
        onChange={(event) =>
          rootStore.setHighlightOnSelect(event.currentTarget.checked)
        }
      />
    </Group>
  );
});

export default TopBar;
