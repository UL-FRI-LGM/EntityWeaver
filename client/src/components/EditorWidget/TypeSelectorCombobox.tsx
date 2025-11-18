import {
  Combobox,
  type ComboboxStore,
  Input,
  InputBase,
  Text,
} from "@mantine/core";
import classes from "./TypeSelectorCombobox.module.css";
import { DEFINES } from "@/defines.ts";

const entityTypeDropdownOptions = Object.entries(DEFINES.entityTypes.names).map(
  ([tag, name]) => (
    <Combobox.Option value={tag} key={tag}>
      <Text inherit truncate="end">
        {name}
      </Text>
    </Combobox.Option>
  ),
);

interface Props {
  combobox: ComboboxStore;
  entityType: string | null;
  setEntityType: (_type: string) => void;
}

const TypeSelectorCombobox = ({
  combobox,
  entityType,
  setEntityType,
}: Props) => {
  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        setEntityType(val);
        combobox.closeDropdown();
      }}
      classNames={{ dropdown: classes.dropdown }}
      position={"bottom-end"}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          label="Entity Type"
          pointer
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => {
            combobox.toggleDropdown();
          }}
          className={classes.typeInput}
          // styles={{
          //   input: {
          //     backgroundColor: typeToColor(entityType) ?? undefined,
          //   },
          // }}
        >
          {entityType ?? (
            <Input.Placeholder>Select Entity Type</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>{entityTypeDropdownOptions}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default TypeSelectorCombobox;
