import { useRef } from "react";
import {
  Combobox,
  type TextInputProps,
  TextInput,
  useCombobox,
  type ComboboxOptionProps,
} from "@mantine/core";

export interface SearchableComboboxOption {
  val: string;
  display: string;
  props?: Partial<ComboboxOptionProps>;
}

interface SearchableComboboxProps {
  selectedValue: string | undefined;
  onChange: (_id: string) => void;
  searchValue: string;
  setSearchValue: (_val: string) => void;
  options: SearchableComboboxOption[];
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
}: SearchableComboboxProps) => {
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
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
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
          onClick={() => {
            combobox.openDropdown();
          }}
          onFocus={() => {
            combobox.openDropdown();
          }}
          onBlur={() => {
            combobox.closeDropdown();
          }}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          {...textInputProps}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={200} style={{ overflowY: "auto" }}>
          {options.map(({ val, display, props }) => (
            <Combobox.Option key={val} value={val} {...props}>
              {display}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default SearchableCombobox;
