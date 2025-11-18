import classes from "./ArrowDropdownButton.module.css";
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { type PropsWithChildren, type Ref } from "react";

interface Props {
  shownMenu: boolean;
  onClick?: () => void;
  ref?: Ref<HTMLButtonElement>;
}

const ArrowDropdownButton = ({
  shownMenu,
  onClick,
  ref,
  children,
}: PropsWithChildren<Props>) => {
  return (
    <Button
      ref={ref}
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
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default ArrowDropdownButton;
