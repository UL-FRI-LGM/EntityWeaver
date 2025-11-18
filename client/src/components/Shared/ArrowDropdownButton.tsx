import classes from "./ArrowDropdownButton.module.css";
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react";
import { Button, type ButtonProps, type ElementProps } from "@mantine/core";
import { type PropsWithChildren } from "react";

type Props = {
  shownMenu: boolean;
  onClick?: () => void;
} & ButtonProps &
  ElementProps<"button">;

const ArrowDropdownButton = ({
  shownMenu,
  children,
  ...props
}: PropsWithChildren<Props>) => {
  return (
    <Button
      {...props}
      className={classes.filterButton}
      classNames={{ label: classes.filterLabel }}
      variant="subtle"
      color="gray"
      aria-haspopup="menu"
      aria-expanded={shownMenu}
      rightSection={
        shownMenu ? (
          <IconCaretUpFilled size={14} />
        ) : (
          <IconCaretDownFilled size={14} />
        )
      }
    >
      {children}
    </Button>
  );
};

export default ArrowDropdownButton;
