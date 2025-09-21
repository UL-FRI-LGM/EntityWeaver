import { observer } from "mobx-react";
import classes from "./TopBar.module.css";

const TopBar = observer(() => {
  return <div className={classes.container}></div>;
});

export default TopBar;
