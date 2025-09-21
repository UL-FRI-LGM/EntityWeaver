import { useRef } from "react";
import {
  Combobox,
  type TextInputProps,
  TextInput,
  useCombobox,
} from "@mantine/core";

interface Props {
  selectedValue: string | undefined;
  onChange: (id: string) => void;
  searchValue: string;
  setSearchValue: (val: string) => void;
  options: { val: string; display: string }[];
  label?: string;
  placeholder?: string;
  textInputProps?: TextInputProps;
  // textInputClassNames?: TextInputProps["classNames"];
  // comboboxClassNames?: ComboboxProps["classNames"];
}

const SearchableCombobox = ({
  selectedValue,
  onChange,
  searchValue,
  setSearchValue,
  options,
  label,
  placeholder,
  textInputProps,
  // textInputClassNames,
  // comboboxClassNames,
}: Props) => {
  const changed = useRef(false);
  const combobox = useCombobox({
    onDropdownClose: () => {
      if (!changed.current) {
        setSearchValue(selectedValue ?? "");
      }
      changed.current = false;
    },
  });

  return (
    <Combobox
      store={combobox}
      // classNames={comboboxClassNames}
      onOptionSubmit={(val, optionProps) => {
        setSearchValue(optionProps.children?.toString() ?? "");
        onChange(val);
        changed.current = true;
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          // classNames={textInputClassNames}
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          {...textInputProps}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={200} style={{ overflowY: "auto" }}>
          {options.map(({ val, display }) => (
            <Combobox.Option key={val} value={val}>
              {display}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default SearchableCombobox;
