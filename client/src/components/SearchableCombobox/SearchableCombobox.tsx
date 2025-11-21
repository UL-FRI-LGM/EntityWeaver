import { useRef, useState } from "react";
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
  onChange: (_id: string, _display: string) => void;
  options: SearchableComboboxOption[];
  label?: string;
  placeholder?: string;
  textInputProps?: TextInputProps;
  // textInputClassNames?: TextInputProps["classNames"];
  // comboboxClassNames?: ComboboxProps["classNames"];
}

type StrictDataAttributes = Record<
  `data-${string}`,
  string | number | boolean | undefined
>;

const SearchableCombobox = ({
  selectedValue,
  onChange,
  options,
  label,
  placeholder,
  textInputProps,
  // textInputClassNames,
  // comboboxClassNames,
}: SearchableComboboxProps) => {
  const [searchValue, setSearchValue] = useState(selectedValue ?? "");

  const changed = useRef(false);
  const combobox = useCombobox({
    onDropdownClose: () => {
      if (!changed.current) {
        setSearchValue(selectedValue ?? "");
      }
      changed.current = false;
    },
  });

  const shouldFilterOptions = selectedValue !== searchValue;

  const filteredOptions = shouldFilterOptions
    ? options.filter((option) =>
        option.display.toLowerCase().includes(searchValue.toLowerCase().trim()),
      )
    : options;

  const onOptionSubmit = (
    val: string,
    optionProps: ComboboxOptionProps & StrictDataAttributes,
  ) => {
    const display = optionProps["data-display"]?.toString() ?? "";
    setSearchValue(display);
    onChange(val, display);
    changed.current = true;
    combobox.closeDropdown();
  };

  return (
    <Combobox
      store={combobox}
      // classNames={comboboxClassNames}
      onOptionSubmit={(val, optionProps: ComboboxOptionProps) => {
        // ComboboxOptionProps doesn't contain data- attributes
        onOptionSubmit(
          val,
          optionProps as ComboboxOptionProps & StrictDataAttributes,
        );
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
          {filteredOptions.map(({ val, display, props }) => (
            <Combobox.Option
              key={val}
              value={val}
              data-display={display}
              {...props}
            >
              {display}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default SearchableCombobox;
