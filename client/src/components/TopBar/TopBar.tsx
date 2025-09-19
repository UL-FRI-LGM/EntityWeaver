import { observer } from "mobx-react";
import { useMst } from "../../stores/rootStore.ts";
import classes from "./TopBar.module.css";

const TopBar = observer(() => {
  const rootStore = useMst();

  return <div className={classes.container}></div>;
});

export default TopBar;
