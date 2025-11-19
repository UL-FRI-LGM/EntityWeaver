import classes from "./ArrowDropdownButton.module.css";
import {
  IconCaretDownFilled,
  IconCaretLeftFilled,
  IconCaretRightFilled,
  IconCaretUpFilled,
} from "@tabler/icons-react";
import { Button, type ButtonProps, type ElementProps } from "@mantine/core";
import { type PropsWithChildren } from "react";

type Props = {
  shownMenu: boolean;
  onClick?: () => void;
  direction?: "down" | "right";
} & ButtonProps &
  ElementProps<"button">;

const ArrowDropdownButton = ({
  shownMenu,
  children,
  direction = "down",
  ...props
}: PropsWithChildren<Props>) => {
  const showArrow =
    direction === "down" ? (
      <IconCaretDownFilled size={14} />
    ) : (
      <IconCaretRightFilled size={14} />
    );

  const hideArrow =
    direction === "down" ? (
      <IconCaretUpFilled size={14} />
    ) : (
      <IconCaretLeftFilled size={14} />
    );

  return (
    <Button
      {...props}
      className={classes.filterButton}
      classNames={{ label: classes.filterLabel }}
      variant="subtle"
      color="gray"
      aria-haspopup="menu"
      aria-expanded={shownMenu}
      rightSection={shownMenu ? hideArrow : showArrow}
    >
      {children}
    </Button>
  );
};

export default ArrowDropdownButton;
